<?php

namespace App\Modules\Discover\Services;

use App\Modules\Auth\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class DiscoverService
{
    protected string $baseUrl;
    protected ?string $token;
    protected ?string $apiKey;

    public const THRILLER_GENRE_ID = 53;
    public const HORROR_GENRE_ID = 27;
    public const THRILLER_KEYWORDS = '316362|12565|204205|302132|351957|254459|322128|217282|298530|319190|329866|9714';
    public const HORROR_KEYWORDS = '315058|313454|50009|178647|351957|12339|241|163054|186565|224447';

    public const EMPTY_GENRE_IDS = [
        10763, // News (0 Korean TV shows on TMDB)
        10764, // Reality (0 Korean TV shows on TMDB)
        10767, // Talk (0 Korean TV shows on TMDB)
        37,    // Western (0 Korean TV shows on TMDB)
    ];

    public const EMPTY_GENRE_NAMES = [
        'news',
        'reality',
        'talk',
        'western',
    ];

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.tmdb.base_url', 'https://api.themoviedb.org/3'), '/');
        $this->token = config('services.tmdb.token');
        $this->apiKey = config('services.tmdb.api_key');
    }

    /**
     * Create configured HTTP client instance.
     */
    protected function client(): PendingRequest
    {
        $client = Http::withoutVerifying()
            ->acceptJson()
            ->timeout(10);

        if (!empty($this->token)) {
            $client->withToken($this->token);
        }

        return $client;
    }

    /**
     * Perform a GET request to TMDB API with error handling.
     *
     * @param  array<string, mixed>  $params
     */
    protected function get(string $endpoint, array $params = []): Response
    {
        if (empty($this->token) && !empty($this->apiKey)) {
            $params['api_key'] = $this->apiKey;
        }

        try {
            $response = $this->client()->get("{$this->baseUrl}/{$endpoint}", $params);

            if ($response->status() === 404) {
                throw new NotFoundHttpException('The requested resource was not found on TMDB.');
            }

            if ($response->failed()) {
                Log::error("TMDB API error on [{$endpoint}]: " . $response->body());
                throw new HttpException($response->status(), 'Failed to fetch data from TMDB service.');
            }

            return $response;
        } catch (NotFoundHttpException $e) {
            throw $e;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error("TMDB connection timeout/failure: " . $e->getMessage());
            throw new ServiceUnavailableHttpException(60, 'TMDB service is currently unavailable. Please try again later.');
        } catch (\Exception $e) {
            if ($e instanceof HttpException) {
                throw $e;
            }
            Log::error("Unexpected TMDB error: " . $e->getMessage());
            throw new HttpException(500, 'An unexpected error occurred while communicating with TMDB.');
        }
    }

    protected static ?array $cachedGenreMap = null;
    protected static ?array $cachedGenreList = null;

    /**
     * Clear in-memory cached genre data (useful for testing).
     */
    public static function resetCache(): void
    {
        static::$cachedGenreMap = null;
        static::$cachedGenreList = null;
    }

    /**
     * Fetch TV genre list from TMDB or cache.
     *
     * @return array<int, string> [id => name]
     */
    public function getGenreMap(): array
    {
        if (static::$cachedGenreMap !== null) {
            return static::$cachedGenreMap;
        }

        try {
            $map = Cache::remember('tmdb_tv_genres_map', 86400, function () {
                return $this->fetchGenreMapFromApi();
            });
            static::$cachedGenreMap = $map;
            return $map;
        } catch (\Throwable $e) {
            Log::warning('Cache store unavailable or error, fetching directly: ' . $e->getMessage());
            $map = $this->fetchGenreMapFromApi();
            static::$cachedGenreMap = $map;
            return $map;
        }
    }

    /**
     * Fetch raw genre map directly from TMDB API.
     *
     * @return array<int, string>
     */
    protected function fetchGenreMapFromApi(): array
    {
        try {
            $response = $this->get('genre/tv/list', ['language' => 'en-US']);
            $genres = $response->json('genres', []);

            $map = [];
            foreach ($genres as $genre) {
                if (isset($genre['id'], $genre['name'])) {
                    $genreId = (int) $genre['id'];
                    $genreName = trim((string) $genre['name']);
                    $nameLower = strtolower($genreName);

                    // Filter out empty genres that have 0 Korean dramas in TMDB
                    if (in_array($genreId, self::EMPTY_GENRE_IDS, true) || in_array($nameLower, self::EMPTY_GENRE_NAMES, true)) {
                        continue;
                    }

                    $map[$genreId] = $genreName;
                }
            }

            $map[10749] = 'Romance';

            return $map;
        } catch (\Throwable $e) {
            Log::warning('Unable to fetch TMDB genres map: ' . $e->getMessage());
            return [
                10749 => 'Romance',
                18    => 'Drama',
                35    => 'Comedy',
                10759 => 'Action & Adventure',
                9648  => 'Mystery',
                10765 => 'Sci-Fi & Fantasy',
                80    => 'Crime',
                10751 => 'Family',
            ];
        }
    }

    /**
     * Get TV genres list formatted for API response.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public function genres(): array
    {
        if (static::$cachedGenreList !== null) {
            return static::$cachedGenreList;
        }

        try {
            $list = Cache::remember('tmdb_tv_genres_list', 86400, function () {
                return $this->fetchGenreListFromApi();
            });
            static::$cachedGenreList = $list;
            return $list;
        } catch (\Throwable $e) {
            Log::warning('Cache store unavailable, fetching genre list directly: ' . $e->getMessage());
            static::$cachedGenreList = $this->fetchGenreListFromApi();
            return static::$cachedGenreList;
        }
    }

    /**
     * Fetch genre list directly from TMDB API excluding empty genres.
     *
     * @return array<int, array{id: int, name: string}>
     */
    protected function fetchGenreListFromApi(): array
    {
        $response = $this->get('genre/tv/list', ['language' => 'en-US']);
        $genres = $response->json('genres', []);

        $result = [];
        $hasRomance = false;

        foreach ($genres as $genre) {
            if (isset($genre['id'], $genre['name'])) {
                $genreId = (int) $genre['id'];
                $genreName = trim((string) $genre['name']);
                $nameLower = strtolower($genreName);

                // Exclude empty genres that have 0 Korean dramas in TMDB
                if (in_array($genreId, self::EMPTY_GENRE_IDS, true) || in_array($nameLower, self::EMPTY_GENRE_NAMES, true)) {
                    continue;
                }

                if ($nameLower === 'romance') {
                    $hasRomance = true;
                }

                $result[] = [
                    'id'   => $genreId,
                    'name' => $genreName,
                ];
            }
        }

        // Ensure Romance is present
        if (!$hasRomance) {
            array_unshift($result, [
                'id'   => 10749,
                'name' => 'Romance',
            ]);
        }

        return $result;
    }

    /**
     * Browse K-dramas with pagination and optional genre filter.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: array, pagination: array}
     */
    public function discover(array $filters = [], ?User $user = null): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $rawGenreId = $filters['genre_id'] ?? null;
        $genreId = null;

        if (!empty($rawGenreId)) {
            if (is_numeric($rawGenreId)) {
                $genreId = (int) $rawGenreId;
            } elseif (is_string($rawGenreId)) {
                $rawLower = strtolower(trim($rawGenreId));
                if ($rawLower === 'thriller') {
                    $genreId = self::THRILLER_GENRE_ID;
                } elseif ($rawLower === 'horror') {
                    $genreId = self::HORROR_GENRE_ID;
                } else {
                    $genreMapFlipped = array_change_key_case(array_flip($this->getGenreMap()), CASE_LOWER);
                    $genreId = $genreMapFlipped[$rawLower] ?? null;
                }
            }
        }

        $keywordId = !empty($filters['keyword_id']) ? (int) $filters['keyword_id'] : null;

        $queryParams = [
            'include_adult'                => false,
            'include_null_first_air_dates' => false,
            'language'                     => 'en-US',
            'page'                         => $page,
            'sort_by'                      => 'popularity.desc',
            'with_origin_country'          => 'KR',
            'with_original_language'       => 'ko',
            'without_genres'               => '10764,10767',
        ];

        if ($genreId === self::THRILLER_GENRE_ID) {
            // TMDB TV does not have a native Thriller TV genre; use comprehensive Korean thriller keywords
            $queryParams['with_keywords'] = self::THRILLER_KEYWORDS;
        } elseif ($genreId === self::HORROR_GENRE_ID) {
            // TMDB TV does not have a native Horror TV genre; use comprehensive Korean horror keywords
            $queryParams['with_keywords'] = self::HORROR_KEYWORDS;
        } else {
            $baseGenreId = 18;
            if ($genreId && (int) $genreId !== $baseGenreId) {
                $queryParams['with_genres'] = "{$baseGenreId},{$genreId}";
            } else {
                $queryParams['with_genres'] = (string) $baseGenreId;
            }
        }

        if ($keywordId && empty($queryParams['with_keywords'])) {
            $queryParams['with_keywords'] = (string) $keywordId;
        }

        $response = $this->get('discover/tv', $queryParams);
        $results = $response->json('results', []);
        $totalPages = (int) $response->json('total_pages', 1);
        $totalResults = (int) $response->json('total_results', 0);

        // Cap TMDB max page to 500 per TMDB API guidelines
        $lastPage = min($totalPages, 500);

        $genreMap = $this->getGenreMap();
        $dramas = [];

        foreach ($results as $index => $item) {
            $rank = ($page - 1) * 20 + ($index + 1);
            $itemGenres = $this->resolveGenres($item['genre_ids'] ?? [], $genreMap);

            if ($genreId === self::THRILLER_GENRE_ID && !in_array('Thriller', $itemGenres, true)) {
                array_unshift($itemGenres, 'Thriller');
            } elseif ($genreId === self::HORROR_GENRE_ID && !in_array('Horror', $itemGenres, true)) {
                array_unshift($itemGenres, 'Horror');
            }

            $dramas[] = array_merge($item, [
                'rank'         => $rank,
                'genres'       => $itemGenres,
                'watch_status' => $this->getWatchStatus((int) $item['id'], $user),
            ]);
        }

        return [
            'data'       => $dramas,
            'pagination' => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'has_more'     => $page < $lastPage,
            ],
        ];
    }

    /**
     * Search K-dramas by title, actor/person, or keyword.
     *
     * @return array{data: array, pagination: array}
     */
    public function search(string $query, int $page = 1, ?User $user = null): array
    {
        $page = max(1, $page);
        $genreMap = $this->getGenreMap();
        $collectedDramas = [];
        $seenIds = [];

        // 1. Search TV shows directly
        $tvResponse = $this->get('search/tv', [
            'query'         => $query,
            'page'          => $page,
            'language'      => 'en-US',
            'include_adult' => false,
        ]);

        $tvResults = $tvResponse->json('results', []);
        $totalPages = (int) $tvResponse->json('total_pages', 1);

        foreach ($tvResults as $item) {
            $id = (int) $item['id'];
            $originCountries = $item['origin_country'] ?? [];
            $originalLanguage = $item['original_language'] ?? '';

            // Exclude non-Korean TV matches instead of merely sorting them lower.
            $isKorean = in_array('KR', $originCountries, true) || $originalLanguage === 'ko';

            if ($isKorean && !isset($seenIds[$id])) {
                $seenIds[$id] = true;
                $collectedDramas[] = [
                    'item'     => $item,
                    'isKorean' => $isKorean,
                ];
            }
        }

        // 2. If on page 1, also search for actors/people and keywords matching the query
        if ($page === 1 && mb_strlen($query) >= 2) {
            // 2a. Search for actors/people to include their K-drama credits
            try {
                $personResponse = $this->get('search/person', [
                    'query'         => $query,
                    'page'          => 1,
                    'language'      => 'en-US',
                    'include_adult' => false,
                ]);

                $personResults = $personResponse->json('results', []);
                if (!empty($personResults)) {
                    // Check top matching persons (up to top 2)
                    $topPersons = array_slice($personResults, 0, 2);
                    foreach ($topPersons as $topPerson) {
                        $personId = (int) $topPerson['id'];

                        $creditsResponse = $this->get("person/{$personId}/tv_credits", [
                            'language' => 'en-US',
                        ]);

                        $castCredits = $creditsResponse->json('cast', []);
                        foreach ($castCredits as $credit) {
                            $id = (int) ($credit['id'] ?? 0);
                            $originCountries = $credit['origin_country'] ?? [];
                            $originalLanguage = $credit['original_language'] ?? '';

                            $isKorean = in_array('KR', $originCountries, true) || $originalLanguage === 'ko';

                            if ($id > 0 && $isKorean && !isset($seenIds[$id])) {
                                $seenIds[$id] = true;
                                $collectedDramas[] = [
                                    'item'     => $credit,
                                    'isKorean' => true,
                                ];
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::debug('Person search credit check skipped: ' . $e->getMessage());
            }

            // 2b. Search for keywords to find themed K-dramas
            try {
                $keywordResponse = $this->get('search/keyword', [
                    'query' => $query,
                    'page'  => 1,
                ]);

                $keywordResults = $keywordResponse->json('results', []);
                if (!empty($keywordResults)) {
                    $keywordIds = array_column(array_slice($keywordResults, 0, 3), 'id');
                    $keywordString = implode('|', $keywordIds);

                    $keywordTvResponse = $this->get('discover/tv', [
                        'with_keywords'                => $keywordString,
                        'with_origin_country'          => 'KR',
                        'with_original_language'       => 'ko',
                        'sort_by'                      => 'popularity.desc',
                        'include_adult'                => false,
                        'include_null_first_air_dates' => false,
                        'language'                     => 'en-US',
                        'page'                         => 1,
                    ]);

                    $keywordTvResults = $keywordTvResponse->json('results', []);
                    foreach ($keywordTvResults as $item) {
                        $id = (int) $item['id'];
                        if (!isset($seenIds[$id])) {
                            $seenIds[$id] = true;
                            $collectedDramas[] = [
                                'item'     => $item,
                                'isKorean' => true,
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::debug('Keyword search discover check skipped: ' . $e->getMessage());
            }
        }

        // Sort Korean results first, then by popularity
        usort($collectedDramas, function ($a, $b) {
            if ($a['isKorean'] !== $b['isKorean']) {
                return $a['isKorean'] ? -1 : 1;
            }
            $popA = (float) ($a['item']['popularity'] ?? 0);
            $popB = (float) ($b['item']['popularity'] ?? 0);
            return $popB <=> $popA;
        });

        $dramas = [];
        $lastPage = min(max($totalPages, 1), 500);

        foreach ($collectedDramas as $index => $entry) {
            $item = $entry['item'];
            $rank = ($page - 1) * 20 + ($index + 1);
            $itemGenres = $this->resolveGenres($item['genre_ids'] ?? [], $genreMap);

            $dramas[] = array_merge($item, [
                'rank'         => $rank,
                'genres'       => $itemGenres,
                'watch_status' => $this->getWatchStatus((int) $item['id'], $user),
            ]);
        }

        return [
            'data'       => $dramas,
            'pagination' => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'has_more'     => $page < $lastPage,
            ],
        ];
    }

    /**
     * Fetch detailed drama information from TMDB.
     */
    public function show(int $tmdbId, ?User $user = null): array
    {
        $response = $this->get("tv/{$tmdbId}", [
            'append_to_response' => 'videos,credits,keywords',
            'language'           => 'en-US',
        ]);

        $data = $response->json();
        $data['watch_status'] = $this->getWatchStatus($tmdbId, $user);

        // Detect Horror and Thriller from keywords or overview and enhance genres
        $keywords = array_column($data['keywords']['results'] ?? [], 'name');
        $genreNames = array_column($data['genres'] ?? [], 'name');

        $hasHorrorKeyword = false;
        $hasThrillerKeyword = false;

        foreach ($keywords as $kw) {
            $kwLower = strtolower($kw);
            if (str_contains($kwLower, 'horror') || str_contains($kwLower, 'zombie') || str_contains($kwLower, 'monster') || str_contains($kwLower, 'survival horror')) {
                $hasHorrorKeyword = true;
            }
            if (str_contains($kwLower, 'thriller') || str_contains($kwLower, 'psychological thriller') || str_contains($kwLower, 'suspense')) {
                $hasThrillerKeyword = true;
            }
        }

        if ($hasHorrorKeyword && !in_array('Horror', $genreNames, true)) {
            $data['genres'][] = ['id' => self::HORROR_GENRE_ID, 'name' => 'Horror'];
        }

        if ($hasThrillerKeyword && !in_array('Thriller', $genreNames, true)) {
            $data['genres'][] = ['id' => self::THRILLER_GENRE_ID, 'name' => 'Thriller'];
        }

        return $data;
    }

    /**
     * Fetch season details (including episodes list) from TMDB.
     *
     * @return array<string, mixed>|null
     */
    public function season(int $tmdbId, int $seasonNumber = 1): ?array
    {
        try {
            $response = $this->get("tv/{$tmdbId}/season/{$seasonNumber}", [
                'language' => 'en-US',
            ]);

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning("Failed to fetch TMDB season {$seasonNumber} for [{$tmdbId}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Resolve genre names from genre IDs.
     *
     * @param  array<int>  $genreIds
     * @param  array<int, string>  $genreMap
     * @return array<string>
     */
    protected function resolveGenres(array $genreIds, array $genreMap): array
    {
        $names = [];
        foreach ($genreIds as $id) {
            if (isset($genreMap[$id])) {
                $names[] = $genreMap[$id];
            }
        }

        return $names;
    }

    /**
     * Retrieve the user's watch status for a given drama.
     */
    public function getWatchStatus(int $tmdbId, ?User $user = null): ?string
    {
        if (!$user) {
            return null;
        }

        return \App\Modules\Tracker\Models\Tracker::where('user_id', $user->id)
            ->where('tmdb_id', $tmdbId)
            ->value('status');
    }
}
