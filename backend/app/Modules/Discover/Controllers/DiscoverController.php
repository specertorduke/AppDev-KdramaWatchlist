<?php

namespace App\Modules\Discover\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Discover\Requests\DiscoverRequest;
use App\Modules\Discover\Requests\SearchRequest;
use App\Modules\Discover\Resources\DramaCardResource;
use App\Modules\Discover\Resources\DramaDetailResource;
use App\Modules\Discover\Services\DiscoverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscoverController extends Controller
{
    public function __construct(
        protected DiscoverService $discoverService
    ) {}

    /**
     * Browse K-dramas with optional genre filter and pagination.
     */
    public function index(DiscoverRequest $request): JsonResponse
    {
        if ($request->filled('query') || $request->filled('search')) {
            $query = (string) ($request->input('query') ?: $request->input('search'));
            $result = $this->discoverService->search(
                $query,
                (int) $request->input('page', 1),
                $request->user()
            );
        } else {
            $result = $this->discoverService->discover(
                $request->validated(),
                $request->user()
            );
        }

        return response()->json([
            'data'       => DramaCardResource::collection($result['data']),
            'pagination' => $result['pagination'],
        ]);
    }

    /**
     * Get list of TV genres.
     */
    public function genres(): JsonResponse
    {
        $genres = $this->discoverService->genres();

        return response()->json([
            'data' => $genres,
        ]);
    }

    /**
     * Search K-dramas by title, actor/person, or keyword.
     */
    public function search(SearchRequest $request): JsonResponse
    {
        $query = (string) ($request->input('query') ?: $request->input('search'));

        $result = $this->discoverService->search(
            $query,
            (int) $request->input('page', 1),
            $request->user()
        );

        return response()->json([
            'data'       => DramaCardResource::collection($result['data']),
            'pagination' => $result['pagination'],
        ]);
    }

    /**
     * Get detailed drama information by TMDB ID.
     */
    public function show(Request $request, int $tmdb_id): JsonResponse
    {
        $drama = $this->discoverService->show(
            $tmdb_id,
            $request->user()
        );

        return response()->json([
            'data' => new DramaDetailResource($drama),
        ]);
    }
}