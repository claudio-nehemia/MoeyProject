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
        Schema::create('gambar_kerja_final_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_id')
                ->constrained('item_pekerjaans')
                ->cascadeOnDelete();
            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->nullOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->bigInteger('file_size')->nullable();
            $table->string('uploaded_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gambar_kerja_final_files');
    }
};
