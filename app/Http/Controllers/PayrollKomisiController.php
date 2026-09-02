<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Karyawan;
use App\Models\PayrollPositionConfig;
use App\Models\PayrollKpiConfig;
use App\Models\PayrollKasbon;
use App\Models\PayrollMonthly;
use App\Services\PayrollCalculationService;

class PayrollKomisiController extends Controller
{
    protected PayrollCalculationService $service;

    public function __construct(PayrollCalculationService $service)
    {
        $this->service = $service;
    }

    /**
     * Halaman utama payroll — list semua karyawan & slip gaji
     */
    public function index(Request $request)
    {
        $bulan = $request->input('bulan', now()->month);
        $tahun = $request->input('tahun', now()->year);
        $divisi = $request->input('divisi');

        // Ambil semua config jabatan
        $configs = PayrollPositionConfig::where('is_active', true)
            ->with('kpiConfigs')
            ->get();

        // Ambil slip gaji bulan ini
        $slips = PayrollMonthly::where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->with(['karyawan', 'karyawan.jabatan', 'karyawan.departemen', 'positionConfig'])
            ->get();

        // Ambil semua karyawan aktif
        $karyawanQuery = Karyawan::with(['jabatan', 'departemen'])
            ->where(function ($q) {
                $q->whereNull('tanggal_nonaktif')
                  ->orWhere('tanggal_nonaktif', '>', now());
            })
            ->where(function ($q) {
                $q->where('status_aktif_karyawan', '1')
                  ->orWhereNull('status_aktif_karyawan');
            });

        $karyawanList = $karyawanQuery->get();

        $setting = \App\Models\PayrollSetting::getActive();

        // Map karyawan ke data tabel — gabungkan dengan slip jika sudah ada
        $data = $karyawanList->map(function ($karyawan) use ($slips, $configs, $bulan, $tahun) {
            $slip = $slips->first(function ($s) use ($karyawan) {
                return trim($s->nik) === trim($karyawan->nik);
            });
            $config = $configs->first(function ($c) use ($karyawan) {
                if ($karyawan->kode_jabatan && $c->kode_jabatan === $karyawan->kode_jabatan) return true;
                if ($karyawan->jabatan && stripos($c->jabatan, $karyawan->jabatan->nama_jabatan) !== false) return true;
                return false;
            }) ?? $configs->first();

            $activeKasbon = \App\Models\PayrollKasbon::where('nik', $karyawan->nik)
                ->where('status', 'aktif')
                ->first();

            // Hitung gaji sementara (monitoring harian dari absensi, RAB, CF s/d hari ini)
            $gajiSementara = $this->service->calculateRunningSalary($karyawan->nik, (int) $bulan, (int) $tahun);

            return [
                'nik' => $karyawan->nik,
                'nama' => $karyawan->nama_karyawan ?? $karyawan->nama_lengkap ?? $karyawan->nik,
                'jabatan' => $karyawan->jabatan->nama_jabatan ?? ($config->jabatan ?? '-'),
                'divisi' => $config->divisi ?? '-',
                'config_id' => $slip->payroll_position_config_id ?? ($config->id ?? null),
                'config' => $config,
                'slip' => $slip,
                'has_slip' => $slip !== null,
                'gaji_sementara' => $gajiSementara,
                'hari_hadir' => $gajiSementara['hari_hadir'] ?? 0,
                'hari_kerja_default' => $gajiSementara['hari_kerja_default'] ?? 26,
                'kasbon_aktif' => $activeKasbon ? [
                    'total_kasbon' => $activeKasbon->total_kasbon,
                    'cicilan_per_bulan' => $activeKasbon->cicilan_per_bulan,
                    'sisa_kasbon' => $activeKasbon->sisa_kasbon,
                ] : null,
            ];
        });

        // Daftar divisi unik
        $divisiList = $configs->pluck('divisi')->unique()->values();

        // Total Deal CF Perusahaan bulan ini
        $totalCompanyCF = $this->service->getCompanyCommitmentFeeCount((int) $bulan, (int) $tahun);

        // Komposisi CF resmi per closing client Rp 5.000.000 (Excel K48:N59)
        $komposisiCfTable = [
            ['jabatan' => 'Designer', 'komposisi' => 1000000, 'keterangan' => 'Komisi Desain per Client CF'],
            ['jabatan' => 'Manager Design', 'komposisi' => 500000, 'keterangan' => 'Supervisi Desain per Client CF'],
            ['jabatan' => 'Marketing', 'komposisi' => 1000000, 'keterangan' => 'Closing Sales per Client CF'],
            ['jabatan' => 'Digital Marketing', 'komposisi' => 500000, 'keterangan' => 'Lead Gen per Client CF'],
            ['jabatan' => 'Estimator', 'komposisi' => 450000, 'keterangan' => 'Estimasi Budget per Client CF'],
            ['jabatan' => 'Surveyor', 'komposisi' => 250000, 'keterangan' => 'Survey Lapangan per Client CF'],
            ['jabatan' => 'Admin (Finance & Legal)', 'komposisi' => 100000, 'keterangan' => 'Administrasi & Legal per Client CF'],
            ['jabatan' => 'Drafter', 'komposisi' => 200000, 'keterangan' => 'Drafting Gambar Kerja per Client CF'],
            ['jabatan' => 'Operasional + Transport', 'komposisi' => 1000000, 'keterangan' => 'Alokasi Operasional Kantor'],
        ];

        return Inertia::render('PayrollKomisi/Index', [
            'data' => $data,
            'configs' => $configs,
            'divisiList' => $divisiList,
            'setting' => $setting,
            'bulan' => (int) $bulan,
            'tahun' => (int) $tahun,
            'total_company_cf' => $totalCompanyCF,
            'komposisi_cf_table' => $komposisiCfTable,
            'filters' => [
                'divisi' => $divisi,
            ],
        ]);
    }

    /**
     * Generate slip gaji untuk semua karyawan
     */
    public function generate(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020|max:2030',
            'omzet_data' => 'nullable|array',
        ]);

        $result = $this->service->generateAll(
            $request->bulan,
            $request->tahun,
            $request->omzet_data ?? []
        );

        $successCount = count($result['slips']);
        $errorCount = count($result['errors']);

        return back()->with('success', "Berhasil generate {$successCount} slip gaji. " .
            ($errorCount > 0 ? "{$errorCount} gagal." : ''));
    }

    /**
     * Generate slip gaji untuk satu karyawan
     */
    public function generateSingle(Request $request)
    {
        $request->validate([
            'nik' => 'required|string',
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020|max:2030',
            'config_id' => 'nullable|integer|exists:payroll_position_configs,id',
            'hari_hadir' => 'nullable|integer|min:0|max:31',
            'hari_kerja' => 'nullable|integer|min:0|max:31',
            'capaian_omzet_internal' => 'nullable|integer|min:0',
            'capaian_omzet_eksternal' => 'nullable|integer|min:0',
            'jumlah_cf' => 'nullable|integer|min:0',
            'timeline_score' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            if ($request->has('kasbon_cicilan')) {
                $kasbonCicilan = (int) $request->kasbon_cicilan;
                $kasbon = \App\Models\PayrollKasbon::where('nik', $request->nik)->where('status', 'aktif')->first();
                if ($kasbon) {
                    $kasbon->cicilan_per_bulan = $kasbonCicilan;
                    $kasbon->save();
                } elseif ($kasbonCicilan > 0) {
                    $total = (int) ($request->kasbon_total ?? ($kasbonCicilan * 3));
                    \App\Models\PayrollKasbon::create([
                        'nik' => $request->nik,
                        'total_kasbon' => $total,
                        'cicilan_per_bulan' => $kasbonCicilan,
                        'sisa_kasbon' => $total,
                        'keterangan' => 'Kasbon diinput manual dari slip gaji',
                        'status' => 'aktif',
                    ]);
                }
            }

            $slip = $this->service->generateSlip(
                $request->nik,
                $request->bulan,
                $request->tahun,
                $request->config_id,
                $request->only([
                    'hari_hadir', 'hari_kerja',
                    'capaian_omzet_internal', 'capaian_omzet_eksternal',
                    'jumlah_cf', 'timeline_score',
                    'komisi_pelunasan', 'komisi_success_project',
                    'achievement_pelaksanaan', 'capaian_project_persen',
                ])
            );

            return back()->with('success', 'Slip gaji berhasil di-generate.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal generate slip: ' . $e->getMessage());
        }
    }

    /**
     * Detail slip gaji per karyawan
     */
    public function show($id)
    {
        $slip = PayrollMonthly::with(['karyawan', 'karyawan.jabatan', 'positionConfig', 'positionConfig.kpiConfigs'])
            ->findOrFail($id);

        return Inertia::render('PayrollKomisi/Detail', [
            'slip' => $slip,
        ]);
    }

    // ==========================================
    // KONFIGURASI JABATAN
    // ==========================================

    /**
     * Halaman konfigurasi per jabatan
     */
    public function configIndex()
    {
        $configs = PayrollPositionConfig::with('kpiConfigs')
            ->orderBy('divisi')
            ->orderBy('jabatan')
            ->get();

        return Inertia::render('PayrollKomisi/Config', [
            'configs' => $configs,
        ]);
    }

    /**
     * Simpan konfigurasi jabatan baru
     */
    public function configStore(Request $request)
    {
        $request->validate([
            'divisi' => 'required|string|max:50',
            'jabatan' => 'required|string|max:100',
            'gaji_pokok' => 'required|integer|min:0',
        ]);

        $config = PayrollPositionConfig::create($request->all());

        // Simpan KPI configs jika ada
        if ($request->has('kpi_configs')) {
            foreach ($request->kpi_configs as $kpi) {
                $config->kpiConfigs()->create($kpi);
            }
        }

        return back()->with('success', 'Konfigurasi jabatan berhasil disimpan.');
    }

    /**
     * Update konfigurasi jabatan
     */
    public function configUpdate(Request $request, $id)
    {
        $config = PayrollPositionConfig::findOrFail($id);
        $config->update($request->all());

        // Update KPI configs jika ada
        if ($request->has('kpi_configs')) {
            $config->kpiConfigs()->delete();
            foreach ($request->kpi_configs as $kpi) {
                $config->kpiConfigs()->create($kpi);
            }
        }

        return back()->with('success', 'Konfigurasi jabatan berhasil diupdate.');
    }

    // ==========================================
    // KASBON
    // ==========================================

    /**
     * List kasbon karyawan
     */
    public function kasbonIndex()
    {
        $kasbons = PayrollKasbon::with('karyawan')
            ->orderBy('status')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($kasbons);
    }

    /**
     * Simpan kasbon baru
     */
    public function kasbonStore(Request $request)
    {
        $request->validate([
            'nik' => 'required|string|exists:karyawan,nik',
            'total_kasbon' => 'required|integer|min:0',
            'cicilan_per_bulan' => 'required|integer|min:0',
        ]);

        PayrollKasbon::create([
            'nik' => $request->nik,
            'total_kasbon' => $request->total_kasbon,
            'cicilan_per_bulan' => $request->cicilan_per_bulan,
            'sisa_kasbon' => $request->total_kasbon,
            'keterangan' => $request->keterangan,
            'status' => 'aktif',
        ]);

        return back()->with('success', 'Kasbon berhasil ditambahkan.');
    }

    /**
     * Ambil omzet internal & eksternal dari RAB Internal untuk karyawan
     */
    public function getRabOmzet($nik, Request $request)
    {
        $bulan = $request->input('bulan');
        $tahun = $request->input('tahun');
        $omzet = $this->service->getOmzetFromRabInternal($nik, $bulan, $tahun);

        return response()->json($omzet);
    }

    /**
     * Ambil seluruh variabel penggajian otomatis dari data sistem (RAB, presensi, CF, invoice, kasbon)
     */
    public function getSystemData($nik, Request $request)
    {
        $bulan = (int) ($request->input('bulan') ?? now()->month);
        $tahun = (int) ($request->input('tahun') ?? now()->year);
        $configId = $request->input('config_id') ? (int) $request->input('config_id') : null;

        $data = $this->service->getAllSystemDataForKaryawan($nik, $bulan, $tahun, $configId);

        return response()->json($data);
    }

    /**
     * Update pengaturan tanggal gajian
     */
    public function updateSetting(Request $request)
    {
        $request->validate([
            'tanggal_gajian' => 'required|integer|min:1|max:31',
            'tipe_hitung' => 'required|string',
            'auto_generate_on_payday' => 'required|boolean',
            'cutoff_tanggal' => 'required|integer|min:1|max:31',
        ]);

        $setting = \App\Models\PayrollSetting::getActive();
        $setting->update([
            'tanggal_gajian' => $request->tanggal_gajian,
            'tipe_hitung' => $request->tipe_hitung,
            'auto_generate_on_payday' => $request->auto_generate_on_payday,
            'cutoff_tanggal' => $request->cutoff_tanggal,
            'catatan' => $request->catatan,
        ]);

        return back()->with('success', 'Pengaturan tanggal gajian berhasil disimpan.');
    }

    /**
     * Release semua slip gaji (Resmi diterbitkan ke karyawan saat tanggal gajian)
     */
    public function releaseAll(Request $request)
    {
        $bulan = (int) $request->input('bulan', now()->month);
        $tahun = (int) $request->input('tahun', now()->year);

        // Pastikan semua slip sudah di-generate terlebih dahulu
        $existingCount = PayrollMonthly::where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->count();

        if ($existingCount === 0) {
            $this->service->generateAll($bulan, $tahun);
        }

        $count = PayrollMonthly::where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->update([
                'status' => 'final',
                'updated_at' => now(),
            ]);

        return back()->with('success', "🎉 Berhasil me-release {$count} slip gaji resmi untuk periode {$bulan}/{$tahun}. Gaji telah resmi diterbitkan.");
    }

    /**
     * Release slip gaji satuan
     */
    public function releaseSingle($id)
    {
        $slip = PayrollMonthly::findOrFail($id);
        $slip->update(['status' => 'final']);

        return back()->with('success', "Slip gaji karyawan {$slip->nik} berhasil di-release resmi.");
    }
}
