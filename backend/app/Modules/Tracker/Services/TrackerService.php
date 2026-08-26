<?php

namespace App\Modules\Tracker\Services;

use App\Modules\Auth\Models\User;
use App\Modules\Discover\Resources\DramaCardResource;
use App\Modules\Discover\Resources\DramaDetailResource;
use App\Modules\Discover\Services\DiscoverService;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TrackerService
{
    public function __construct(
        protected DiscoverService $discoverService
    ) {}

    /**
     * Retrieve user's tracked dramas with filtering, pagination, and status breakdown.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: LengthAwarePaginator, counts: array<string, int>}
     */
    public function getUserTrackers(User $user, array $filters = []): array
    {
        $query = Tracker::where('user_id', $user->id);

        $status = $filters['status'] ?? 'all';
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        if (isset($filters['favorite']) && filter_var($filters['favorite'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== null) {
            $query->where('is_favorite', filter_var($filters['favorite'], FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $paginator = $query->orderBy('updated_at', 'desc')->paginate($perPage, ['*'], 'page', $page);

        // Attach TMDB drama metadata to each item
        foreach ($paginator->items() as $tracker) {
            $tracker->dramaMetadata = $this->getDramaCardMetadata($tracker->tmdb_id);
        }

        // Calculate counts by status for the user
        $rawCounts = Tracker::where('user_id', $user->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $favoritesCount = Tracker::where('user_id', $user->id)
            ->where('is_favorite', true)
            ->count();

        $allStatuses = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'];
        $counts = [
            'all'       => array_sum($rawCounts),
            'favorites' => $favoritesCount,
        ];

        foreach ($allStatuses as $st) {
            $counts[$st] = (int) ($rawCounts[$st] ?? 0);
        }

        return [
            'paginator' => $paginator,
            'counts'    => $counts,
        ];
    }

    /**
     * Get a specific tracker item for a user by TMDB ID.
     */
    public function getTracker(User $user, int $tmdbId): Tracker
    {
        $tracker = Tracker::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        $tracker->dramaMetadata = $this->getDramaDetailMetadata($tmdbId);

        return $tracker;
    }

    /**
     * Add a drama to the user's tracker.
     *
     * @param  array<string, mixed>  $data
     */
    public function storeTracker(User $user, array $data): Tracker
    {
        $tmdbId = (int) $data['tmdb_id'];

        $exists = Tracker::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'tmdb_id' => ['You are already tracking this drama.'],
            ]);
        }

        // If total_episodes is not provided or empty, attempt to fetch from TMDB
        if (empty($data['total_episodes'])) {
            $tmdbDetails = $this->fetchRawDramaFromTmdb($tmdbId);
            if (!empty($tmdbDetails['number_of_episodes'])) {
                $data['total_episodes'] = (int) $tmdbDetails['number_of_episodes'];
            }
        }

        $status = $data['status'] ?? 'plan_to_watch';
        $current = (int) ($data['current_episode'] ?? 0);
        $total = isset($data['total_episodes']) ? (int) $data['total_episodes'] : null;

        if ($total !== null && $current > $total) {
            throw ValidationException::withMessages([
                'current_episode' => ['The current episode cannot exceed the total episodes.'],
            ]);
        }

        // Auto-complete if current episode reaches total
        if ($total !== null && $total > 0 && $current >= $total) {
            $status = 'completed';
        }

        $data['status'] = $status;
        $data['current_episode'] = $current;
        $data['rewatch_count'] = (int) ($data['rewatch_count'] ?? 0);

        $tracker = Tracker::create(array_merge($data, [
            'user_id' => $user->id,
        ]));

        $tracker->dramaMetadata = $this->getDramaDetailMetadata($tmdbId);

        return $tracker;
    }

    /**
     * Update an existing tracker item for a user.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateTracker(User $user, int $tmdbId, array $data): Tracker
    {
        $tracker = Tracker::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        $newCurrent = array_key_exists('current_episode', $data)
            ? (int) $data['current_episode']
            : (int) $tracker->current_episode;

        $newTotal = array_key_exists('total_episodes', $data)
            ? (!is_null($data['total_episodes']) ? (int) $data['total_episodes'] : null)
            : $tracker->total_episodes;

        if ($newTotal !== null && $newCurrent > $newTotal) {
            throw ValidationException::withMessages([
                'current_episode' => ['The current episode cannot exceed the total episodes.'],
            ]);
        }

        // Auto status transitions if status was not explicitly provided
        if (!isset($data['status'])) {
            if ($newTotal !== null && $newTotal > 0 && $newCurrent >= $newTotal) {
                $data['status'] = 'completed';
            } elseif ($tracker->status === 'completed' && $newCurrent < $newTotal) {
                $data['status'] = $newCurrent === 0 ? 'plan_to_watch' : 'watching';
            } elseif ($tracker->status === 'plan_to_watch' && $newCurrent > 0) {
                $data['status'] = 'watching';
            }
        }

        $tracker->update($data);

        $tracker->dramaMetadata = $this->getDramaDetailMetadata($tmdbId);

        return $tracker;
    }

    /**
     * Increment the current episode by 1.
     */
    public function incrementEpisode(User $user, int $tmdbId): Tracker
    {
        $tracker = Tracker::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        if ($tracker->total_episodes !== null && $tracker->current_episode >= $tracker->total_episodes) {
            throw ValidationException::withMessages([
                'current_episode' => ['Current episode is already at the maximum total episodes.'],
            ]);
        }

        $tracker->current_episode += 1;

        if ($tracker->total_episodes !== null && $tracker->current_episode >= $tracker->total_episodes) {
            $tracker->status = 'completed';
        }

        $tracker->save();

        $tracker->dramaMetadata = $this->getDramaDetailMetadata($tmdbId);

        return $tracker;
    }

    /**
     * Delete a tracker item for a user.
     */
    public function deleteTracker(User $user, int $tmdbId): void
    {
        $tracker = Tracker::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        $tracker->delete();
    }

    /**
     * Fetch raw drama data from TMDB with caching.
     *
     * @return array<string, mixed>|null
     */
    public function fetchRawDramaFromTmdb(int $tmdbId): ?array
    {
        try {
            return Cache::remember("tmdb_tv_show_{$tmdbId}", 86400, function () use ($tmdbId) {
                return $this->discoverService->show($tmdbId);
            });
        } catch (\Throwable $e) {
            Log::warning("Failed to fetch TMDB drama [{$tmdbId}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Fetch raw season data (including episodes) from TMDB with caching.
     *
     * @return array<string, mixed>|null
     */
    public function fetchSeasonDetailsFromTmdb(int $tmdbId, int $seasonNumber = 1): ?array
    {
        try {
            return Cache::remember("tmdb_tv_{$tmdbId}_season_{$seasonNumber}", 86400, function () use ($tmdbId, $seasonNumber) {
                return $this->discoverService->season($tmdbId, $seasonNumber);
            });
        } catch (\Throwable $e) {
            Log::warning("Failed to fetch TMDB season {$seasonNumber} for [{$tmdbId}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get lightweight drama card metadata for tracker lists.
     *
     * @return array<string, mixed>|null
     */
    public function getDramaCardMetadata(int $tmdbId): ?array
    {
        $raw = $this->fetchRawDramaFromTmdb($tmdbId);
        if (!$raw) {
            return null;
        }

        return (new DramaCardResource($raw))->resolve();
    }

    /**
     * Get comprehensive drama detail metadata for individual tracker items.
     *
     * @return array<string, mixed>|null
     */
    public function getDramaDetailMetadata(int $tmdbId): ?array
    {
        $raw = $this->fetchRawDramaFromTmdb($tmdbId);
        if (!$raw) {
            return null;
        }

        if (empty($raw['episodes'])) {
            $seasonData = $this->fetchSeasonDetailsFromTmdb($tmdbId, 1);
            if (!empty($seasonData['episodes'])) {
                $raw['episodes'] = $seasonData['episodes'];
            }
        }

        return (new DramaDetailResource($raw))->resolve();
    }
}
