<?php

namespace Tests\Feature;

use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_profile_or_stats(): void
    {
        $this->getJson('/api/v1/user/profile')->assertStatus(401);
        $this->getJson('/api/v1/user/stats')->assertStatus(401);
    }

    public function test_authenticated_user_receives_accurate_empty_stats(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/user/profile');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                ],
                'stats' => [
                    'total_dramas'     => 0,
                    'episodes_watched' => 0,
                    'hours_watched'    => 0,
                    'average_rating'   => null,
                    'status_breakdown' => [
                        'watching'      => 0,
                        'completed'     => 0,
                        'plan_to_watch' => 0,
                        'on_hold'       => 0,
                        'dropped'       => 0,
                    ],
                ],
            ]);
    }

    public function test_authenticated_user_receives_accurate_aggregated_stats(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // User's trackers
        Tracker::create([
            'user_id'         => $user->id,
            'tmdb_id'         => 101,
            'status'          => 'watching',
            'current_episode' => 8,
            'total_episodes'  => 16,
            'rating'          => 9,
        ]);

        Tracker::create([
            'user_id'         => $user->id,
            'tmdb_id'         => 102,
            'status'          => 'completed',
            'current_episode' => 16,
            'total_episodes'  => 16,
            'rating'          => 10,
        ]);

        Tracker::create([
            'user_id'         => $user->id,
            'tmdb_id'         => 103,
            'status'          => 'plan_to_watch',
            'current_episode' => 0,
            'total_episodes'  => 20,
            'rating'          => null,
        ]);

        Tracker::create([
            'user_id'         => $user->id,
            'tmdb_id'         => 104,
            'status'          => 'on_hold',
            'current_episode' => 4,
            'total_episodes'  => 12,
            'rating'          => 8,
        ]);

        // Other user's tracker (should not affect stats)
        Tracker::create([
            'user_id'         => $otherUser->id,
            'tmdb_id'         => 201,
            'status'          => 'completed',
            'current_episode' => 50,
            'total_episodes'  => 50,
            'rating'          => 1,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/user/profile');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                ],
                'stats' => [
                    'total_dramas'     => 4,
                    'episodes_watched' => 28,
                    'hours_watched'    => 28.0,
                    'average_rating'   => 9.0, // (9 + 10 + 8) / 3 = 9.0
                    'status_breakdown' => [
                        'watching'      => 1,
                        'completed'     => 1,
                        'plan_to_watch' => 1,
                        'on_hold'       => 1,
                        'dropped'       => 0,
                    ],
                ],
            ]);

        // Verify stats endpoint returns identical data
        $statsResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/user/stats');

        $statsResponse->assertStatus(200)
            ->assertJson([
                'stats' => [
                    'total_dramas'     => 4,
                    'episodes_watched' => 28,
                    'hours_watched'    => 28.0,
                    'average_rating'   => 9.0,
                ],
            ]);
    }

    public function test_user_can_update_password_via_patch_auth_password(): void
    {
        $user = User::factory()->create([
            'password' => 'currentpassword123',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/v1/auth/password', [
                'current_password'      => 'currentpassword123',
                'password'              => 'brandnewpassword123',
                'password_confirmation' => 'brandnewpassword123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password updated successfully.']);

        // Verify login works with new password
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'brandnewpassword123',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_user_can_update_password_via_put_user_password(): void
    {
        $user = User::factory()->create([
            'password' => 'currentpassword123',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/user/password', [
                'current_password'      => 'currentpassword123',
                'password'              => 'updatedsecretpass123',
                'password_confirmation' => 'updatedsecretpass123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password updated successfully.']);
    }

    public function test_user_cannot_update_password_with_invalid_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'correctpassword123',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/v1/auth/password', [
                'current_password'      => 'wrongpassword123',
                'password'              => 'brandnewpassword123',
                'password_confirmation' => 'brandnewpassword123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_user_can_delete_account_and_cascades_trackers(): void
    {
        $user = User::factory()->create([
            'password' => 'passwordtodelete123',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        Tracker::create([
            'user_id'         => $user->id,
            'tmdb_id'         => 999,
            'status'          => 'watching',
            'current_episode' => 5,
        ]);

        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->assertDatabaseHas('trackers', ['user_id' => $user->id, 'tmdb_id' => 999]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/v1/user', [
                'current_password' => 'passwordtodelete123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Account deleted successfully.']);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('trackers', ['user_id' => $user->id]);
    }

    public function test_user_cannot_delete_account_with_invalid_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'passwordtodelete123',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/v1/user', [
                'current_password' => 'wrongpassword',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }
}
