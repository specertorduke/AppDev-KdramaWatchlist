<?php

namespace App\Modules\Discover\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DramaCardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imageBaseUrl = rtrim(config('services.tmdb.image_url', 'https://image.tmdb.org/t/p/w500'), '/');
        
        // Handle poster URL
        $posterPath = $this->resource['poster_path'] ?? null;
        $posterUrl = null;
        if (!empty($posterPath)) {
            $posterUrl = str_starts_with($posterPath, 'http')
                ? $posterPath
                : "{$imageBaseUrl}{$posterPath}";
        }

        // Handle release year extraction
        $releaseDate = $this->resource['first_air_date'] ?? $this->resource['release_date'] ?? null;
        $releaseYear = null;
        if (!empty($releaseDate) && strlen($releaseDate) >= 4) {
            $year = (int) substr($releaseDate, 0, 4);
            $releaseYear = $year > 0 ? $year : null;
        }

        // Handle rating
        $rating = isset($this->resource['vote_average']) ? round((float) $this->resource['vote_average'], 1) : 0.0;

        // Handle total episodes if available
        $totalEpisodes = isset($this->resource['number_of_episodes'])
            ? (int) $this->resource['number_of_episodes']
            : (isset($this->resource['total_episodes']) ? (int) $this->resource['total_episodes'] : null);

        return [
            'tmdb_id'        => (int) ($this->resource['id'] ?? $this->resource['tmdb_id'] ?? 0),
            'title'          => (string) ($this->resource['name'] ?? $this->resource['title'] ?? ''),
            'poster_url'     => $posterUrl,
            'release_year'   => $releaseYear,
            'rating'         => $rating,
            'rank'           => isset($this->resource['rank']) ? (int) $this->resource['rank'] : null,
            'genres'         => $this->resource['genres'] ?? [],
            'total_episodes' => $totalEpisodes,
            'watch_status'   => $this->resource['watch_status'] ?? null,
        ];
    }
}
