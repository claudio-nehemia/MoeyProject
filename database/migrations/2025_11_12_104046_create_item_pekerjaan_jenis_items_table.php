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
        Schema::create('item_pekerjaan_jenis_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->foreignId('jenis_item_id')->constrained('jenis_items')->onDelete('cascade');
            $table->timestamps();
            
            // UNIQUE constraint: 1 jenis item hanya bisa dipilih 1x per produk
            $table->unique(['item_pekerjaan_produk_id', 'jenis_item_id'], 'unique_produk_jenis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pekerjaan_jenis_items');
    }
};
