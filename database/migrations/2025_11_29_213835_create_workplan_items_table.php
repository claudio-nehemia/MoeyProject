<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('workplan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_produk_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('nama_tahapan');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedInteger('duration_days')->nullable(); // dihitung otomatis
            $table->unsignedInteger('urutan')->default(1);

            // planned = rencana, in_progress = dikerjakan, done = selesai, cancelled = batal
            $table->string('status')->default('planned');
            $table->text('catatan')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workplan_items');
    }
};
