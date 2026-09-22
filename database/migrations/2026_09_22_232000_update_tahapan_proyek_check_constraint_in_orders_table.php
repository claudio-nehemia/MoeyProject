<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Hapus constraint lama jika ada
        DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tahapan_proyek_check");

        // Buat constraint baru dengan menyertakan seluruh tahapan alur proyek terkini
        DB::statement("
            ALTER TABLE orders
            ADD CONSTRAINT orders_tahapan_proyek_check
            CHECK (tahapan_proyek IN (
                'not_start',
                'survey',
                'moodboard',
                'cm_fee',
                'desain_final',
                'rab',
                'kontrak',
                'survey_ulang',
                'gambar_kerja',
                'meeting_vendor',
                'approval_material',
                'workplan',
                'produksi',
                'selesai'
            ))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tahapan_proyek_check");
    }
};
