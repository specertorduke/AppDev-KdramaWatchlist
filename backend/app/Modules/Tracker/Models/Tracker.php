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
        'tmdb_id',
        'status',
        'current_episode',
        'total_episodes',
        'rating',
        'review_notes',
        'rewatch_count',
    ];

    protected $attributes = [
        'current_episode' => 0,
        'rewatch_count'   => 0,
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
            'tmdb_id'         => 'integer',
            'current_episode' => 'integer',
            'total_episodes'  => 'integer',
            'rating'          => 'integer',
            'rewatch_count'   => 'integer',
        ];
    }

    /**
     * Get the calculated progress percentage.
     */
    public function getProgressPercentageAttribute(): int
    {
        if (empty($this->total_episodes) || $this->total_episodes <= 0) {
            return 0;
        }

        $percentage = ($this->current_episode / $this->total_episodes) * 100;

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
