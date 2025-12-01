<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all check constraints for orders table and drop them safely
        $constraints = DB::select("
            SELECT con.conname as constraint_name
            FROM pg_catalog.pg_constraint con
            INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = 'orders'
            AND con.contype = 'c'
            AND (con.conname LIKE '%payment_status%' OR con.conname LIKE '%tahapan_proyek%')
        ");

        foreach ($constraints as $constraint) {
            DB::statement("ALTER TABLE orders DROP CONSTRAINT \"{$constraint->constraint_name}\"");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add constraints if needed (optional)
        // DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('not_start', 'cm_fee', 'dp', 'termin', 'lunas'))");
    }
};
