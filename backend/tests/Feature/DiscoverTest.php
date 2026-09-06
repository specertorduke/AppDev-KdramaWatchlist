<?php

namespace Tests\Feature;

use App\Modules\Auth\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DiscoverTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        $this->user = User::factory()->create();
    }

    // ==========================================
    // Unauthenticated / Guest Tests (HTTP 401)
    // ==========================================

    public function test_guest_cannot_browse_discover(): void
    {
        $response = $this->getJson('/api/v1/discover');

        $response->assertStatus(401);
    }

    public function test_guest_cannot_get_genres(): void
    {
        $response = $this->getJson('/api/v1/discover/genres');

        $response->assertStatus(401);
    }

    public function test_guest_cannot_search(): void
    {
        $response = $this->getJson('/api/v1/discover/search?query=Queen%20of%20Tears');

        $response->assertStatus(401);
    }

    public function test_guest_cannot_get_drama_detail(): void
    {
        $response = $this->getJson('/api/v1/discover/12345');

        $response->assertStatus(401);
    }

    // ==========================================
    // Authenticated Discover Browse Tests
    // ==========================================

    public function test_authenticated_user_can_browse_kdramas_with_page_and_rank(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 10749, 'name' => 'Romance'],
                    ['id' => 35, 'name' => 'Comedy'],
                ],
            ], 200),
            '*/discover/tv*' => function (\Illuminate\Http\Client\Request $request) {
                $this->assertEquals('18', $request['with_genres'] ?? null);
                $this->assertEquals('KR', $request['with_origin_country'] ?? null);
                $this->assertEquals('ko', $request['with_original_language'] ?? null);
                return Http::response([
                    'page' => 2,
                    'total_pages' => 50,
                    'total_results' => 1000,
                    'results' => [
                        [
                            'id' => 12345,
                            'name' => 'Queen of Tears',
                            'poster_path' => '/poster1.jpg',
                            'backdrop_path' => '/backdrop1.jpg',
                            'first_air_date' => '2024-03-09',
                            'vote_average' => 8.84,
                            'genre_ids' => [18, 10749],
                            'overview' => 'A miraculous love story of a married couple.',
                        ],
                        [
                            'id' => 67890,
                            'name' => 'Crash Landing on You',
                            'poster_path' => '/poster2.jpg',
                            'backdrop_path' => '/backdrop2.jpg',
                            'first_air_date' => '2019-12-14',
                            'vote_average' => 8.7,
                            'genre_ids' => [18, 35, 10749],
                            'overview' => 'A South Korean heiress accidentally paraglides into North Korea.',
                        ],
                    ],
                ], 200);
            },
        ]);

        $response = $this->getJson('/api/v1/discover?page=2');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'tmdb_id',
                        'title',
                        'poster_url',
                        'release_year',
                        'rating',
                        'rank',
                        'genres',
                        'total_episodes',
                        'watch_status',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'has_more',
                ],
            ]);

        $responseData = $response->json();
        $this->assertCount(2, $responseData['data']);
        $this->assertEquals(12345, $responseData['data'][0]['tmdb_id']);
        $this->assertEquals('Queen of Tears', $responseData['data'][0]['title']);
        $this->assertEquals(2024, $responseData['data'][0]['release_year']);
        $this->assertEquals(8.8, $responseData['data'][0]['rating']);
        // Page 2: first item rank is (2 - 1) * 20 + 1 = 21
        $this->assertEquals(21, $responseData['data'][0]['rank']);
        $this->assertEquals(22, $responseData['data'][1]['rank']);
        $this->assertEquals(['Drama', 'Romance'], $responseData['data'][0]['genres']);
        $this->assertNull($responseData['data'][0]['watch_status']);
        $this->assertEquals(2, $responseData['pagination']['current_page']);
        $this->assertEquals(50, $responseData['pagination']['last_page']);
        $this->assertTrue($responseData['pagination']['has_more']);
    }

    public function test_authenticated_user_can_browse_with_bearer_token(): void
    {
        $token = $this->user->createToken('auth_token')->plainTextToken;

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [['id' => 18, 'name' => 'Drama']],
            ], 200),
            '*/discover/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'total_results' => 1,
                'results' => [
                    [
                        'id' => 12345,
                        'name' => 'Queen of Tears',
                        'poster_path' => '/poster1.jpg',
                        'first_air_date' => '2024-03-09',
                        'vote_average' => 8.8,
                        'genre_ids' => [18],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/discover');

        $response->assertStatus(200);
        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
    }

    public function test_browse_with_genre_filter(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 10749, 'name' => 'Romance'],
                ],
            ], 200),
            '*/discover/tv*' => function (\Illuminate\Http\Client\Request $request) {
                $this->assertEquals('18,10749', $request['with_genres'] ?? null);
                return Http::response([
                    'page' => 1,
                    'total_pages' => 10,
                    'total_results' => 200,
                    'results' => [
                        [
                            'id' => 12345,
                            'name' => 'Queen of Tears',
                            'poster_path' => '/poster1.jpg',
                            'first_air_date' => '2024-03-09',
                            'vote_average' => 8.8,
                            'genre_ids' => [10749],
                        ],
                    ],
                ], 200);
            },
        ]);

        $response = $this->getJson('/api/v1/discover?page=1&genre_id=10749');

        $response->assertStatus(200);
        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
        $this->assertEquals(1, $response->json('data.0.rank'));
    }

    public function test_browse_with_drama_genre_filter_does_not_duplicate_id(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                ],
            ], 200),
            '*/discover/tv*' => function (\Illuminate\Http\Client\Request $request) {
                $this->assertEquals('18', $request['with_genres'] ?? null);
                return Http::response([
                    'page' => 1,
                    'total_pages' => 1,
                    'total_results' => 1,
                    'results' => [
                        [
                            'id' => 12345,
                            'name' => 'Queen of Tears',
                            'poster_path' => '/poster1.jpg',
                            'first_air_date' => '2024-03-09',
                            'vote_average' => 8.8,
                            'genre_ids' => [18],
                        ],
                    ],
                ], 200);
            },
        ]);

        $response = $this->getJson('/api/v1/discover?page=1&genre_id=18');

        $response->assertStatus(200);
        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
    }

    // ==========================================
    // Authenticated Genres List Test
    // ==========================================

    public function test_get_genres_list(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 10749, 'name' => 'Romance'],
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 53, 'name' => 'Thriller'],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/discover/genres');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    ['id' => 10749, 'name' => 'Romance'],
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 53, 'name' => 'Thriller'],
                ],
            ]);
    }

    // ==========================================
    // Authenticated Search Tests
    // ==========================================

    public function test_search_kdramas_by_title(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                ],
            ], 200),
            '*/search/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'results' => [
                    [
                        'id' => 12345,
                        'name' => 'Queen of Tears',
                        'poster_path' => '/poster1.jpg',
                        'first_air_date' => '2024-03-09',
                        'vote_average' => 8.8,
                        'genre_ids' => [18],
                        'origin_country' => ['KR'],
                        'original_language' => 'ko',
                        'popularity' => 150.5,
                    ],
                ],
            ], 200),
            '*/search/person*' => Http::response(['results' => []], 200),
            '*/search/keyword*' => Http::response(['results' => []], 200),
        ]);

        $response = $this->getJson('/api/v1/discover/search?query=queen');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'tmdb_id',
                        'title',
                        'poster_url',
                        'release_year',
                        'rating',
                        'rank',
                        'genres',
                        'total_episodes',
                        'watch_status',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'has_more',
                ],
            ]);

        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
        $this->assertEquals(1, $response->json('data.0.rank'));
    }

    public function test_search_kdramas_by_actor_person(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 10749, 'name' => 'Romance'],
                ],
            ], 200),
            '*/search/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'results' => [],
            ], 200),
            '*/search/person*' => Http::response([
                'results' => [
                    [
                        'id' => 71509,
                        'name' => 'Kim Soo-hyun',
                        'known_for_department' => 'Acting',
                    ],
                ],
            ], 200),
            '*/person/71509/tv_credits*' => Http::response([
                'cast' => [
                    [
                        'id' => 12345,
                        'name' => 'Queen of Tears',
                        'poster_path' => '/poster_kim.jpg',
                        'first_air_date' => '2024-03-09',
                        'vote_average' => 8.8,
                        'genre_ids' => [18, 10749],
                        'origin_country' => ['KR'],
                        'original_language' => 'ko',
                        'popularity' => 200.0,
                    ],
                ],
            ], 200),
            '*/search/keyword*' => Http::response(['results' => []], 200),
        ]);

        $response = $this->getJson('/api/v1/discover/search?query=Kim%20Soo-hyun');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
        $this->assertEquals(12345, $response->json('data.0.tmdb_id'));
    }

    public function test_search_kdramas_by_keyword(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [['id' => 18, 'name' => 'Drama']],
            ], 200),
            '*/search/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'results' => [],
            ], 200),
            '*/search/person*' => Http::response(['results' => []], 200),
            '*/search/keyword*' => Http::response([
                'results' => [
                    ['id' => 9715, 'name' => 'revenge'],
                ],
            ], 200),
            '*/discover/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'results' => [
                    [
                        'id' => 98765,
                        'name' => 'The Glory',
                        'poster_path' => '/glory.jpg',
                        'first_air_date' => '2022-12-30',
                        'vote_average' => 8.6,
                        'genre_ids' => [18],
                        'origin_country' => ['KR'],
                        'original_language' => 'ko',
                        'popularity' => 180.0,
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/discover/search?query=revenge');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('The Glory', $response->json('data.0.title'));
    }

    public function test_search_kdramas_with_search_param(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                ],
            ], 200),
            '*/search/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'results' => [
                    [
                        'id' => 12345,
                        'name' => 'Queen of Tears',
                        'poster_path' => '/poster1.jpg',
                        'first_air_date' => '2024-03-09',
                        'vote_average' => 8.8,
                        'genre_ids' => [18],
                        'origin_country' => ['KR'],
                        'original_language' => 'ko',
                        'popularity' => 150.5,
                    ],
                ],
            ], 200),
            '*/search/person*' => Http::response(['results' => []], 200),
            '*/search/keyword*' => Http::response(['results' => []], 200),
        ]);

        $response = $this->getJson('/api/v1/discover/search?search=queen');

        $response->assertStatus(200);
        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
    }

    public function test_discover_index_with_search_param_delegates_to_search(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/genre/tv/list*' => Http::response([
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                ],
            ], 200),
            '*/search/tv*' => Http::response([
                'page' => 1,
                'total_pages' => 1,
                'results' => [
                    [
                        'id' => 12345,
                        'name' => 'Queen of Tears',
                        'poster_path' => '/poster1.jpg',
                        'first_air_date' => '2024-03-09',
                        'vote_average' => 8.8,
                        'genre_ids' => [18],
                        'origin_country' => ['KR'],
                        'original_language' => 'ko',
                        'popularity' => 150.5,
                    ],
                ],
            ], 200),
            '*/search/person*' => Http::response(['results' => []], 200),
            '*/search/keyword*' => Http::response(['results' => []], 200),
        ]);

        $response = $this->getJson('/api/v1/discover?search=queen');

        $response->assertStatus(200);
        $this->assertEquals('Queen of Tears', $response->json('data.0.title'));
    }

    public function test_search_kdramas_requires_query(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/discover/search');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['query', 'search']);
    }

    // ==========================================
    // Authenticated Drama Detail Tests
    // ==========================================

    public function test_get_drama_detail(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/12345*' => Http::response([
                'id' => 12345,
                'name' => 'Queen of Tears',
                'original_name' => '눈물의 여왕',
                'first_air_date' => '2024-03-09',
                'vote_average' => 8.8,
                'vote_count' => 520,
                'poster_path' => '/poster1.jpg',
                'backdrop_path' => '/backdrop1.jpg',
                'overview' => 'A miraculous love story.',
                'status' => 'Ended',
                'number_of_seasons' => 1,
                'number_of_episodes' => 16,
                'genres' => [
                    ['id' => 18, 'name' => 'Drama'],
                    ['id' => 10749, 'name' => 'Romance'],
                ],
                'videos' => [
                    'results' => [
                        [
                            'key' => 'dQw4w9WgXcQ',
                            'site' => 'YouTube',
                            'type' => 'Trailer',
                            'official' => true,
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/discover/12345');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'tmdb_id'            => 12345,
                    'title'              => 'Queen of Tears',
                    'original_title'     => '눈물의 여왕',
                    'release_year'       => 2024,
                    'genres'             => ['Drama', 'Romance'],
                    'rating'             => 8.8,
                    'vote_count'         => 520,
                    'overview'           => 'A miraculous love story.',
                    'status'             => 'Ended',
                    'number_of_seasons'  => 1,
                    'number_of_episodes' => 16,
                    'trailer'            => [
                        'key'  => 'dQw4w9WgXcQ',
                        'site' => 'YouTube',
                        'url'  => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    ],
                    'watch_status'       => null,
                ],
            ]);
    }

    public function test_get_drama_detail_returns_404_when_not_found(): void
    {
        Sanctum::actingAs($this->user);

        Http::fake([
            '*/tv/99999999*' => Http::response([
                'status_message' => 'The resource you requested could not be found.',
                'status_code' => 34,
            ], 404),
        ]);

        $response = $this->getJson('/api/v1/discover/99999999');

        $response->assertStatus(404);
    }
}
