<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;

/**
 * Seeder untuk menyinkronkan project_status order berdasarkan tahapan proyek.
 * 
 * Logika:
 * - Jika tahapan_proyek sudah melewati 'kontrak' (yaitu 'produksi'),
 *   atau order sudah punya kontrak dengan signed_contract_path,
 *   maka project_status diubah menjadi 'deal'.
 * 
 * Urutan tahapan_proyek:
 *   not_start → survey → moodboard → cm_fee → desain_final → rab → kontrak → produksi
 * 
 * Tahapan yang dianggap sudah deal: kontrak, produksi
 * (karena kontrak dibuat = sudah deal)
 * 
 * Jalankan: php artisan db:seed --class=SyncProjectStatusSeeder
 */
class SyncProjectStatusSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔄 Mulai sinkronisasi project_status berdasarkan tahapan proyek...');
        $this->command->newLine();

        // Tahapan yang menandakan order sudah deal
        $dealTahapan = ['kontrak', 'produksi'];

        $orders = Order::all();

        $updated = 0;
        $alreadyDeal = 0;
        $notDeal = 0;

        foreach ($orders as $order) {
            $tahapan = $order->tahapan_proyek;

            if (in_array($tahapan, $dealTahapan)) {
                if ($order->project_status === 'deal') {
                    $alreadyDeal++;
                    $this->command->line("  ✅ Order #{$order->id} [{$order->nama_project}] — Sudah deal (tahapan: {$tahapan})");
                } else {
                    $oldStatus = $order->project_status;
                    $order->update(['project_status' => 'deal']);
                    $updated++;
                    $this->command->line("  🔄 Order #{$order->id} [{$order->nama_project}] — {$oldStatus} → deal (tahapan: {$tahapan})");
                }
            } else {
                $notDeal++;
            }
        }

        $this->command->newLine();
        $this->command->info('📊 Hasil Sinkronisasi:');
        $this->command->table(
            ['Keterangan', 'Jumlah'],
            [
                ['Total orders', $orders->count()],
                ['Diupdate ke deal', $updated],
                ['Sudah deal (tidak berubah)', $alreadyDeal],
                ['Belum deal (tahapan belum kontrak)', $notDeal],
            ]
        );

        $this->command->newLine();
        $this->command->info('✅ Sinkronisasi selesai!');
    }
}
