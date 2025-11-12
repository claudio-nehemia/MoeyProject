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
        Schema::create('rab_produks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_internal_id')->constrained('rab_internals')->onDelete('cascade');
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->decimal('markup_satuan', 5, 2)->default(0)->comment('Markup dalam persen (%)');
            $table->decimal('harga_dasar', 15, 2)->default(0)->comment('Harga dasar produk');
            $table->decimal('harga_items_non_aksesoris', 15, 2)->default(0)->comment('Total harga items (bahan baku + finishing)');
            $table->decimal('harga_dimensi', 15, 2)->default(0)->comment('Harga dari dimensi (P×L×T×Qty)');
            $table->decimal('harga_satuan', 15, 2)->default(0)->comment('Harga satuan setelah markup');
            $table->decimal('harga_total_aksesoris', 15, 2)->default(0)->comment('Total harga semua aksesoris');
            $table->decimal('harga_akhir', 15, 2)->default(0)->comment('Harga final produk');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rab_produks');
    }
};
