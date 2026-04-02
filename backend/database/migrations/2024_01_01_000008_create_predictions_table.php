<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('league_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('season_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->json('data');
            $table->decimal('confidence', 5, 4)->nullable();
            $table->decimal('model_accuracy', 5, 4)->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('predictions'); }
};
