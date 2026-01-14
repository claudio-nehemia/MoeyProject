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
        Schema::table('workplan_items', function (Blueprint $table) {
            $table->timestamp('pm_response_time')->nullable()->after('response_by');
            $table->string('pm_response_by')->nullable()->after('pm_response_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workplan_items', function (Blueprint $table) {
            $table->dropColumn(['pm_response_time', 'pm_response_by']);
        });
    }
};
