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
        Schema::create('commitment_fees', function (Blueprint $table) {
            $table->id();
            $table->decimal('total_fee', 15, 2)->nullable();
            $table->string('payment_proof')->nullable();
            $table->enum('payment_status', ['pending', 'completed'])->nullable();
            $table->foreignId('moodboard_id')->constrained('moodboards')->onDelete('cascade');
            $table->string('response_by')->nullable();
            $table->timestamp('response_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commitment_fees');
    }
};
