<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Termin;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing data to new structure
        $termins = Termin::all();
        foreach ($termins as $termin) {
            if ($termin->tahapan) {
                $updatedTahapan = [];
                foreach ($termin->tahapan as $item) {
                    $updatedTahapan[] = [
                        'step' => $item['step'] ?? 1,
                        'text' => $item['text'] ?? '',
                        'persentase' => 0, // Default percentage
                    ];
                }
                $termin->update(['tahapan' => $updatedTahapan]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback to old structure
        $termins = Termin::all();
        foreach ($termins as $termin) {
            if ($termin->tahapan) {
                $updatedTahapan = [];
                foreach ($termin->tahapan as $item) {
                    $updatedTahapan[] = [
                        'step' => $item['step'] ?? 1,
                        'text' => $item['text'] ?? '',
                    ];
                }
                $termin->update(['tahapan' => $updatedTahapan]);
            }
        }
    }
};
