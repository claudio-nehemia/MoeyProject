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
        Schema::create('rab_vendor_aksesoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_vendor_produk_id')->constrained('rab_vendor_produks')->onDelete('cascade');
            $table->foreignId('item_pekerjaan_item_id')->constrained('item_pekerjaan_items')->onDelete('cascade');
            $table->decimal('harga_satuan_aksesoris', 15, 2);
            $table->integer('qty_aksesoris');
            $table->decimal('harga_total', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rab_vendor_aksesoris');
    }
};
