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
            $table->timestamp('response_time')->nullable()->after('catatan');
            $table->string('response_by')->nullable()->after('response_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workplan_items', function (Blueprint $table) {
            $table->dropColumn(['response_time', 'response_by']);
        });
    }
};
