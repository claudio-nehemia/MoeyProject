<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jenis_pengukuran', function (Blueprint $table) {
            $table->id();
            $table->string('nama_pengukuran');
            $table->timestamps();
            $table->softDeletes(); // membuat deleted_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jenis_pengukuran');
    }
};
