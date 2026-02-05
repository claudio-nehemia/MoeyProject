<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
             // response_time: Kapan user klik Response (khusus invoice pertama/DP)
            $table->timestamp('response_time')->nullable()->after('paid_at');
            $table->string('response_by')->nullable()->after('response_time');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['response_time', 'response_by']);
        });
    }
};
