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
        // Table rab_kontraks (similar to rab_internals)
        Schema::create('rab_kontraks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_id')->constrained('item_pekerjaans')->cascadeOnDelete();
            $table->string('response_by');
            $table->dateTime('response_time');
            $table->timestamps();
        });

        // Table rab_kontrak_produks (similar structure but no markup columns)
        Schema::create('rab_kontrak_produks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_kontrak_id')->constrained('rab_kontraks')->cascadeOnDelete();
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->cascadeOnDelete();
            $table->decimal('harga_dasar', 15, 2); // Already with markup
            $table->decimal('harga_items_non_aksesoris', 15, 2); // Already with markup
            $table->decimal('harga_dimensi', 15, 2);
            $table->decimal('harga_satuan', 15, 2); // Final price per unit
            $table->decimal('harga_total_aksesoris', 15, 2)->default(0);
            $table->decimal('harga_akhir', 15, 2); // Final price (satuan + aksesoris)
            $table->timestamps();
        });

        // Table rab_kontrak_aksesoris (similar structure but no markup column)
        Schema::create('rab_kontrak_aksesoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_kontrak_produk_id')->constrained('rab_kontrak_produks')->cascadeOnDelete();
            $table->foreignId('item_pekerjaan_item_id')->constrained('item_pekerjaan_items')->cascadeOnDelete();
            $table->decimal('harga_satuan_aksesoris', 15, 2); // Already with markup
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
        Schema::dropIfExists('rab_kontrak_aksesoris');
        Schema::dropIfExists('rab_kontrak_produks');
        Schema::dropIfExists('rab_kontraks');
    }
};
