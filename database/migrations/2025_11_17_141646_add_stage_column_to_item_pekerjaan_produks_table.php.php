<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


class AddStageColumnToItemPekerjaanProduksTable extends Migration
{
    public function up()
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->string('current_stage')->nullable();
        });
    }


    public function down()
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->dropColumn('current_stage');
        });
    }
}