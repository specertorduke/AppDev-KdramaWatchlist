<?php

namespace Tests\Feature;

use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DramaAiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        config(['services.gemini.api_key' => 'test-api-key']);
        config(['services.gemini.base_url' => 'https://generativelanguage.googleapis.com/v1beta/models']);
        config(['services.gemini.model' => 'gemini-2.5-flash']);

        $this->user = User::factory()->create();
    }

    /**
     * Test guest cannot access the chatbot endpoint.
     */
    public function test_guest_cannot_access_chatbot_endpoint(): void
    {
        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Recommend me a thriller K-drama',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test authenticated user receives AI recommendations with drama titles and tracking metadata injected.
     */
    public function test_authenticated_user_receives_ai_recommendations(): void
    {
        Sanctum::actingAs($this->user);

        // Add tracked dramas for context
        Tracker::create([
            'user_id'     => $this->user->id,
            'tmdb_id'     => 99901,
            'status'      => 'completed',
            'rating'      => 10,
            'is_favorite' => true,
        ]);
        Tracker::create([
            'user_id'     => $this->user->id,
            'tmdb_id'     => 99902,
            'status'      => 'watching',
            'current_episode' => 4,
            'total_episodes'  => 16,
        ]);
        Tracker::create([
            'user_id'     => $this->user->id,
            'tmdb_id'     => 99903,
            'status'      => 'completed',
            'rating'      => 9,
            'is_favorite' => false,
        ]);

        $expectedReply = 'I recommend Queen of Tears!';

        Http::fake([
            '*/tv/99901*' => Http::response([
                'id'   => 99901,
                'name' => 'Crash Landing on You',
            ], 200),
            '*/tv/99902*' => Http::response([
                'id'   => 99902,
                'name' => 'Lovely Runner',
            ], 200),
            '*/tv/99903*' => Http::response([
                'id'   => 99903,
                'name' => 'Business Proposal',
            ], 200),
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => $expectedReply],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Can you recommend a great romantic comedy K-Drama?',
        ]);

        $response->assertOk()
            ->assertJson([
                'reply' => $expectedReply,
            ]);

        // Verify request payload contained resolved drama titles and structured context
        Http::assertSent(function (Request $request) {
            $data = $request->data();
            $systemText = $data['system_instruction']['parts'][0]['text'] ?? '';
            $userText = $data['contents'][0]['parts'][0]['text'] ?? '';

            return str_contains($request->url(), 'gemini-2.5-flash:generateContent')
                && $request->hasHeader('x-goog-api-key', 'test-api-key')
                && str_contains($systemText, "Currently Watching:\n- Lovely Runner")
                && str_contains($systemText, "Completed:\n- Crash Landing on You (Rated: 10/10, Favorite)\n- Business Proposal (Rated: 9/10)")
                && !str_contains($systemText, 'Completed dramas (TMDB IDs):')
                && $userText === 'Can you recommend a great romantic comedy K-Drama?';
        });
    }

    /**
     * Test tracking context is capped at 5 watching and 10 completed dramas.
     */
    public function test_context_is_capped_at_five_watching_and_ten_completed_dramas(): void
    {
        Sanctum::actingAs($this->user);

        // Create 8 watching dramas
        for ($i = 1; $i <= 8; $i++) {
            Tracker::create([
                'user_id'    => $this->user->id,
                'tmdb_id'    => 100 + $i,
                'status'     => 'watching',
                'updated_at' => now()->addMinutes($i),
            ]);
        }

        // Create 15 completed dramas
        for ($i = 1; $i <= 15; $i++) {
            Tracker::create([
                'user_id'     => $this->user->id,
                'tmdb_id'     => 200 + $i,
                'status'      => 'completed',
                'rating'      => ($i % 10) + 1,
                'is_favorite' => $i > 10,
                'updated_at'  => now()->addMinutes($i),
            ]);
        }

        Http::fake(function (Request $request) {
            if (str_contains($request->url(), 'generativelanguage.googleapis.com')) {
                return Http::response([
                    'candidates' => [
                        ['content' => ['parts' => [['text' => 'AI recommendation']]]],
                    ],
                ], 200);
            }

            if (preg_match('/tv\/(\d+)/', $request->url(), $matches)) {
                $id = $matches[1];
                return Http::response([
                    'id'   => (int) $id,
                    'name' => "Drama {$id}",
                ], 200);
            }

            return Http::response([], 404);
        });

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Give me recommendations',
        ]);

        $response->assertOk();

        Http::assertSent(function (Request $request) {
            if (!str_contains($request->url(), 'generateContent')) {
                return false;
            }

            $systemText = $request->data()['system_instruction']['parts'][0]['text'] ?? '';

            // Count occurrences in Currently Watching and Completed sections
            preg_match('/Currently Watching:\n(.*?)(?=\n\nCompleted:|\n\nRules:|$)/s', $systemText, $watchingSection);
            preg_match('/Completed:\n(.*?)(?=\n\nRules:|$)/s', $systemText, $completedSection);

            $watchingCount = isset($watchingSection[1]) ? substr_count($watchingSection[1], '- Drama ') : 0;
            $completedCount = isset($completedSection[1]) ? substr_count($completedSection[1], '- Drama ') : 0;

            return $watchingCount === 5 && $completedCount === 10;
        });
    }

    /**
     * Test individual TMDB resolution failure does not fail the chatbot request.
     */
    public function test_individual_tmdb_failure_does_not_fail_chatbot(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id' => $this->user->id,
            'tmdb_id' => 77701,
            'status'  => 'watching',
        ]);
        Tracker::create([
            'user_id' => $this->user->id,
            'tmdb_id' => 77702,
            'status'  => 'completed',
        ]);

        Http::fake([
            '*/tv/77701*' => Http::response(['message' => 'Internal server error'], 500),
            '*/tv/77702*' => Http::response(['id' => 77702, 'name' => 'Descendants of the Sun'], 200),
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [
                    ['content' => ['parts' => [['text' => 'Here is your recommendation']]]],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Suggest something historical',
        ]);

        $response->assertOk()
            ->assertJson(['reply' => 'Here is your recommendation']);

        Http::assertSent(function (Request $request) {
            if (!str_contains($request->url(), 'generateContent')) {
                return false;
            }

            $systemText = $request->data()['system_instruction']['parts'][0]['text'] ?? '';

            // 77701 failed, so Currently Watching should be omitted; 77702 succeeded
            return str_contains($systemText, 'Descendants of the Sun')
                && !str_contains($systemText, '77701');
        });
    }

    /**
     * Test cached TMDB data is reused without making external TMDB requests.
     */
    public function test_cached_tmdb_data_is_reused(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id' => $this->user->id,
            'tmdb_id' => 88888,
            'status'  => 'watching',
        ]);

        // Pre-populate TMDB 24-hour cache
        cache()->put('tmdb_tv_show_88888', [
            'id'   => 88888,
            'name' => 'Vincenzo',
        ], 86400);

        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [
                    ['content' => ['parts' => [['text' => 'Enjoy Vincenzo!']]]],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'What to watch next?',
        ]);

        $response->assertOk()
            ->assertJson(['reply' => 'Enjoy Vincenzo!']);

        // Assert NO TMDB HTTP request was dispatched
        Http::assertNotSent(function (Request $request) {
            return str_contains($request->url(), 'tv/88888');
        });

        // Assert Gemini received the cached drama title
        Http::assertSent(function (Request $request) {
            $systemText = $request->data()['system_instruction']['parts'][0]['text'] ?? '';
            return str_contains($request->url(), 'generateContent')
                && str_contains($systemText, '- Vincenzo');
        });
    }

    /**
     * Test chatbot validation rejects empty or excessive prompts.
     */
    public function test_chatbot_validation_rejects_empty_or_excessive_prompts(): void
    {
        Sanctum::actingAs($this->user);

        // Missing message
        $response = $this->postJson('/api/v1/discover/chatbot', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);

        // Empty message
        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => '',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);

        // Too short (< 2 characters)
        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'a',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);

        // Too long (> 500 characters)
        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => str_repeat('k', 501),
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /**
     * Test chatbot gracefully handles Gemini API failures with fallback message.
     */
    public function test_chatbot_gracefully_handles_gemini_api_failures(): void
    {
        Sanctum::actingAs($this->user);

        $fallbackMessage = 'The recommendation service is temporarily busy. Please try again shortly.';

        // Case 1: HTTP 500 Server Error
        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'error' => [
                    'code' => 500,
                    'message' => 'Internal server error',
                ],
            ], 500),
        ]);

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Recommend me something fun to watch!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'reply' => $fallbackMessage,
            ]);

        // Case 2: HTTP 429 Quota / Rate Limit Reached
        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'error' => [
                    'code' => 429,
                    'message' => 'Resource has been exhausted',
                ],
            ], 429),
        ]);

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Recommend me something romantic!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'reply' => $fallbackMessage,
            ]);

        // Case 3: Missing API key
        config(['services.gemini.api_key' => null]);

        $response = $this->postJson('/api/v1/discover/chatbot', [
            'message' => 'Recommend me something historical!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'reply' => $fallbackMessage,
            ]);
    }
}
