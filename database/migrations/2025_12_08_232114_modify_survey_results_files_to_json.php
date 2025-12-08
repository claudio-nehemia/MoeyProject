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
        Schema::table('survey_results', function (Blueprint $table) {
            // Drop additional_files column (wrong implementation)
            $table->dropColumn('additional_files');
            
            // Change existing columns to JSON for multiple files
            $table->json('layout_files')->nullable()->after('feedback');
            $table->json('foto_lokasi_files')->nullable()->after('layout_files');
            
            // Drop old single file columns
            $table->dropColumn(['layout', 'foto_lokasi']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_results', function (Blueprint $table) {
            $table->string('layout')->nullable();
            $table->string('foto_lokasi')->nullable();
            $table->json('additional_files')->nullable();
            $table->dropColumn(['layout_files', 'foto_lokasi_files']);
        });
    }
};
