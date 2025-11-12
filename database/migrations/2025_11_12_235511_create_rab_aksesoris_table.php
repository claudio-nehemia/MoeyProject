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
        Schema::create('rab_aksesoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_produk_id')->constrained('rab_produks')->onDelete('cascade');
            $table->foreignId('item_pekerjaan_item_id')->constrained('item_pekerjaan_items')->onDelete('cascade');
            $table->string('nama_aksesoris')->comment('Nama aksesoris dari item');
            $table->integer('qty_aksesoris')->default(1)->comment('Qty khusus untuk aksesoris');
            $table->decimal('markup_aksesoris', 5, 2)->default(0)->comment('Markup aksesoris dalam persen (%)');
            $table->decimal('harga_satuan_aksesoris', 15, 2)->default(0)->comment('Harga satuan aksesoris dari item');
            $table->decimal('harga_total', 15, 2)->default(0)->comment('Total = harga_satuan × qty × (1 + markup/100)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rab_aksesoris');
    }
};
