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
        Schema::create('rab_vendor_produks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_vendor_id')->constrained('rab_vendors')->onDelete('cascade');
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->decimal('harga_dasar', 15, 2);
            $table->decimal('harga_items_non_aksesoris', 15, 2);
            $table->decimal('harga_dimensi', 15, 2);
            $table->decimal('harga_satuan', 15, 2);
            $table->decimal('harga_total_aksesoris', 15, 2)->default(0);
            $table->decimal('harga_akhir', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rab_vendor_produks');
    }
};
