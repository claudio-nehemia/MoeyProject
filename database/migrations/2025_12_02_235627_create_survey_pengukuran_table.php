<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_pengukuran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_result_id')->constrained('survey_results')->onDelete('cascade');
            $table->foreignId('jenis_pengukuran_id')->constrained('jenis_pengukuran')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_pengukuran');
    }
};
