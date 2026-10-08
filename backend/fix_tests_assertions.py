import os
import re

directory = '/Users/zndr/Documents/AppDev-KdramaWatchlist/backend/tests/Feature'
for filename in os.listdir(directory):
    if filename.endswith('.php'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # We need to replace assertDatabaseHas('trackers', ['tmdb_id' => $tmdbId]) 
        # Since this is a bit complex, I will write a custom replace logic.
        content = content.replace("assertDatabaseHas('trackers', [", "assertDatabaseHasTracker([")
        
        # HomeTest user update
        content = content.replace("update(['favorite_genres' => ['Thriller', 'Horror']])", "favoriteGenres()->sync([\App\Modules\Discover\Models\Genre::firstOrCreate(['name' => 'Thriller', 'slug' => 'thriller'])->id, \App\Modules\Discover\Models\Genre::firstOrCreate(['name' => 'Horror', 'slug' => 'horror'])->id])")
        content = content.replace("update(['favorite_genres' => ['Romance']])", "favoriteGenres()->sync([\App\Modules\Discover\Models\Genre::firstOrCreate(['name' => 'Romance', 'slug' => 'romance'])->id])")
        
        with open(filepath, 'w') as f:
            f.write(content)
