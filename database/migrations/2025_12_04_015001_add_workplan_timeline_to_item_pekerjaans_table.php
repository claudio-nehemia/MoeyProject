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
            $table->date('workplan_start_date')->nullable()->after('response_time');
            $table->date('workplan_end_date')->nullable()->after('workplan_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->dropColumn(['workplan_start_date', 'workplan_end_date']);
        });
    }
};
