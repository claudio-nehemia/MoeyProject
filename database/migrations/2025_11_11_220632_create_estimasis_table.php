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
        Schema::create('estimasis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moodboard_id')->constrained('moodboards')->onDelete('cascade');
            $table->string('estimated_cost')->nullable();   
            $table->string('response_by')->nullable();
            $table->string('response_time')->nullable();
                     
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimasis');
    }
};
