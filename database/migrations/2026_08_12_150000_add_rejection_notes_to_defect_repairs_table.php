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
        Schema::table('defect_repairs', function (Blueprint $table) {
            $table->text('rejection_notes')->nullable()->after('approved_at');
            $table->string('rejected_by')->nullable()->after('rejection_notes');
            $table->timestamp('rejected_at')->nullable()->after('rejected_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defect_repairs', function (Blueprint $table) {
            $table->dropColumn(['rejection_notes', 'rejected_by', 'rejected_at']);
        });
    }
};
