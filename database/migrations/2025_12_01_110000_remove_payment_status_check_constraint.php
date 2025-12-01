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
        // Drop the check constraint for payment_status if exists
        DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check');
        
        // Drop the check constraint for tahapan_proyek if exists
        DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tahapan_proyek_check');
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
