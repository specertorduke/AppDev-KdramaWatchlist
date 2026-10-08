<?php

namespace App\Modules\Discover\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Discover extends Model
{
    use HasFactory;

    protected $guarded = ['id'];
    
    protected $casts = [
        'first_air_date' => 'date',
        'rating' => 'float',
    ];

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'discover_genre');
    }
}
