<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Cabang;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Jamkerja;
use App\Models\Karyawan;
use App\Models\Pengaturanumum;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceTestingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Cabang Kantor (Radius 100km agar testing tidak terblokir lokasi)
        $cabang = Cabang::updateOrCreate(
            ['kode_cabang' => 'PST'],
            [
                'nama_cabang' => 'Kantor Pusat Jakarta',
                'alamat_cabang' => 'Jl. Jenderal Sudirman No. 1, Jakarta Pusat',
                'telepon_cabang' => '021-123456',
                'lokasi_cabang' => '-6.175392, 106.827153', // Koordinat Monas/Jakarta
                'radius_cabang' => 30000, // 30 km (maksimum untuk smallint adalah 32767)
                'timezone' => 'Asia/Jakarta',
            ]
        );

        // 2. Departemen
        $dept = Departemen::updateOrCreate(
            ['kode_dept' => 'IT'],
            ['nama_dept' => 'Information Technology']
        );

        // 3. Jabatan
        $jabatan = Jabatan::updateOrCreate(
            ['kode_jabatan' => 'STA'],
            ['nama_jabatan' => 'Staff IT']
        );

        // 4. Status Kawin
        DB::table('status_kawin')->updateOrInsert(
            ['kode_status_kawin' => 'TK'],
            [
                'status_kawin' => 'Tidak Kawin',
                'kategori_ter' => 'A',
                'nilai_ptkp' => 54000000,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 5. Status Karyawan
        DB::table('status_karyawan')->updateOrInsert(
            ['kode_status_karyawan' => 'K001'],
            [
                'nama_status_karyawan' => 'Kontrak',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 6. Jam Kerja (Shift Normal)
        $jamkerja = Jamkerja::updateOrCreate(
            ['kode_jam_kerja' => 'JK01'],
            [
                'nama_jam_kerja' => 'Shift Normal Pagi',
                'jam_masuk' => '08:00:00',
                'jam_pulang' => '17:00:00',
                'istirahat' => '1',
                'jam_awal_istirahat' => '12:00:00',
                'jam_akhir_istirahat' => '13:00:00',
                'total_jam' => 8,
                'lintashari' => '0',
                'color' => '#f59e0b',
            ]
        );

        // 7. Jadwal Kerja Global Harian (Senin - Minggu menggunakan JK01)
        $hariList = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        foreach ($hariList as $hari) {
            DB::table('global_jamkerja')->updateOrInsert(
                ['hari' => $hari],
                [
                    'kode_jam_kerja' => 'JK01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 8. Hubungkan SEMUA User di database ke tabel Karyawan
        $users = User::all();
        foreach ($users as $u) {
            // Khusus Budi, tetap gunakan NIK 123456789 agar sesuai panduan sebelumnya
            $nik = ($u->email === 'cs.budi@company.com') ? '123456789' : sprintf('12345%04d', $u->id);

            Karyawan::updateOrCreate(
                ['user_id' => $u->id],
                [
                    'nik' => $nik,
                    'nama_karyawan' => $u->name,
                    'no_ktp' => '31710' . sprintf('%011d', $u->id),
                    'jenis_kelamin' => 'L',
                    'kode_status_kawin' => 'TK',
                    'kode_cabang' => 'PST',
                    'kode_dept' => 'IT',
                    'kode_jabatan' => 'STA',
                    'tanggal_masuk' => Carbon::now()->toDateString(),
                    'status_karyawan' => 'K001',
                    'lock_location' => '1',
                    'lock_jam_kerja' => '1',
                    'status_aktif_karyawan' => '1',
                ]
            );
        }

        // 9. Update Pengaturan Umum (Role Penyetuju = Admin, Semua Fitur Aktif)
        $roleAdmin = Role::where('nama_role', 'Admin')->first();
        if ($roleAdmin) {
            Pengaturanumum::updateOrCreate(
                ['id' => 1],
                [
                    'nama_perusahaan' => 'Moey Project Ltd',
                    'cuti_approval_role_id' => $roleAdmin->id,
                    'feature_visit_tracking' => 1,
                    'feature_daily_activity' => 1,
                    'feature_wa_notification' => 1,
                    'global_jamkerja_aktif' => 1,
                ]
            );
        }

        $this->command->info('AttendanceTestingSeeder berhasil dijalankan!');
        $this->command->info('Seluruh User di database telah terhubung ke tabel Karyawan dengan Radius Kantor 30 KM.');
    }
}
