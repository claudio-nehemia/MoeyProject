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
        Schema::table('item_pekerjaan_items', function (Blueprint $table) {
            $table->text('keterangan_material')
                ->nullable()
                ->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('item_pekerjaan_items', function (Blueprint $table) {
            $table->dropColumn('keterangan_material');
        });
    }

};
