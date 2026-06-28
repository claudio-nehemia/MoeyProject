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
        Schema::create('cashflow_manual_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('category'); // spk_internal, spk_fisik, spk_external, fee_team, operational, marketing, overhead, entertainment, gaji, cadangan_problem, management, vendor_payment, kasbon, unplanned, other
            $table->string('label'); // nama item / keterangan
            $table->decimal('amount_estimasi', 25, 2)->default(0);
            $table->decimal('amount_realisasi', 25, 2)->default(0);
            $table->date('tanggal')->nullable();
            $table->text('notes')->nullable();
            $table->string('section'); // internal, fisik, external, general
            $table->string('phase')->default('general'); // dp, termin, pelunasan, general
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashflow_manual_entries');
    }
};
