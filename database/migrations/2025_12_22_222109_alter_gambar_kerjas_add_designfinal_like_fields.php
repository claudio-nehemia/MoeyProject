<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('gambar_kerjas', function (Blueprint $table) {

            // status flow (pending, uploaded, approved)
            if (!Schema::hasColumn('gambar_kerjas', 'status')) {
                $table->string('status')->default('pending')->after('order_id');
            }

            // response info
            if (!Schema::hasColumn('gambar_kerjas', 'response_time')) {
                $table->timestamp('response_time')->nullable()->after('status');
            }

            if (!Schema::hasColumn('gambar_kerjas', 'response_by')) {
                $table->string('response_by')->nullable()->after('response_time');
            }

            // file yang di-approve (setara moodboard_final)
            if (!Schema::hasColumn('gambar_kerjas', 'approved_file')) {
                $table->string('approved_file')->nullable()->after('response_by');
            }

            // revisi notes
            if (!Schema::hasColumn('gambar_kerjas', 'revisi_notes')) {
                $table->text('revisi_notes')->nullable()->after('approved_file');
            }
        });
    }

    public function down(): void
    {
        Schema::table('gambar_kerjas', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'response_time',
                'response_by',
                'approved_file',
                'revisi_notes',
            ]);
        });
    }
};
