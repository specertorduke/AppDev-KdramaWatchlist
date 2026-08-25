<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trackers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('tmdb_id');
            $table->enum('status', [
                'watching',
                'completed',
                'plan_to_watch',
                'on_hold',
                'dropped',
            ])->default('plan_to_watch');
            $table->unsignedSmallInteger('current_episode')->default(0);
            $table->unsignedSmallInteger('total_episodes')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('review_notes')->nullable();
            $table->unsignedSmallInteger('rewatch_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'tmdb_id']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trackers');
    }
};
