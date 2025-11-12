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
        Schema::create('rab_internals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_id')->constrained('item_pekerjaans')->onDelete('cascade');
            $table->string('response_by')->nullable();
            $table->timestamp('response_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rab_internals');
    }
};
