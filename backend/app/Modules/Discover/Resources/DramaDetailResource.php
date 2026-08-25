<?php

namespace App\Modules\Discover\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DramaDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imageBaseUrl = rtrim(config('services.tmdb.image_url', 'https://image.tmdb.org/t/p/original'), '/');

        // Handle poster URL
        $posterPath = $this->resource['poster_path'] ?? null;
        $posterUrl = null;
        if (!empty($posterPath)) {
            $posterUrl = str_starts_with($posterPath, 'http')
                ? $posterPath
                : "{$imageBaseUrl}{$posterPath}";
        }

        // Handle backdrop URL
        $backdropPath = $this->resource['backdrop_path'] ?? null;
        $backdropUrl = null;
        if (!empty($backdropPath)) {
            $backdropUrl = str_starts_with($backdropPath, 'http')
                ? $backdropPath
                : "{$imageBaseUrl}{$backdropPath}";
        }

        // Handle release year extraction
        $releaseDate = $this->resource['first_air_date'] ?? $this->resource['release_date'] ?? null;
        $releaseYear = null;
        if (!empty($releaseDate) && strlen($releaseDate) >= 4) {
            $year = (int) substr($releaseDate, 0, 4);
            $releaseYear = $year > 0 ? $year : null;
        }

        // Handle genres (could be array of strings or array of objects with {id, name})
        $genres = [];
        if (isset($this->resource['genres']) && is_array($this->resource['genres'])) {
            foreach ($this->resource['genres'] as $genre) {
                if (is_string($genre)) {
                    $genres[] = $genre;
                } elseif (is_array($genre) && isset($genre['name'])) {
                    $genres[] = $genre['name'];
                }
            }
        }

        // Handle trailer extraction from videos.results
        $trailer = null;
        if (isset($this->resource['videos']['results']) && is_array($this->resource['videos']['results'])) {
            $videos = $this->resource['videos']['results'];
            // Find official YouTube trailer first, then any YouTube trailer
            $selectedVideo = null;
            foreach ($videos as $video) {
                if (($video['site'] ?? '') === 'YouTube' && ($video['type'] ?? '') === 'Trailer') {
                    if (!empty($video['official'])) {
                        $selectedVideo = $video;
                        break;
                    }
                    if ($selectedVideo === null) {
                        $selectedVideo = $video;
                    }
                }
            }

            // Fallback to Teaser if no trailer
            if (!$selectedVideo) {
                foreach ($videos as $video) {
                    if (($video['site'] ?? '') === 'YouTube' && ($video['type'] ?? '') === 'Teaser') {
                        $selectedVideo = $video;
                        break;
                    }
                }
            }

            if ($selectedVideo && !empty($selectedVideo['key'])) {
                $trailer = [
                    'key'  => $selectedVideo['key'],
                    'site' => $selectedVideo['site'] ?? 'YouTube',
                    'url'  => "https://www.youtube.com/watch?v={$selectedVideo['key']}",
                ];
            }
        }

        // Handle seasons extraction
        $seasons = [];
        if (isset($this->resource['seasons']) && is_array($this->resource['seasons'])) {
            foreach ($this->resource['seasons'] as $season) {
                $seasonPoster = $season['poster_path'] ?? null;
                $seasonPosterUrl = null;
                if (!empty($seasonPoster)) {
                    $seasonPosterUrl = str_starts_with($seasonPoster, 'http')
                        ? $seasonPoster
                        : "{$imageBaseUrl}{$seasonPoster}";
                }

                $seasons[] = [
                    'id'            => (int) ($season['id'] ?? 0),
                    'name'          => (string) ($season['name'] ?? ''),
                    'season_number' => (int) ($season['season_number'] ?? 0),
                    'episode_count' => (int) ($season['episode_count'] ?? 0),
                    'poster_url'    => $seasonPosterUrl,
                    'air_date'      => $season['air_date'] ?? null,
                ];
            }
        }

        // Handle individual episodes extraction
        $episodes = [];
        if (isset($this->resource['episodes']) && is_array($this->resource['episodes'])) {
            foreach ($this->resource['episodes'] as $ep) {
                $stillPath = $ep['still_path'] ?? null;
                $stillUrl = null;
                if (!empty($stillPath)) {
                    $stillUrl = str_starts_with($stillPath, 'http')
                        ? $stillPath
                        : "{$imageBaseUrl}{$stillPath}";
                }

                $episodes[] = [
                    'id'             => (int) ($ep['id'] ?? 0),
                    'episode_number' => (int) ($ep['episode_number'] ?? 0),
                    'name'           => (string) ($ep['name'] ?? ''),
                    'overview'       => $ep['overview'] ?? null,
                    'runtime'        => isset($ep['runtime']) ? (int) $ep['runtime'] : null,
                    'still_url'      => $stillUrl,
                    'air_date'       => $ep['air_date'] ?? null,
                    'rating'         => isset($ep['vote_average']) ? round((float) $ep['vote_average'], 1) : 0.0,
                ];
            }
        }

        // Handle rating
        $rating = isset($this->resource['vote_average']) ? round((float) $this->resource['vote_average'], 1) : 0.0;

        return [
            'tmdb_id'            => (int) ($this->resource['id'] ?? $this->resource['tmdb_id'] ?? 0),
            'title'              => (string) ($this->resource['name'] ?? $this->resource['title'] ?? ''),
            'original_title'     => $this->resource['original_name'] ?? $this->resource['original_title'] ?? null,
            'release_year'       => $releaseYear,
            'genres'             => $genres,
            'rating'             => $rating,
            'vote_count'         => (int) ($this->resource['vote_count'] ?? 0),
            'poster_url'         => $posterUrl,
            'backdrop_url'       => $backdropUrl,
            'overview'           => $this->resource['overview'] ?? null,
            'status'             => $this->resource['status'] ?? null,
            'number_of_seasons'  => isset($this->resource['number_of_seasons']) ? (int) $this->resource['number_of_seasons'] : null,
            'number_of_episodes' => isset($this->resource['number_of_episodes']) ? (int) $this->resource['number_of_episodes'] : null,
            'seasons'            => $seasons,
            'episodes'           => $episodes,
            'trailer'            => $trailer,
            'watch_status'       => $this->resource['watch_status'] ?? null,
        ];
    }
}
