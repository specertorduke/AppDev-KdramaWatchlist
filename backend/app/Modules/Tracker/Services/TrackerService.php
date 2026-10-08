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
use App\Modules\Discover\Models\Discover;
use App\Modules\Discover\Models\Genre;
use Illuminate\Support\Str;

class TrackerService
{
    public function __construct(
        protected DiscoverService $discoverService
    ) {}

    public function syncDiscoverFromTmdb(int $tmdbId): Discover
    {
        $discover = Discover::where('tmdb_id', $tmdbId)->first();
        if ($discover) {
            return $discover;
        }

        $tmdbDetails = $this->fetchRawDramaFromTmdb($tmdbId);
        if (!$tmdbDetails) {
            throw new NotFoundHttpException('Drama could not be found on TMDB.');
        }

        $discover = Discover::create([
            'tmdb_id' => $tmdbId,
            'title' => $tmdbDetails['name'] ?? 'Unknown',
            'original_title' => $tmdbDetails['original_name'] ?? null,
            'overview' => $tmdbDetails['overview'] ?? null,
            'poster_path' => $tmdbDetails['poster_path'] ?? null,
            'backdrop_path' => $tmdbDetails['backdrop_path'] ?? null,
            'first_air_date' => !empty($tmdbDetails['first_air_date']) ? $tmdbDetails['first_air_date'] : null,
            'rating' => isset($tmdbDetails['vote_average']) ? (float)$tmdbDetails['vote_average'] : null,
            'vote_count' => $tmdbDetails['vote_count'] ?? 0,
            'total_episodes' => $tmdbDetails['number_of_episodes'] ?? null,
            'total_seasons' => $tmdbDetails['number_of_seasons'] ?? null,
            'episode_runtime' => !empty($tmdbDetails['episode_run_time'][0]) ? $tmdbDetails['episode_run_time'][0] : null,
            'status' => $tmdbDetails['status'] ?? null,
        ]);

        if (!empty($tmdbDetails['genres'])) {
            $genreIds = [];
            foreach ($tmdbDetails['genres'] as $g) {
                if (isset($g['id']) && isset($g['name'])) {
                    $genre = Genre::firstOrCreate(
                        ['slug' => Str::slug($g['name'])],
                        ['id' => $g['id'], 'name' => $g['name']]
                    );
                    $genreIds[] = $genre->id;
                }
            }
            $discover->genres()->sync($genreIds);
        }

        return $discover;
    }

    /**
     * Retrieve user's tracked dramas with filtering, pagination, and status breakdown.
     */
    public function getUserTrackers(User $user, array $filters = []): array
    {
        $query = Tracker::where('user_id', $user->id)->with('discover');

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
            ->whereHas('discover', fn($q) => $q->where('tmdb_id', $tmdbId))
            ->with('discover')
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        $tracker->dramaMetadata = $this->getDramaDetailMetadata($tmdbId);

        return $tracker;
    }

    /**
     * Add a drama to the user's tracker.
     */
    public function storeTracker(User $user, array $data): Tracker
    {
        $tmdbId = (int) $data['tmdb_id'];

        $exists = Tracker::where('user_id', $user->id)
            ->whereHas('discover', fn($q) => $q->where('tmdb_id', $tmdbId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'tmdb_id' => ['You are already tracking this drama.'],
            ]);
        }
        
        $discover = $this->syncDiscoverFromTmdb($tmdbId);

        // Allow user override of total_episodes
        if (isset($data['total_episodes']) && $data['total_episodes'] !== null) {
            $discover->total_episodes = (int) $data['total_episodes'];
            $discover->save();
        }

        $status = $data['status'] ?? 'plan_to_watch';
        $current = (int) ($data['current_episode'] ?? 0);
        $total = $discover->total_episodes;

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
        $data['discover_id'] = $discover->id;

        unset($data['total_episodes']);
        unset($data['tmdb_id']);

        $tracker = Tracker::create(array_merge($data, [
            'user_id' => $user->id,
        ]));
        
        $tracker->load('discover');
        $tracker->dramaMetadata = $this->getDramaDetailMetadata($tmdbId);

        return $tracker;
    }

    /**
     * Update an existing tracker item for a user.
     */
    public function updateTracker(User $user, int $tmdbId, array $data): Tracker
    {
        $tracker = Tracker::where('user_id', $user->id)
            ->whereHas('discover', fn($q) => $q->where('tmdb_id', $tmdbId))
            ->with('discover')
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        // Allow user override of total_episodes
        if (array_key_exists('total_episodes', $data)) {
            $tracker->discover->total_episodes = !is_null($data['total_episodes']) ? (int) $data['total_episodes'] : null;
            $tracker->discover->save();
        }

        $newCurrent = array_key_exists('current_episode', $data)
            ? (int) $data['current_episode']
            : (int) $tracker->current_episode;

        $newTotal = $tracker->total_episodes; // Uses accessor

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

        unset($data['total_episodes']);
        unset($data['tmdb_id']);

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
            ->whereHas('discover', fn($q) => $q->where('tmdb_id', $tmdbId))
            ->with('discover')
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
            ->whereHas('discover', fn($q) => $q->where('tmdb_id', $tmdbId))
            ->first();

        if (!$tracker) {
            throw new NotFoundHttpException('Drama is not in your tracker.');
        }

        $tracker->delete();
    }

    /**
     * Fetch raw drama data from TMDB with caching.
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
