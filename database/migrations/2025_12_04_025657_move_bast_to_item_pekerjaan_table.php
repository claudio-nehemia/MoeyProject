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
        // Add BAST columns to item_pekerjaans table
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->string('bast_number')->nullable()->after('unlocked_step');
            $table->timestamp('bast_date')->nullable()->after('bast_number');
            $table->string('bast_pdf_path')->nullable()->after('bast_date');
        });

        // Remove BAST columns from item_pekerjaan_produks table
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->dropColumn(['bast_number', 'bast_date', 'bast_pdf_path']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add BAST columns back to item_pekerjaan_produks table
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->string('bast_number')->nullable();
            $table->timestamp('bast_date')->nullable();
            $table->string('bast_pdf_path')->nullable();
        });

        // Remove BAST columns from item_pekerjaans table
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->dropColumn(['bast_number', 'bast_date', 'bast_pdf_path']);
        });
    }
};
