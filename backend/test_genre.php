<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Discover\Models\Genre;
use Illuminate\Support\Str;

try {
    // Delete existing genres first to ensure clean state
    Genre::query()->delete();

    $g1 = Genre::firstOrCreate(['id' => 18], ['name' => 'Drama', 'slug' => Str::slug('Drama')]);
    echo "Created G1: {$g1->id} - {$g1->name}\n";

    // Should return existing
    $g2 = Genre::firstOrCreate(['id' => 18], ['name' => 'Drama', 'slug' => Str::slug('Drama')]);
    echo "Created G2: {$g2->id} - {$g2->name}\n";

    // Should create new
    $g3 = Genre::firstOrCreate(['id' => 35], ['name' => 'Comedy', 'slug' => Str::slug('Comedy')]);
    echo "Created G3: {$g3->id} - {$g3->name}\n";
    
    echo "Success!\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
