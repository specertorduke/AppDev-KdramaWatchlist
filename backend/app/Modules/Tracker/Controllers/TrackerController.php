<?php

namespace App\Modules\Tracker\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tracker\Requests\FilterTrackerRequest;
use App\Modules\Tracker\Requests\StoreTrackerRequest;
use App\Modules\Tracker\Requests\UpdateTrackerRequest;
use App\Modules\Tracker\Resources\TrackerCardResource;
use App\Modules\Tracker\Resources\TrackerDetailResource;
use App\Modules\Tracker\Services\TrackerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackerController extends Controller
{
    public function __construct(
        protected TrackerService $trackerService
    ) {}

    /**
     * List authenticated user's tracked dramas with optional status filter and pagination.
     */
    public function index(FilterTrackerRequest $request): JsonResponse
    {
        $result = $this->trackerService->getUserTrackers(
            $request->user(),
            $request->validated()
        );

        $paginator = $result['paginator'];

        return response()->json([
            'data' => TrackerCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'counts'       => $result['counts'],
            ],
        ]);
    }

    /**
     * Get tracker information for a specific drama.
     */
    public function show(Request $request, int $tmdb_id): JsonResponse
    {
        $tracker = $this->trackerService->getTracker(
            $request->user(),
            $tmdb_id
        );

        return response()->json([
            'data' => new TrackerDetailResource($tracker),
        ]);
    }

    /**
     * Add a drama to the authenticated user's tracker.
     */
    public function store(StoreTrackerRequest $request): JsonResponse
    {
        $tracker = $this->trackerService->storeTracker(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'message' => 'Drama added to tracker successfully.',
            'data'    => new TrackerDetailResource($tracker),
        ], 201);
    }

    /**
     * Update an existing tracker entry.
     */
    public function update(UpdateTrackerRequest $request, int $tmdb_id): JsonResponse
    {
        $tracker = $this->trackerService->updateTracker(
            $request->user(),
            $tmdb_id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Tracker updated successfully.',
            'data'    => new TrackerDetailResource($tracker),
        ]);
    }

    /**
     * Increment the current episode by 1.
     */
    public function increment(Request $request, int $tmdb_id): JsonResponse
    {
        $tracker = $this->trackerService->incrementEpisode(
            $request->user(),
            $tmdb_id
        );

        return response()->json([
            'message' => 'Episode incremented successfully.',
            'data'    => new TrackerDetailResource($tracker),
        ]);
    }

    /**
     * Remove a drama from the authenticated user's tracker.
     */
    public function destroy(Request $request, int $tmdb_id): JsonResponse
    {
        $this->trackerService->deleteTracker(
            $request->user(),
            $tmdb_id
        );

        return response()->json([
            'message' => 'Drama removed from tracker successfully.',
        ]);
    }
}
