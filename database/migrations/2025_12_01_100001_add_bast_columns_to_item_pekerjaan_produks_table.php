<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->string('bast_number')->nullable()->after('current_stage');
            $table->timestamp('bast_date')->nullable()->after('bast_number');
            $table->string('bast_pdf_path')->nullable()->after('bast_date');
        });
    }

    public function down(): void
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->dropColumn(['bast_number', 'bast_date', 'bast_pdf_path']);
        });
    }
};
