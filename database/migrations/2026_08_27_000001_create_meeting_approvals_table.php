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
        Schema::create('meeting_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->date('tanggal_meeting')->nullable();
            $table->string('jam_meeting')->nullable();
            $table->string('lokasi')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('response_time')->nullable();
            $table->string('response_by')->nullable();
            $table->timestamp('pm_response_time')->nullable();
            $table->string('pm_response_by')->nullable();
            $table->string('status')->default('pending'); // pending, waiting_input, scheduled
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_approvals');
    }
};
