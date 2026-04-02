<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('league_id')->constrained()->cascadeOnDelete();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            $table->foreignId('home_team_id')->references('id')->on('teams')->cascadeOnDelete();
            $table->foreignId('away_team_id')->references('id')->on('teams')->cascadeOnDelete();
            $table->integer('home_goals')->nullable();
            $table->integer('away_goals')->nullable();
            $table->string('result')->nullable();
            $table->date('match_date')->nullable();
            $table->integer('home_shots')->nullable();
            $table->integer('away_shots')->nullable();
            $table->integer('home_shots_on_target')->nullable();
            $table->integer('away_shots_on_target')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('matches'); }
};
