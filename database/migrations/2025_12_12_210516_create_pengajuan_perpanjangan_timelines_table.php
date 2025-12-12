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
        Schema::create('pengajuan_perpanjangan_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId("item_pekerjaan_id")->constrained("item_pekerjaans")->onDelete("cascade");
            $table->enum("status", ["pending", "approved", "rejected", "none"]);
            $table->string('reason')->nullable();  
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_perpanjangan_timelines');
    }
};
