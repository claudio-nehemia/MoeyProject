<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('gambar_kerjas', function (Blueprint $table) {
            $table->timestamp('approved_time')->nullable()->after('revisi_notes');
            $table->string('approved_by')->nullable()->after('approved_time');
        });
    }

    public function down(): void
    {
        Schema::table('gambar_kerjas', function (Blueprint $table) {
            $table->dropColumn(['approved_time', 'approved_by']);
        });
    }
};
