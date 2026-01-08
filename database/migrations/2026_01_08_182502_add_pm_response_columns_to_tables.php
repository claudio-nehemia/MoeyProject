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
        // Tables yang memerlukan PM response tracking
        $tables = [
            'moodboards',
            'estimasis',
            'commitment_fees',
            'item_pekerjaans',
            'survey_ulangs',
            'gambar_kerjas',
            'kontraks',
            'survey_results',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->timestamp('pm_response_time')->nullable()->after('response_time');
                $table->string('pm_response_by')->nullable()->after('pm_response_time');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'moodboards',
            'estimasis',
            'commitment_fees',
            'item_pekerjaans',
            'survey_ulangs',
            'gambar_kerjas',
            'kontraks',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn(['pm_response_time', 'pm_response_by']);
            });
        }
    }
};
