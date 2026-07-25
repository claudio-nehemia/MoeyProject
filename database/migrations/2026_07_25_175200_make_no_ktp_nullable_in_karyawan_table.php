<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE karyawan ALTER COLUMN no_ktp DROP NOT NULL;");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE karyawan MODIFY no_ktp VARCHAR(16) NULL;");
        } else {
            Schema::table('karyawan', function (Blueprint $table) {
                $table->string('no_ktp', 16)->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE karyawan ALTER COLUMN no_ktp SET NOT NULL;");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE karyawan MODIFY no_ktp VARCHAR(16) NOT NULL;");
        } else {
            Schema::table('karyawan', function (Blueprint $table) {
                $table->string('no_ktp', 16)->nullable(false)->change();
            });
        }
    }
};
