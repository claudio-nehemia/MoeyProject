<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->string('stage'); // Nama stage (Potong, Rangkai, dll)
            $table->string('evidence_path'); // Path gambar bukti
            $table->text('notes')->nullable(); // Catatan opsional
            $table->string('uploaded_by'); // Nama user yang upload
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_evidences');
    }
};
