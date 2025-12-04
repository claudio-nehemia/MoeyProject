<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->date('workplan_start_date')->nullable()->after('bast_pdf_path');
            $table->date('workplan_end_date')->nullable()->after('workplan_start_date');
        });
    }

    public function down(): void
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->dropColumn(['workplan_start_date', 'workplan_end_date']);
        });
    }
};
