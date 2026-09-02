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
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->string('event_key')->unique();
            $table->string('category')->default('order_stage'); // order_stage, reminder, system
            $table->string('nama_pengaturan');
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('send_database')->default(true);
            $table->boolean('send_fcm')->default(true);
            $table->string('recipient_type')->default('order_team'); // order_team, all_by_role
            $table->json('target_role_ids')->nullable();
            $table->boolean('send_to_management')->default(true);
            $table->json('management_role_ids')->nullable();
            $table->integer('days_offset')->default(0);
            $table->string('title_template');
            $table->text('message_template');
            $table->string('action_url')->nullable();
            $table->json('available_placeholders')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
