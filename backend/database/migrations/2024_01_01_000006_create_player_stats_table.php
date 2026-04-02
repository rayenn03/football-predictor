<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('player_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            $table->foreignId('league_id')->constrained()->cascadeOnDelete();
            $table->integer('goals')->default(0);
            $table->integer('assists')->default(0);
            $table->integer('matches_played')->default(0);
            $table->integer('minutes_played')->default(0);
            $table->integer('yellow_cards')->default(0);
            $table->integer('red_cards')->default(0);
            $table->integer('clean_sheets')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('player_stats'); }
};
