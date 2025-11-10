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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('nama_project');
            $table->string('company_name');
            $table->string('customer_name');
            $table->text('customer_additional_info')->nullable();
            $table->string('nomor_unit');
            $table->string('phone_number');
            $table->string('tanggal_masuk_customer');
            $table->enum('project_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->enum('priority_level', ['low', 'medium', 'high'])->default('medium');
            $table->foreignId('jenis_interior_id')->constrained('jenis_interiors')->onDelete('cascade');
            $table->string('mom_file')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
