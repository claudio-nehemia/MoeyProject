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
        Schema::table('moodboards', function (Blueprint $table) {
            $table->timestamp('pm_response_final_time')->nullable()->after('pm_response_by');
            $table->string('pm_response_final_by')->nullable()->after('pm_response_final_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('moodboards', function (Blueprint $table) {
            $table->dropColumn(['pm_response_final_time', 'pm_response_final_by']);
        });
    }
};
