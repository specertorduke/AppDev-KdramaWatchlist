<?php

namespace App\Modules\Tracker\Models;

use App\Modules\Auth\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tracker extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'discover_id',
        'status',
        'current_episode',
        'rating',
        'review_notes',
        'rewatch_count',
        'is_favorite',
    ];

    protected $attributes = [
        'current_episode' => 0,
        'rewatch_count'   => 0,
        'is_favorite'     => false,
    ];

    /**
     * @var array<string, mixed>|null
     */
    public ?array $dramaMetadata = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discover_id'     => 'integer',
            'current_episode' => 'integer',
            'rating'          => 'integer',
            'rewatch_count'   => 'integer',
            'is_favorite'     => 'boolean',
        ];
    }

    public function discover(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Discover\Models\Discover::class);
    }

    public function getTotalEpisodesAttribute(): ?int
    {
        return $this->discover ? $this->discover->total_episodes : null;
    }

    public function getTmdbIdAttribute(): ?int
    {
        return $this->discover ? $this->discover->tmdb_id : null;
    }

    /**
     * Get the calculated progress percentage.
     */
    public function getProgressPercentageAttribute(): int
    {
        $total = $this->total_episodes; // Uses accessor

        if (empty($total) || $total <= 0) {
            return 0;
        }

        $percentage = ($this->current_episode / $total) * 100;

        return (int) min(100, max(0, round($percentage)));
    }

    /**
     * Tracker belongs to a user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
