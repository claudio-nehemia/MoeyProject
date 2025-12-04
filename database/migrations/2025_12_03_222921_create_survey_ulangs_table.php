<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_ulangs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            $table->text('catatan')->nullable();
            $table->json('foto')->nullable(); // upload foto survei ulang
            $table->json('temuan')->nullable(); // list temuan di lapangan

            $table->timestamp('survey_time')->nullable();
            $table->string('survey_by')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_ulangs');
    }
};
