<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // pastiin dulu tipe jadi varchar
        DB::statement("ALTER TABLE orders ALTER COLUMN tahapan_proyek TYPE varchar(255)");

        // default
        DB::statement("ALTER TABLE orders ALTER COLUMN tahapan_proyek SET DEFAULT 'not_start'");

        // wajib isi
        DB::statement("ALTER TABLE orders ALTER COLUMN tahapan_proyek SET NOT NULL");

        // hapus constraint lama kalau ada
        DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tahapan_proyek_check");

        // bikin constraint baru
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
                'produksi',
                'selesai'
            ))
        ");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tahapan_proyek_check");
    }
};
