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
        Schema::table('rab_internals', function (Blueprint $table) {
            $table->boolean('is_submitted')->default(false)->after('response_time');
            $table->string('submitted_by')->nullable()->after('is_submitted');
            $table->timestamp('submitted_at')->nullable()->after('submitted_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rab_internals', function (Blueprint $table) {
            $table->dropColumn(['is_submitted', 'submitted_by', 'submitted_at']);
        });
    }
};
