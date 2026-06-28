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
        Schema::create('kpi_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('month'); // Format: YYYY-MM
            $table->integer('base_score')->default(100);
            $table->integer('fast_responses')->default(0);
            $table->integer('fast_updates')->default(0);
            $table->integer('late_tasks')->default(0);
            $table->integer('completed_projects')->default(0);
            $table->integer('score')->default(100);
            $table->timestamps();

            // Enforce unique user per month
            $table->unique(['user_id', 'month']);
            // Add index for fast querying
            $table->index(['user_id', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_histories');
    }
};
