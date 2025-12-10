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
        Schema::table('kontraks', function (Blueprint $table) {
            $table->string('signed_contract_path')->nullable()->after('tanggal_selesai');
            $table->timestamp('signed_at')->nullable()->after('signed_contract_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kontraks', function (Blueprint $table) {
            $table->dropColumn(['signed_contract_path', 'signed_at']);
        });
    }
};
