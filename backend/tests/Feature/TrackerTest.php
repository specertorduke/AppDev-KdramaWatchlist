<?php

namespace Tests\Feature;

use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrackerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    // ==========================================
    // 1. Unauthenticated / Guest Tests (HTTP 401)
    // ==========================================

    public function test_guest_cannot_access_tracker_index(): void
    {
        $response = $this->getJson('/api/v1/tracker');
        $response->assertStatus(401);
    }

    public function test_guest_cannot_get_tracker_detail(): void
    {
        $response = $this->getJson('/api/v1/tracker/12345');
        $response->assertStatus(401);
    }

    public function test_guest_cannot_create_tracker(): void
    {
        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id' => 12345,
            'status'  => 'watching',
        ]);
        $response->assertStatus(401);
    }

    public function test_guest_cannot_update_tracker(): void
    {
        $response = $this->patchJson('/api/v1/tracker/12345', [
            'status' => 'completed',
        ]);
        $response->assertStatus(401);
    }

    public function test_guest_cannot_increment_tracker(): void
    {
        $response = $this->postJson('/api/v1/tracker/12345/increment');
        $response->assertStatus(401);
    }

    public function test_guest_cannot_delete_tracker(): void
    {
        $response = $this->deleteJson('/api/v1/tracker/12345');
        $response->assertStatus(401);
    }

    // ==========================================
    // 2. Creation Tests (POST /tracker)
    // ==========================================

    public function test_authenticated_user_can_create_tracker_with_explicit_total_episodes(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/12345*' => Http::response([
                'id' => 12345,
                'name' => 'Queen of Tears',
                'number_of_episodes' => 16,
                'poster_path' => '/poster.jpg',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 4,
            'total_episodes'  => 16,
            'rating'          => 9,
            'review_notes'    => 'Great drama!',
            'rewatch_count'   => 0,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.tmdb_id', 12345)
            ->assertJsonPath('data.status', 'watching')
            ->assertJsonPath('data.current_episode', 4)
            ->assertJsonPath('data.total_episodes', 16)
            ->assertJsonPath('data.progress_percentage', 25)
            ->assertJsonPath('data.rating', 9)
            ->assertJsonPath('data.review_notes', 'Great drama!');

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 4,
            'total_episodes'  => 16,
            'rating'          => 9,
        ]);
    }

    public function test_total_episodes_is_auto_fetched_from_tmdb_when_omitted(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/67890*' => Http::response([
                'id' => 67890,
                'name' => 'Crash Landing on You',
                'number_of_episodes' => 16,
                'poster_path' => '/poster2.jpg',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id' => 67890,
            'status'  => 'plan_to_watch',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.tmdb_id', 67890)
            ->assertJsonPath('data.total_episodes', 16)
            ->assertJsonPath('data.current_episode', 0)
            ->assertJsonPath('data.progress_percentage', 0);

        $this->assertDatabaseHas('trackers', [
            'user_id'        => $this->user->id,
            'tmdb_id'        => 67890,
            'total_episodes' => 16,
        ]);
    }

    public function test_authenticated_user_can_create_tracker_with_only_tmdb_id(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/99999*' => Http::response([
                'id' => 99999,
                'name' => 'Goblin',
                'number_of_episodes' => 16,
                'poster_path' => '/goblin.jpg',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id' => 99999,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.tmdb_id', 99999)
            ->assertJsonPath('data.status', 'plan_to_watch')
            ->assertJsonPath('data.current_episode', 0)
            ->assertJsonPath('data.total_episodes', 16)
            ->assertJsonPath('data.progress_percentage', 0);

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 99999,
            'status'          => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes'  => 16,
        ]);
    }

    public function test_duplicate_tracker_creation_is_rejected_with_422(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 1,
            'total_episodes'  => 16,
        ]);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id' => 12345,
            'status'  => 'plan_to_watch',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tmdb_id']);
    }

    public function test_store_validation_errors(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id'         => 'invalid',
            'status'          => 'invalid_status',
            'current_episode' => 20,
            'total_episodes'  => 16,
            'rating'          => 15,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tmdb_id', 'status', 'current_episode', 'rating']);
    }

    // ==========================================
    // 3. Retrieval Tests (GET /tracker & GET /tracker/{tmdb_id})
    // ==========================================

    public function test_user_can_only_view_their_own_trackers(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 111,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        Tracker::create([
            'user_id'         => $this->otherUser->id,
            'tmdb_id'         => 222,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/111*' => Http::response(['id' => 111, 'name' => 'Drama 1'], 200),
            '*/tv/222*' => Http::response(['id' => 222, 'name' => 'Drama 2'], 200),
        ]);

        $response = $this->getJson('/api/v1/tracker');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tmdb_id', 111)
            ->assertJsonPath('meta.counts.all', 1)
            ->assertJsonPath('meta.counts.watching', 1);
    }

    public function test_status_filtering_works(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 101,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 102,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 103,
            'status'          => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/*' => Http::response(['id' => 101, 'name' => 'Drama'], 200),
        ]);

        // Filter by watching
        $responseWatching = $this->getJson('/api/v1/tracker?status=watching');
        $responseWatching->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tmdb_id', 101)
            ->assertJsonPath('meta.counts.all', 3)
            ->assertJsonPath('meta.counts.watching', 1)
            ->assertJsonPath('meta.counts.completed', 1)
            ->assertJsonPath('meta.counts.plan_to_watch', 1);

        // Filter by completed
        $responseCompleted = $this->getJson('/api/v1/tracker?status=completed');
        $responseCompleted->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tmdb_id', 102);

        // Filter by all
        $responseAll = $this->getJson('/api/v1/tracker?status=all');
        $responseAll->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_get_tracker_detail_returns_404_if_not_tracked(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/tracker/99999');
        $response->assertStatus(404);
    }

    public function test_get_tracker_detail_success(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 8,
            'total_episodes'  => 16,
            'rating'          => 9,
            'review_notes'    => 'Halfway through, amazing!',
            'rewatch_count'   => 0,
        ]);

        Http::fake([
            '*/tv/12345/season/1*' => Http::response([
                'id' => 999,
                'name' => 'Season 1',
                'season_number' => 1,
                'episodes' => [
                    [
                        'id' => 5001,
                        'episode_number' => 1,
                        'name' => 'Miracle Love',
                        'overview' => 'Baek Hyun-woo and Hong Hae-in...',
                        'runtime' => 78,
                        'still_path' => '/still1.jpg',
                        'vote_average' => 8.7,
                        'air_date' => '2024-03-09',
                    ],
                    [
                        'id' => 5002,
                        'episode_number' => 2,
                        'name' => 'The Secret',
                        'overview' => 'Tensions rise as secret unfolds...',
                        'runtime' => 80,
                        'still_path' => '/still2.jpg',
                        'vote_average' => 8.9,
                        'air_date' => '2024-03-10',
                    ],
                ],
            ], 200),
            '*/tv/12345*' => Http::response([
                'id' => 12345,
                'name' => 'Queen of Tears',
                'original_name' => '눈물의 여왕',
                'poster_path' => '/poster.jpg',
                'backdrop_path' => '/backdrop.jpg',
                'first_air_date' => '2024-03-09',
                'vote_average' => 8.8,
                'vote_count' => 120,
                'genres' => [['id' => 18, 'name' => 'Drama']],
                'overview' => 'Synopsis here',
                'status' => 'Ended',
                'number_of_seasons' => 1,
                'number_of_episodes' => 16,
                'seasons' => [
                    [
                        'id' => 999,
                        'name' => 'Season 1',
                        'season_number' => 1,
                        'episode_count' => 16,
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/tracker/12345');

        $response->assertStatus(200)
            ->assertJsonPath('data.tmdb_id', 12345)
            ->assertJsonPath('data.status', 'watching')
            ->assertJsonPath('data.current_episode', 8)
            ->assertJsonPath('data.total_episodes', 16)
            ->assertJsonPath('data.progress_percentage', 50)
            ->assertJsonPath('data.rating', 9)
            ->assertJsonPath('data.review_notes', 'Halfway through, amazing!')
            ->assertJsonPath('data.drama.title', 'Queen of Tears')
            ->assertJsonPath('data.drama.number_of_episodes', 16)
            ->assertJsonPath('data.drama.seasons.0.episode_count', 16)
            ->assertJsonCount(2, 'data.drama.episodes')
            ->assertJsonPath('data.drama.episodes.0.episode_number', 1)
            ->assertJsonPath('data.drama.episodes.0.name', 'Miracle Love')
            ->assertJsonPath('data.drama.episodes.0.runtime', 78)
            ->assertJsonPath('data.drama.episodes.0.still_url', 'https://image.tmdb.org/t/p/original/still1.jpg');
    }

    // ==========================================
    // 4. Update Tests (PATCH /tracker/{tmdb_id})
    // ==========================================

    public function test_user_can_update_tracker(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'status'        => 'completed',
            'rating'        => 10,
            'review_notes'  => 'Masterpiece!',
            'rewatch_count' => 1,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.rating', 10)
            ->assertJsonPath('data.review_notes', 'Masterpiece!')
            ->assertJsonPath('data.rewatch_count', 1);

        $this->assertDatabaseHas('trackers', [
            'user_id'       => $this->user->id,
            'tmdb_id'       => 12345,
            'status'        => 'completed',
            'rating'        => 10,
            'rewatch_count' => 1,
        ]);
    }

    public function test_user_cannot_update_current_episode_greater_than_total(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'current_episode' => 20,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_episode']);
    }

    public function test_user_cannot_update_another_users_tracker(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->otherUser->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'rating' => 10,
        ]);

        $response->assertStatus(404);
    }

    public function test_patch_current_episode_sets_exact_progress_directly(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'current_episode' => 5,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.current_episode', 5)
            ->assertJsonPath('data.progress_percentage', 31)
            ->assertJsonPath('data.status', 'watching');

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'current_episode' => 5,
            'status'          => 'watching',
        ]);
    }

    public function test_patch_current_episode_to_max_auto_completes_status(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 8,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'current_episode' => 16,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.current_episode', 16)
            ->assertJsonPath('data.progress_percentage', 100)
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'current_episode' => 16,
            'status'          => 'completed',
        ]);
    }

    public function test_patch_current_episode_decreases_and_reverts_completed_to_watching(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'current_episode' => 14,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.current_episode', 14)
            ->assertJsonPath('data.progress_percentage', 88)
            ->assertJsonPath('data.status', 'watching');

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'current_episode' => 14,
            'status'          => 'watching',
        ]);
    }

    public function test_patch_current_episode_to_zero_reverts_completed_to_plan_to_watch(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->patchJson('/api/v1/tracker/12345', [
            'current_episode' => 0,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.current_episode', 0)
            ->assertJsonPath('data.progress_percentage', 0)
            ->assertJsonPath('data.status', 'plan_to_watch');

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'current_episode' => 0,
            'status'          => 'plan_to_watch',
        ]);
    }

    // ==========================================
    // 5. Episode Increment Tests (POST /tracker/{tmdb_id}/increment)
    // ==========================================

    public function test_increment_episode_increases_current_episode_by_1(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 5,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker/12345/increment');

        $response->assertStatus(200)
            ->assertJsonPath('data.current_episode', 6)
            ->assertJsonPath('data.status', 'watching');

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'current_episode' => 6,
        ]);
    }

    public function test_increment_episode_auto_completes_when_reaching_total_episodes(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 15,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker/12345/increment');

        $response->assertStatus(200)
            ->assertJsonPath('data.current_episode', 16)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.progress_percentage', 100);

        $this->assertDatabaseHas('trackers', [
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'current_episode' => 16,
            'status'          => 'completed',
        ]);
    }

    public function test_increment_fails_when_current_episode_is_already_at_total(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
        ]);

        $response = $this->postJson('/api/v1/tracker/12345/increment');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_episode']);
    }

    // ==========================================
    // 6. Deletion Tests (DELETE /tracker/{tmdb_id})
    // ==========================================

    public function test_creating_tracker_with_max_episodes_auto_completes(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/555*' => Http::response(['id' => 555, 'name' => 'Completed Drama'], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id'         => 555,
            'status'          => 'watching',
            'current_episode' => 16,
            'total_episodes'  => 16,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.progress_percentage', 100);

        $this->assertDatabaseHas('trackers', [
            'user_id' => $this->user->id,
            'tmdb_id' => 555,
            'status'  => 'completed',
        ]);
    }

    public function test_discover_browse_reflects_tracker_watch_status(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        Http::fake([
            '*/genre/tv/list*' => Http::response(['genres' => [['id' => 18, 'name' => 'Drama']]], 200),
            '*/discover/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'total_results' => 1,
                'results' => [
                    [
                        'id' => 12345,
                        'name' => 'Queen of Tears',
                        'genre_ids' => [18],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/discover');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.tmdb_id', 12345)
            ->assertJsonPath('data.0.watch_status', 'watching');
    }

    public function test_user_can_delete_their_own_tracker(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        $response = $this->deleteJson('/api/v1/tracker/12345');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Drama removed from tracker successfully.');

        $this->assertDatabaseMissing('trackers', [
            'user_id' => $this->user->id,
            'tmdb_id' => 12345,
        ]);
    }

    public function test_deleting_non_tracked_or_other_users_tracker_returns_404(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->otherUser->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
        ]);

        $response = $this->deleteJson('/api/v1/tracker/12345');
        $response->assertStatus(404);

        $this->assertDatabaseHas('trackers', [
            'user_id' => $this->otherUser->id,
            'tmdb_id' => 12345,
        ]);
    }

    // ==========================================
    // 7. Favorite Tests
    // ==========================================

    public function test_user_can_create_tracker_with_is_favorite(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/12345*' => Http::response([
                'id' => 12345,
                'name' => 'Queen of Tears',
                'number_of_episodes' => 16,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/tracker', [
            'tmdb_id'     => 12345,
            'status'      => 'watching',
            'is_favorite' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.tmdb_id', 12345)
            ->assertJsonPath('data.is_favorite', true);

        $this->assertDatabaseHas('trackers', [
            'user_id'     => $this->user->id,
            'tmdb_id'     => 12345,
            'is_favorite' => 1,
        ]);
    }

    public function test_user_can_update_is_favorite_via_patch(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 12345,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
            'is_favorite'     => false,
        ]);

        Http::fake([
            '*/tv/12345*' => Http::response(['id' => 12345, 'name' => 'Queen of Tears'], 200),
        ]);

        // Toggle to true
        $response1 = $this->patchJson('/api/v1/tracker/12345', [
            'is_favorite' => true,
        ]);

        $response1->assertStatus(200)
            ->assertJsonPath('data.is_favorite', true);

        $this->assertDatabaseHas('trackers', [
            'user_id'     => $this->user->id,
            'tmdb_id'     => 12345,
            'is_favorite' => 1,
        ]);

        // Toggle back to false
        $response2 = $this->patchJson('/api/v1/tracker/12345', [
            'is_favorite' => false,
        ]);

        $response2->assertStatus(200)
            ->assertJsonPath('data.is_favorite', false);

        $this->assertDatabaseHas('trackers', [
            'user_id'     => $this->user->id,
            'tmdb_id'     => 12345,
            'is_favorite' => 0,
        ]);
    }

    public function test_user_can_filter_trackers_by_favorite(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 101,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
            'is_favorite'     => true,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 102,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
            'is_favorite'     => true,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 103,
            'status'          => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes'  => 16,
            'is_favorite'     => false,
        ]);

        // Another user's favorite shouldn't appear
        Tracker::create([
            'user_id'         => $this->otherUser->id,
            'tmdb_id'         => 104,
            'status'          => 'watching',
            'current_episode' => 1,
            'total_episodes'  => 16,
            'is_favorite'     => true,
        ]);

        Http::fake([
            '*/tv/*' => Http::response(['id' => 101, 'name' => 'Drama'], 200),
        ]);

        // Filter favorite=true
        $resFavorites = $this->getJson('/api/v1/tracker?favorite=true');
        $resFavorites->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.counts.all', 3)
            ->assertJsonPath('meta.counts.favorites', 2);

        // Filter favorite=1
        $resFavorites1 = $this->getJson('/api/v1/tracker?favorite=1');
        $resFavorites1->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Filter favorite=false
        $resNonFavorites = $this->getJson('/api/v1/tracker?favorite=false');
        $resNonFavorites->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tmdb_id', 103);
    }

    public function test_meta_counts_accurately_reflects_favorites_count(): void
    {
        Sanctum::actingAs($this->user);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 201,
            'status'          => 'watching',
            'current_episode' => 2,
            'total_episodes'  => 16,
            'is_favorite'     => true,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 202,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
            'is_favorite'     => true,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 203,
            'status'          => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes'  => 16,
            'is_favorite'     => false,
        ]);

        Tracker::create([
            'user_id'         => $this->user->id,
            'tmdb_id'         => 204,
            'status'          => 'on_hold',
            'current_episode' => 3,
            'total_episodes'  => 16,
            'is_favorite'     => false,
        ]);

        Http::fake([
            '*/tv/*' => Http::response(['id' => 201, 'name' => 'Drama'], 200),
        ]);

        $response = $this->getJson('/api/v1/tracker');

        $response->assertStatus(200)
            ->assertJsonPath('meta.counts.all', 4)
            ->assertJsonPath('meta.counts.favorites', 2)
            ->assertJsonPath('meta.counts.watching', 1)
            ->assertJsonPath('meta.counts.completed', 1)
            ->assertJsonPath('meta.counts.plan_to_watch', 1)
            ->assertJsonPath('meta.counts.on_hold', 1)
            ->assertJsonPath('meta.counts.dropped', 0);
    }
}

