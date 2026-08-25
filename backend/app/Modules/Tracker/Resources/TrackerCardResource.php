<?php

namespace App\Modules\Tracker\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackerCardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'tmdb_id'             => $this->tmdb_id,
            'status'              => $this->status,
            'current_episode'     => $this->current_episode,
            'total_episodes'      => $this->total_episodes,
            'progress_percentage' => $this->progress_percentage,
            'rating'              => $this->rating,
            'review_notes'        => $this->review_notes,
            'rewatch_count'       => $this->rewatch_count,
            'created_at'          => $this->created_at?->toISOString(),
            'updated_at'          => $this->updated_at?->toISOString(),
            'drama'               => $this->dramaMetadata,
        ];
    }
}
