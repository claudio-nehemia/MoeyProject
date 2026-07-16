<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cashflow_vendor_entries', function (Blueprint $table) {
            $table->boolean('reminder_h7_sent')->default(false)->after('reminder_sent');
            $table->boolean('reminder_h7_termin_sent')->default(false)->after('reminder_termin_sent');
        });

        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->boolean('reminder_fee_sent')->default(false)->after('pm_approval_rab_response_by');
        });
    }

    public function down(): void
    {
        Schema::table('cashflow_vendor_entries', function (Blueprint $table) {
            $table->dropColumn(['reminder_h7_sent', 'reminder_h7_termin_sent']);
        });

        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->dropColumn(['reminder_fee_sent']);
        });
    }
};
