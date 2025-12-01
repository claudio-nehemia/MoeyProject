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
        Schema::table('invoices', function (Blueprint $table) {
            // Add termin step tracking
            $table->integer('termin_step')->default(1)->after('rab_kontrak_id');
            $table->string('termin_text')->nullable()->after('termin_step');
            $table->decimal('termin_persentase', 5, 2)->default(0)->after('termin_text');
            
            // Drop unique constraint on invoice_number to allow multiple invoices per item_pekerjaan
            $table->dropUnique(['invoice_number']);
            
            // Make it unique per item_pekerjaan + termin_step combination
            $table->unique(['item_pekerjaan_id', 'termin_step']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['item_pekerjaan_id', 'termin_step']);
            $table->unique('invoice_number');
            $table->dropColumn(['termin_step', 'termin_text', 'termin_persentase']);
        });
    }
};
