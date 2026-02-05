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
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->string('approval_rab_response_time')->nullable();
            $table->string('approval_rab_response_by')->nullable();
            $table->timestamp('pm_approval_rab_response_time')->nullable();
            $table->string('pm_approval_rab_response_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->dropColumn([
                'approval_rab_response_time',
                'approval_rab_response_by',
                'pm_approval_rab_response_time',
                'pm_approval_rab_response_by',
            ]);
        });
    }
};
