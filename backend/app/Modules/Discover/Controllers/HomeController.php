<?php

namespace App\Modules\Discover\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Discover\Services\DiscoverService;
use App\Modules\Tracker\Models\Tracker;
use App\Modules\Tracker\Services\TrackerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __construct(
        protected TrackerService $trackerService,
        protected DiscoverService $discoverService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * Get aggregated data for the Home screen dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Greeting
        $greeting = [
            'user_name' => $user->name,
        ];

        // 2. Stats
        $trackerStats = Tracker::where('user_id', $user->id)
            ->selectRaw("
                COUNT(*) as listed,
                SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                COALESCE(SUM(current_episode), 0) as episodes_watched
            ")
            ->first();

        $stats = [
            'listed'        => (int) ($trackerStats->listed ?? 0),
            'watching'      => (int) ($trackerStats->watching ?? 0),
            'completed'     => (int) ($trackerStats->completed ?? 0),
            'hours_watched' => (float) round((float) ($trackerStats->episodes_watched ?? 0), 1),
        ];

        // 3. Currently Watching
        $currentlyWatching = null;
        $watchingTracker = Tracker::where('user_id', $user->id)
            ->where('status', 'watching')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($watchingTracker) {
            $rawDrama = $this->trackerService->fetchRawDramaFromTmdb($watchingTracker->tmdb_id) ?? [];

            $imageBaseUrl = rtrim(config('services.tmdb.image_url', 'https://image.tmdb.org/t/p/original'), '/');
            $posterPath = $rawDrama['poster_path'] ?? null;
            $posterUrl = null;
            if (!empty($posterPath)) {
                $posterUrl = str_starts_with($posterPath, 'http')
                    ? $posterPath
                    : "{$imageBaseUrl}{$posterPath}";
            }

            $totalEpisodes = $watchingTracker->total_episodes
                ?: (!empty($rawDrama['number_of_episodes']) ? (int) $rawDrama['number_of_episodes'] : null);

            $currentEpisode = (int) $watchingTracker->current_episode;
            $nextEpisode = $currentEpisode + 1;
            if ($totalEpisodes !== null && $nextEpisode > $totalEpisodes) {
                $nextEpisode = $totalEpisodes;
            }

            $episodeRuntime = null;
            if (!empty($rawDrama['episode_run_time']) && is_array($rawDrama['episode_run_time'])) {
                $episodeRuntime = (int) $rawDrama['episode_run_time'][0];
            } elseif (!empty($rawDrama['last_episode_to_air']['runtime'])) {
                $episodeRuntime = (int) $rawDrama['last_episode_to_air']['runtime'];
            } elseif (!empty($rawDrama['next_episode_to_air']['runtime'])) {
                $episodeRuntime = (int) $rawDrama['next_episode_to_air']['runtime'];
            }

            $progressPercentage = $watchingTracker->progress_percentage;
            if ($progressPercentage === 0 && $totalEpisodes && $totalEpisodes > 0) {
                $progressPercentage = (int) min(100, max(0, round(($currentEpisode / $totalEpisodes) * 100)));
            }

            $currentlyWatching = [
                'id'                  => (int) $watchingTracker->id,
                'tmdb_id'             => (int) $watchingTracker->tmdb_id,
                'title'               => (string) ($rawDrama['name'] ?? $rawDrama['title'] ?? ''),
                'poster_url'          => $posterUrl,
                'current_episode'     => $currentEpisode,
                'next_episode'        => $nextEpisode,
                'total_episodes'      => $totalEpisodes,
                'episode_runtime'     => $episodeRuntime,
                'progress_percentage' => $progressPercentage,
                'status'              => (string) $watchingTracker->status,
            ];
        }

        // 4. Recommended (Discover)
        $discoverData = $this->discoverService->discover(['page' => 1], $user);
        $recommendedRaw = $discoverData['data'] ?? [];

        $imageBaseUrl = rtrim(config('services.tmdb.image_url', 'https://image.tmdb.org/t/p/original'), '/');
        $recommended = [];

        foreach ($recommendedRaw as $item) {
            $posterPath = $item['poster_path'] ?? null;
            $posterUrl = null;
            if (!empty($posterPath)) {
                $posterUrl = str_starts_with($posterPath, 'http')
                    ? $posterPath
                    : "{$imageBaseUrl}{$posterPath}";
            }

            $rating = isset($item['vote_average'])
                ? round((float) $item['vote_average'], 1)
                : (isset($item['rating']) ? round((float) $item['rating'], 1) : 0.0);

            $totalEpisodes = isset($item['number_of_episodes'])
                ? (int) $item['number_of_episodes']
                : (isset($item['total_episodes']) ? (int) $item['total_episodes'] : null);

            $recommended[] = [
                'tmdb_id'        => (int) ($item['id'] ?? $item['tmdb_id'] ?? 0),
                'title'          => (string) ($item['name'] ?? $item['title'] ?? ''),
                'poster_url'     => $posterUrl,
                'rating'         => $rating,
                'genres'         => $item['genres'] ?? [],
                'total_episodes' => $totalEpisodes,
            ];
        }

        return response()->json([
            'data' => [
                'greeting'           => $greeting,
                'stats'              => $stats,
                'currently_watching' => $currentlyWatching,
                'recommended'        => $recommended,
            ],
        ]);
    }
}
