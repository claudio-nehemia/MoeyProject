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
        // Add approval columns to defect_repairs
        Schema::table('defect_repairs', function (Blueprint $table) {
            $table->boolean('is_approved')->default(false)->after('repaired_at');
            $table->string('approved_by')->nullable()->after('is_approved');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });

        // Add contract date columns to kontraks
        Schema::table('kontraks', function (Blueprint $table) {
            $table->date('tanggal_mulai')->nullable()->after('harga_kontrak');
            $table->date('tanggal_selesai')->nullable()->after('tanggal_mulai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defect_repairs', function (Blueprint $table) {
            $table->dropColumn(['is_approved', 'approved_by', 'approved_at']);
        });

        Schema::table('kontraks', function (Blueprint $table) {
            $table->dropColumn(['tanggal_mulai', 'tanggal_selesai']);
        });
    }
};
