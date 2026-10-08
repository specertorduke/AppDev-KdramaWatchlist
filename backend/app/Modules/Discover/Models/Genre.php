<?php

namespace App\Modules\Discover\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Genre extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $fillable = ['id', 'name', 'slug', 'description'];

    public function discovers(): BelongsToMany
    {
        return $this->belongsToMany(Discover::class, 'discover_genre');
    }
}
