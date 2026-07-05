<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cashflow_vendor_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('vendor_type');              // 'internal', 'fisik', 'external'
            $table->string('section');                   // 'pembayaran_vendor', 'material_hutang', 'item_external', 'addendum_external', 'pengeluaran_luar'
            $table->string('vendor_group')->nullable();  // Nama group vendor (dinamis, user-defined)
            $table->string('label')->nullable();
            $table->string('vendor_name')->nullable();
            $table->decimal('persentase', 10, 4)->nullable();
            $table->decimal('nilai', 20, 2)->default(0);
            $table->decimal('pembayaran', 20, 2)->default(0);
            $table->decimal('spk_amount', 20, 2)->default(0);
            $table->date('tanggal_inv')->nullable();
            $table->date('tanggal_pembayaran')->nullable();
            $table->date('tanggal_perencanaan')->nullable();
            $table->date('tanggal_pembayaran_termin')->nullable();
            $table->decimal('pembayaran_termin', 20, 2)->default(0);
            $table->string('flag_af')->nullable();
            $table->string('flag_fb')->nullable();
            $table->string('flag_jw')->nullable();
            $table->string('flag_af_termin')->nullable();
            $table->string('flag_fb_termin')->nullable();
            $table->string('flag_jw_termin')->nullable();
            $table->boolean('reminder_sent')->default(false);
            $table->boolean('reminder_termin_sent')->default(false);
            $table->integer('sort_order')->default(0);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'vendor_type']);
            $table->index(['tanggal_pembayaran', 'reminder_sent']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashflow_vendor_entries');
    }
};
