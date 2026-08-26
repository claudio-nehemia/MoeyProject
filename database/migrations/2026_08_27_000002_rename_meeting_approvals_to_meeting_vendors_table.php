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
        if (Schema::hasTable('meeting_approvals') && !Schema::hasTable('meeting_vendors')) {
            Schema::rename('meeting_approvals', 'meeting_vendors');
        } elseif (!Schema::hasTable('meeting_vendors')) {
            Schema::create('meeting_vendors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->date('tanggal_meeting')->nullable();
                $table->time('jam_meeting')->nullable();
                $table->string('lokasi')->nullable();
                $table->text('catatan')->nullable();
                $table->timestamp('response_time')->nullable();
                $table->string('response_by')->nullable();
                $table->timestamp('pm_response_time')->nullable();
                $table->string('pm_response_by')->nullable();
                $table->string('status')->default('scheduled');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('meeting_vendors')) {
            Schema::rename('meeting_vendors', 'meeting_approvals');
        }
    }
};
