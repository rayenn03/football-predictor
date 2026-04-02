<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('leagues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('country');
            $table->string('logo_url')->nullable();
            $table->integer('teams_count')->default(20);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('leagues'); }
};
