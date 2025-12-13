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
            $table->timestamp('response_final_time')->nullable()->after('response_by');
            $table->string('response_final_by')->nullable()->after('response_final_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('moodboards', function (Blueprint $table) {
            $table->dropColumn(['response_final_time', 'response_final_by']);
        });
    }
};
