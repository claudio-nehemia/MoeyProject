<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('tahap'); // survey, moodboard, cm_fee, desain_final, rab, kontrak, survey_ulang, gambar_kerja, produksi
            $table->timestamp('start_time'); // Kapan tahap dimulai
            $table->timestamp('response_time')->nullable(); // Kapan user klik Response
            $table->timestamp('update_data_time')->nullable(); // Kapan data diisi/di-update (publish, bukan draft)
            $table->timestamp('deadline'); // Batas waktu
            $table->integer('duration')->default(0); // Durasi dalam hari (total setelah response)
            $table->integer('duration_actual')->default(0); // Durasi sebenarnya (sebelum response)
            $table->integer('extend_time')->default(0); // Berapa kali perpanjangan
            $table->text('extend_reason')->nullable(); // Alasan perpanjangan
            $table->enum('status', [
                'menunggu_response', // Belum klik Response
                'menunggu_input',    // Sudah Response, belum isi data
                'selesai',           // Sudah Response dan sudah isi data (bukan draft)
                'telat'              // Lewat deadline
            ])->default('menunggu_response');
            $table->timestamps();
            
            // Index untuk performa query
            $table->index(['order_id', 'tahap']);
            $table->index(['status', 'deadline']);
            $table->index('deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_responses');
    }
};