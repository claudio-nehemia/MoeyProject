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
        Schema::create('moodboard_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moodboard_id')->constrained('moodboards')->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_type')->default('kasar'); // kasar or final
            $table->string('original_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moodboard_files');
    }
};
