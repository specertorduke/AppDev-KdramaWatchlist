<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create genres table
        Schema::create('genres', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Create discovers table
        Schema::create('discovers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tmdb_id')->unique();
            $table->string('title');
            $table->string('original_title')->nullable();
            $table->text('overview')->nullable();
            $table->string('poster_path')->nullable();
            $table->string('backdrop_path')->nullable();
            $table->date('first_air_date')->nullable();
            $table->float('rating', 3, 1)->nullable();
            $table->unsignedInteger('vote_count')->default(0);
            $table->unsignedSmallInteger('total_episodes')->nullable();
            $table->unsignedSmallInteger('total_seasons')->nullable();
            $table->unsignedSmallInteger('episode_runtime')->nullable();
            $table->string('status')->nullable();
            $table->string('trailer_url')->nullable();
            $table->string('network')->nullable();
            $table->timestamps();
        });

        // 3. Create discover_genre table with surrogate PK (as shown in ERD)
        Schema::create('discover_genre', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discover_id')->constrained('discovers')->cascadeOnDelete();
            $table->foreignId('genre_id')->constrained('genres')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['discover_id', 'genre_id']);
        });

        // 4. Create user_favorite_genres table
        Schema::create('user_favorite_genres', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('genre_id')->constrained('genres')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['user_id', 'genre_id']);
        });

        // 5. Update users table (remove JSON favorite_genres)
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'favorite_genres')) {
                $table->dropColumn('favorite_genres');
            }
        });

        // 6. Update trackers table (change tmdb_id to discover_id, drop total_episodes)
        // Since sqlite doesn't easily let us change columns with foreign keys directly without recreating table sometimes,
        // and we might have existing data. We will add the column, and since it's an API dev environment, 
        // we can truncate trackers if there's an issue or just add nullable.
        DB::statement('DELETE FROM trackers'); // Clear trackers to easily alter schema in dev

        Schema::table('trackers', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'tmdb_id']);
            $table->foreignId('discover_id')->after('user_id')->constrained('discovers')->cascadeOnDelete();
        });

        Schema::table('trackers', function (Blueprint $table) {
            $table->dropColumn('tmdb_id');
            $table->dropColumn('total_episodes');
            
            $table->unique(['user_id', 'discover_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DELETE FROM trackers');
        
        Schema::table('trackers', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'discover_id']);
            $table->dropForeign(['discover_id']);
            $table->dropColumn('discover_id');

            $table->unsignedBigInteger('tmdb_id')->after('user_id');
            $table->unsignedSmallInteger('total_episodes')->nullable()->after('current_episode');
            
            $table->unique(['user_id', 'tmdb_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->json('favorite_genres')->nullable()->after('terms_privacy_accepted_at');
        });

        Schema::dropIfExists('user_favorite_genres');
        Schema::dropIfExists('discover_genre');
        Schema::dropIfExists('discovers');
        Schema::dropIfExists('genres');
    }
};
