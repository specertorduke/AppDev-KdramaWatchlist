<?php

namespace Tests\Feature;

use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HomeTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        \Illuminate\Support\Facades\Cache::flush();
        \App\Modules\Discover\Services\DiscoverService::resetCache();

        $this->user = User::factory()->create([
            'name' => 'Ji-young',
        ]);
        $this->otherUser = User::factory()->create([
            'name' => 'Min-ho',
        ]);
    }

    protected function mockDiscoverAndGenres(): void
    {
        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 28, 'name' => 'Action'],
                    ['id' => 53, 'name' => 'Thriller'],
                    ['id' => 10749, 'name' => 'Romance'],
                ],
            ], 200),
            '*/discover/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 10,
                'total_results' => 200,
                'results' => [
                    [
                        'id' => 56789,
                        'name' => "Devil's Pact",
                        'poster_path' => '/devil_pact.jpg',
                        'vote_average' => 8.9,
                        'genre_ids' => [53, 28],
                        'number_of_episodes' => 14,
                        'first_air_date' => '2024-01-01',
                    ],
                ],
            ], 200),
        ]);
    }

    public function test_guest_cannot_access_home_endpoint(): void
    {
        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_empty_watchlist(): void
    {
        Sanctum::actingAs($this->user);
        $this->mockDiscoverAndGenres();

        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'greeting' => [
                        'user_name' => 'Ji-young',
                    ],
                    'stats' => [
                        'listed' => 0,
                        'watching' => 0,
                        'completed' => 0,
                        'hours_watched' => 0,
                    ],
                    'currently_watching' => null,
                    'recommended' => [
                        [
                            'tmdb_id' => 56789,
                            'title' => "Devil's Pact",
                            'poster_url' => 'https://image.tmdb.org/t/p/original/devil_pact.jpg',
                            'rating' => 8.9,
                            'genres' => ['Thriller', 'Action'],
                            'total_episodes' => 14,
                        ],
                    ],
                ],
            ]);
    }

    public function test_authenticated_user_with_populated_watchlist_and_currently_watching(): void
    {
        Sanctum::actingAs($this->user);

        // Trackers
        $watchingTracker = $this->createTestTracker([
            'user_id' => $this->user->id,
            'tmdb_id' => 12345,
            'status' => 'watching',
            'current_episode' => 3,
            'total_episodes' => 16,
        ]);

        $this->createTestTracker([
            'user_id' => $this->user->id,
            'tmdb_id' => 22222,
            'status' => 'completed',
            'current_episode' => 14,
            'total_episodes' => 14,
        ]);

        $this->createTestTracker([
            'user_id' => $this->user->id,
            'tmdb_id' => 33333,
            'status' => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes' => 16,
        ]);

        $this->createTestTracker([
            'user_id' => $this->user->id,
            'tmdb_id' => 44444,
            'status' => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes' => 12,
        ]);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 28, 'name' => 'Action'],
                    ['id' => 53, 'name' => 'Thriller'],
                ],
            ], 200),
            '*/discover/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 10,
                'total_results' => 200,
                'results' => [
                    [
                        'id' => 56789,
                        'name' => "Devil's Pact",
                        'poster_path' => '/devil_pact.jpg',
                        'vote_average' => 8.9,
                        'genre_ids' => [53, 28],
                        'number_of_episodes' => 14,
                    ],
                ],
            ], 200),
            '*/tv/12345*' => Http::response([
                'id' => 12345,
                'name' => 'Midnight in Seoul',
                'poster_path' => '/midnight.jpg',
                'number_of_episodes' => 16,
                'episode_run_time' => [65],
                'genres' => [['id' => 18, 'name' => 'Drama']],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'greeting' => [
                        'user_name' => 'Ji-young',
                    ],
                    'stats' => [
                        'listed' => 4,
                        'watching' => 1,
                        'completed' => 1,
                        'hours_watched' => 17,
                    ],
                    'currently_watching' => [
                        'id' => $watchingTracker->id,
                        'tmdb_id' => 12345,
                        'title' => 'Midnight in Seoul',
                        'poster_url' => 'https://image.tmdb.org/t/p/original/midnight.jpg',
                        'current_episode' => 3,
                        'next_episode' => 4,
                        'total_episodes' => 16,
                        'episode_runtime' => 65,
                        'progress_percentage' => 19,
                        'status' => 'watching',
                    ],
                    'recommended' => [
                        [
                            'tmdb_id' => 56789,
                            'title' => "Devil's Pact",
                            'poster_url' => 'https://image.tmdb.org/t/p/original/devil_pact.jpg',
                            'rating' => 8.9,
                            'genres' => ['Thriller', 'Action'],
                            'total_episodes' => 14,
                        ],
                    ],
                ],
            ]);
    }

    public function test_picks_most_recently_updated_watching_drama(): void
    {
        Sanctum::actingAs($this->user);

        $older = $this->createTestTracker([
            'user_id' => $this->user->id,
            'tmdb_id' => 11111,
            'status' => 'watching',
            'current_episode' => 2,
            'total_episodes' => 16,
        ]);
        $older->timestamps = false;
        $older->updated_at = now()->subDays(2);
        $older->save();

        $newer = $this->createTestTracker([
            'user_id' => $this->user->id,
            'tmdb_id' => 22222,
            'status' => 'watching',
            'current_episode' => 5,
            'total_episodes' => 16,
        ]);
        $newer->timestamps = false;
        $newer->updated_at = now();
        $newer->save();

        Http::fake([
            '*/genre/tv/list*' => Http::response(['genres' => []], 200),
            '*/discover/tv*' => Http::response(['results' => []], 200),
            '*/tv/22222*' => Http::response([
                'id' => 22222,
                'name' => 'Recent Watching Drama',
                'poster_path' => '/recent.jpg',
                'number_of_episodes' => 16,
                'episode_run_time' => [60],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(200);
        $this->assertEquals($newer->id, $response->json('data.currently_watching.id'));
        $this->assertEquals(22222, $response->json('data.currently_watching.tmdb_id'));
        $this->assertEquals('Recent Watching Drama', $response->json('data.currently_watching.title'));
    }

    public function test_other_users_trackers_do_not_bleed_into_home_stats(): void
    {
        Sanctum::actingAs($this->user);

        // Other user has trackers
        $this->createTestTracker([
            'user_id' => $this->otherUser->id,
            'tmdb_id' => 99999,
            'status' => 'watching',
            'current_episode' => 10,
            'total_episodes' => 20,
        ]);

        // Current user has no trackers
        $this->mockDiscoverAndGenres();

        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'greeting' => [
                        'user_name' => 'Ji-young',
                    ],
                    'stats' => [
                        'listed' => 0,
                        'watching' => 0,
                        'completed' => 0,
                        'hours_watched' => 0,
                    ],
                    'currently_watching' => null,
                ],
            ]);
    }

    public function test_home_allows_refreshing_recommendations_with_rec_page(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response(['genres' => [['id' => 18, 'name' => 'Drama']]], 200),
            '*/discover/tv*' => Http::response([
                'page' => 2,
                'total_pages' => 10,
                'total_results' => 200,
                'results' => [
                    [
                        'id' => 77777,
                        'name' => 'Page 2 Drama',
                        'poster_path' => '/page2.jpg',
                        'vote_average' => 8.5,
                        'genre_ids' => [18],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/home?rec_page=2');

        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('data.rec_page'));
        $this->assertEquals('Page 2 Drama', $response->json('data.recommended.0.title'));

        Http::assertSent(function (\Illuminate\Http\Client\Request $request) {
            return str_contains($request->url(), 'discover/tv') &&
                   str_contains($request->url(), 'page=2');
        });
    }

    public function test_home_recommends_thriller_and_horror_when_in_user_favorite_genres(): void
    {
        $thriller = \App\Modules\Discover\Models\Genre::firstOrCreate(['name' => 'Thriller', 'slug' => 'thriller']);
        $horror = \App\Modules\Discover\Models\Genre::firstOrCreate(['name' => 'Horror', 'slug' => 'horror']);
        $this->user->favoriteGenres()->sync([$thriller->id, $horror->id]);

        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response(['genres' => [['id' => 18, 'name' => 'Drama']]], 200),
            '*/discover/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 5,
                'total_results' => 100,
                'results' => [
                    [
                        'id' => 88888,
                        'name' => 'Dark Suspense',
                        'poster_path' => '/dark.jpg',
                        'vote_average' => 8.7,
                        'genre_ids' => [18],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(200);
        $recommended = $response->json('data.recommended');
        $this->assertNotEmpty($recommended);

        // Verify that discover/tv was called with keywords (for Thriller and Horror)
        Http::assertSent(function (\Illuminate\Http\Client\Request $request) {
            return str_contains($request->url(), 'discover/tv') &&
                   str_contains($request->url(), 'with_keywords=');
        });
    }
}
