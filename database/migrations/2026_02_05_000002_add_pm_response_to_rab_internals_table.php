<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rab_internals', function (Blueprint $table) {
            $table->timestamp('pm_response_time')->nullable()->after('response_time');
            $table->string('pm_response_by')->nullable()->after('pm_response_time');
        });
    }

    public function down(): void
    {
        Schema::table('rab_internals', function (Blueprint $table) {
            $table->dropColumn(['pm_response_time', 'pm_response_by']);
        });
    }
};
