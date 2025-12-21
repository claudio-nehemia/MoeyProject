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
        Schema::create('gambar_kerja_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gambar_kerja_id')
                ->constrained('gambar_kerjas')
                ->cascadeOnDelete();

            $table->string('file_path');
            $table->string('original_name');
            $table->string('uploaded_by')->nullable();

            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gambar_kerja_files');
    }
};
