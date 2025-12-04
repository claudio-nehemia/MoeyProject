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
            // Track which termin step is currently unlocked for payment
            // Step 1 is always unlocked by default after first invoice payment
            // Next steps require explicit unlock via "Tagih Pembayaran" button
            $table->integer('unlocked_step')->default(1)->after('workplan_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->dropColumn('unlocked_step');
        });
    }
};
