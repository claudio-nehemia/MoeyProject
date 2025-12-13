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
        Schema::create('item_pekerjaan_produk_bahan_bakus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade'); // bahan baku item
            $table->decimal('harga_dasar', 18, 2)->default(0); // harga dasar dari produk_items pivot
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pekerjaan_produk_bahan_bakus');
    }
};
