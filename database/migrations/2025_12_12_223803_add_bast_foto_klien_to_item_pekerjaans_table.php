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
            $table->string('bast_foto_klien')->nullable()->after('bast_pdf_path');
            $table->timestamp('bast_foto_klien_uploaded_at')->nullable()->after('bast_foto_klien');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaans', function (Blueprint $table) {
            $table->dropColumn(['bast_foto_klien', 'bast_foto_klien_uploaded_at']);
        });
    }
};
