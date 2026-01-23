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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('survey_response_time')->nullable();
            $table->string('survey_response_by')->nullable();
            $table->string('pm_suruey_response_by')->nullable();
            $table->string('pm_survey_response_time')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('survey_response_time');
            $table->dropColumn('survey_response_by');
            $table->dropColumn('pm_suruey_response_by');
            $table->dropColumn('pm_survey_response_time');
        });
    }
};
