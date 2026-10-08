<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createTestTracker(array $attributes = [])
    {
        $tmdbId = $attributes['tmdb_id'] ?? 12345;
        $totalEpisodes = $attributes['total_episodes'] ?? 16;
        
        $discover = \App\Modules\Discover\Models\Discover::firstOrCreate(
            ['tmdb_id' => $tmdbId],
            [
                'title' => 'Test Drama ' . $tmdbId,
                'total_episodes' => $totalEpisodes,
            ]
        );

        unset($attributes['tmdb_id']);
        unset($attributes['total_episodes']);
        
        $attributes['discover_id'] = $discover->id;
        
        return \App\Modules\Tracker\Models\Tracker::create($attributes);
    }

    public function assertDatabaseHasTracker(array $attributes = [])
    {
        if (isset($attributes['tmdb_id'])) {
            $discover = \App\Modules\Discover\Models\Discover::where('tmdb_id', $attributes['tmdb_id'])->first();
            if ($discover) {
                $attributes['discover_id'] = $discover->id;
            }
            unset($attributes['tmdb_id']);
        }
        if (isset($attributes['total_episodes'])) {
            unset($attributes['total_episodes']);
        }
        $this->assertDatabaseHas('trackers', $attributes);
    }
}
