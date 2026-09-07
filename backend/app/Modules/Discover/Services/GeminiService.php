<?php

namespace App\Modules\Discover\Services;

use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?string $apiKey;
    protected string $baseUrl;
    protected string $model;

    public function __construct(
        protected DiscoverService $discoverService
    ) {
        $this->apiKey = config('services.gemini.api_key');
        $this->baseUrl = rtrim((string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta/models'), '/');
        $this->model = (string) config('services.gemini.model', 'gemini-2.5-flash');
    }

    /**
     * Ask for an AI-generated K-Drama recommendation based on user prompt and tracking history.
     */
    public function askRecommendation(User $user, string $userMessage): string
    {
        $fallbackMessage = 'The recommendation service is temporarily busy. Please try again shortly.';

        if (empty($this->apiKey)) {
            Log::error('Gemini API key is not configured.');
            return $fallbackMessage;
        }

        $trackingContext = $this->buildTrackingContext($user);

        $systemInstruction = "You are a friendly, spoiler-free K-Drama expert and recommendation assistant.\n"
            . "Provide tailored, engaging K-Drama recommendations and advice based on the user's prompt and viewing history.\n\n"
            . "{$trackingContext}\n\n"
            . "Rules:\n"
            . "- Focus exclusively on Korean dramas (K-Dramas). If the user asks off-topic or non-K-Drama questions, politely decline and steer them back to K-Dramas.\n"
            . "- Keep all recommendations spoiler-free.\n"
            . "- Tailor suggestions to match user tastes while avoiding recommending shows they have already completed or are watching, unless specifically asked.\n"
            . "- Be concise, warm, and helpful.";

        $payload = [
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemInstruction],
                ],
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $userMessage],
                    ],
                ],
            ],
        ];

        $modelsToTry = array_unique(array_filter([
            $this->model,
            'gemini-3.7-flash',
            'gemini-3.6-flash',
            'gemini-3.5-flash',
        ]));

        foreach ($modelsToTry as $model) {
            $endpoint = "{$this->baseUrl}/{$model}:generateContent";

            try {
                $response = Http::when(app()->environment(['local', 'testing']), fn($client) => $client->withoutVerifying())
                    ->withHeaders([
                        'x-goog-api-key' => $this->apiKey,
                    ])
                    ->timeout(12)
                    ->connectTimeout(5)
                    ->acceptJson()
                    ->post($endpoint, $payload);

                if ($response->successful()) {
                    $reply = $response->json('candidates.0.content.parts.0.text');

                    if (!empty($reply)) {
                        return trim((string) $reply);
                    }

                    Log::error("Gemini API ({$model}) response did not contain valid candidate text: " . $response->body());
                } else {
                    $status = $response->status();
                    Log::error("Gemini API error [{$status}] on model {$model}: " . $response->body());

                    // If model is deprecated (404) or temporarily overloaded (503), try next available model
                    if (in_array($status, [404, 503], true) && $model !== end($modelsToTry)) {
                        continue;
                    }

                    return $fallbackMessage;
                }
            } catch (\Throwable $e) {
                Log::error("Gemini API request failed on model {$model}: " . $e->getMessage());
                if ($model !== end($modelsToTry)) {
                    continue;
                }
            }
        }

        return $fallbackMessage;
    }

    /**
     * Build the user's tracked viewing history context for Gemini.
     */
    protected function buildTrackingContext(User $user): string
    {
        // 1. Fetch up to 5 currently watching dramas, prioritized by most recently updated
        $watchingTrackers = $user->trackers()
            ->where('status', 'watching')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get(['tmdb_id', 'status', 'rating', 'is_favorite', 'updated_at']);

        // 2. Fetch up to 10 completed dramas, prioritized by favorite, highest rating, and most recently updated
        $completedTrackers = $user->trackers()
            ->where('status', 'completed')
            ->orderByDesc('is_favorite')
            ->orderByDesc('rating')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get(['tmdb_id', 'status', 'rating', 'is_favorite', 'updated_at']);

        $watchingLines = [];
        foreach ($watchingTrackers as $tracker) {
            $title = $this->resolveDramaTitle((int) $tracker->tmdb_id);
            if ($title !== null) {
                $watchingLines[] = $this->formatTrackerLine($tracker, $title);
            }
        }

        $completedLines = [];
        foreach ($completedTrackers as $tracker) {
            $title = $this->resolveDramaTitle((int) $tracker->tmdb_id);
            if ($title !== null) {
                $completedLines[] = $this->formatTrackerLine($tracker, $title);
            }
        }

        $sections = [];
        if (!empty($watchingLines)) {
            $sections[] = "Currently Watching:\n" . implode("\n", $watchingLines);
        }
        if (!empty($completedLines)) {
            $sections[] = "Completed:\n" . implode("\n", $completedLines);
        }

        return !empty($sections)
            ? "User's Tracked K-Drama History:\n\n" . implode("\n\n", $sections)
            : "User's Tracked K-Drama History:\nNo dramas tracked yet.";
    }

    /**
     * Resolve TMDB ID into drama title using the 24-hour cache and DiscoverService.
     */
    protected function resolveDramaTitle(int $tmdbId): ?string
    {
        try {
            $drama = Cache::remember("tmdb_tv_show_{$tmdbId}", 86400, function () use ($tmdbId) {
                return $this->discoverService->show($tmdbId);
            });

            $title = $drama['name'] ?? $drama['title'] ?? null;

            return !empty($title) ? (string) $title : null;
        } catch (\Throwable $e) {
            Log::warning("GeminiService: Failed to resolve drama title for TMDB ID [{$tmdbId}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Format a single tracker line with title, rating, and favorite status.
     */
    protected function formatTrackerLine(Tracker $tracker, string $title): string
    {
        $meta = [];

        if (!empty($tracker->rating)) {
            $meta[] = "Rated: {$tracker->rating}/10";
        }

        if (!empty($tracker->is_favorite)) {
            $meta[] = 'Favorite';
        }

        return !empty($meta)
            ? "- {$title} (" . implode(', ', $meta) . ')'
            : "- {$title}";
    }
}
