<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('defects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->enum('qc_stage', ['Finishing QC', 'Install QC']); // Tahap QC mana yang menemukan cacat
            $table->string('reported_by'); // User yang melaporkan
            $table->timestamp('reported_at');
            $table->enum('status', ['pending', 'in_repair', 'completed'])->default('pending');
            $table->timestamps();
        });

        Schema::create('defect_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defect_id')->constrained('defects')->onDelete('cascade');
            $table->string('photo_path'); // Path foto cacat
            $table->text('notes'); // Catatan cacat
            $table->integer('order')->default(0); // Urutan foto
            $table->timestamps();
        });

        Schema::create('defect_repairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defect_item_id')->constrained('defect_items')->onDelete('cascade');
            $table->string('photo_path'); // Path foto hasil perbaikan
            $table->text('notes'); // Catatan perbaikan
            $table->string('repaired_by'); // User yang memperbaiki
            $table->timestamp('repaired_at');
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('defect_repairs');
        Schema::dropIfExists('defect_items');
        Schema::dropIfExists('defects');    }
};
