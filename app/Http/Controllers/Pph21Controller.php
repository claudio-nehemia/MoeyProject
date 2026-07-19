<?php

namespace App\Http\Controllers;

use App\Models\Jenistunjangan;
use App\Models\Pph21FormulaKomponen;
use App\Models\Pph21ProgresifRate;
use App\Models\Pph21Setting;
use App\Models\Pph21TerRate;
use App\Models\Statuskawin;
use App\Services\Pph21Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Pph21Controller extends Controller
{
    protected Pph21Service $pph21Service;

    public function __construct(Pph21Service $pph21Service)
    {
        $this->pph21Service = $pph21Service;
    }

    public function index()
    {
        $setting = Pph21Setting::getSetting();
        $statuskawin = Statuskawin::orderBy('nilai_ptkp')->get();

        return Inertia::render('Pph21/Index', [
            'setting' => $setting,
            'statuskawin' => $statuskawin
        ]);
    }

    public function updateSetting(Request $request)
    {
        $request->validate([
            'metode' => 'required|in:TER,PROGRESIF',
            'metode_tanggungan' => 'required|in:GROSS,GROSS_UP',
            'biaya_jabatan_persen' => 'required|numeric|min:0|max:100',
            'biaya_jabatan_max_bulan' => 'required|integer|min:0',
            'status_aktif' => 'required|boolean'
        ]);

        try {
            $setting = Pph21Setting::getSetting();
            $setting->update([
                'status_aktif' => $request->status_aktif,
                'metode' => $request->metode,
                'metode_tanggungan' => $request->metode_tanggungan,
                'biaya_jabatan_persen' => $request->biaya_jabatan_persen,
                'biaya_jabatan_max_bulan' => $request->biaya_jabatan_max_bulan,
            ]);
            return redirect()->back()->with('success', 'Pengaturan PPh 21 berhasil disimpan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menyimpan pengaturan: ' . $e->getMessage());
        }
    }

    public function formula()
    {
        $komponens = Pph21FormulaKomponen::orderBy('urutan')->get();
        $jenistunjangan = Jenistunjangan::orderBy('kode_jenis_tunjangan')->get();

        return Inertia::render('Pph21/Formula', [
            'komponens' => $komponens,
            'jenistunjangan' => $jenistunjangan
        ]);
    }

    public function storeFormula(Request $request)
    {
        $request->validate([
            'nama_komponen' => 'required|string|max:100',
            'tipe'          => 'required|in:penambah,pengurang',
            'sumber'        => 'required|in:gaji_pokok,tunjangan,bpjs_kesehatan,bpjs_tenagakerja,lembur',
            'kode_sumber'   => 'nullable|string|max:10'
        ]);

        try {
            $maxUrutan = Pph21FormulaKomponen::max('urutan') ?? 0;
            Pph21FormulaKomponen::create([
                'nama_komponen' => $request->nama_komponen,
                'tipe'          => $request->tipe,
                'sumber'        => $request->sumber,
                'kode_sumber'   => $request->kode_sumber ?: null,
                'status_aktif'  => true,
                'urutan'        => $maxUrutan + 1,
            ]);
            return redirect()->back()->with('success', 'Komponen formula berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan komponen formula: ' . $e->getMessage());
        }
    }

    public function toggleFormula($id)
    {
        try {
            $komponen = Pph21FormulaKomponen::findOrFail($id);
            $komponen->update(['status_aktif' => !$komponen->status_aktif]);
            return redirect()->back()->with('success', 'Status komponen formula berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah status komponen: ' . $e->getMessage());
        }
    }

    public function destroyFormula($id)
    {
        try {
            Pph21FormulaKomponen::findOrFail($id)->delete();
            return redirect()->back()->with('success', 'Komponen formula berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus komponen formula: ' . $e->getMessage());
        }
    }

    public function reorderFormula(Request $request)
    {
        $request->validate([
            'urutan' => 'required|array',
            'urutan.*' => 'required|integer'
        ]);

        try {
            foreach ($request->urutan as $id => $urutan) {
                Pph21FormulaKomponen::where('id', $id)->update(['urutan' => $urutan]);
            }
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function terRates()
    {
        $terA = Pph21TerRate::where('kategori', 'A')->orderBy('penghasilan_dari')->get();
        $terB = Pph21TerRate::where('kategori', 'B')->orderBy('penghasilan_dari')->get();
        $terC = Pph21TerRate::where('kategori', 'C')->orderBy('penghasilan_dari')->get();

        return Inertia::render('Pph21/TerRates', [
            'terA' => $terA,
            'terB' => $terB,
            'terC' => $terC
        ]);
    }

    public function updateTerRate(Request $request, $id)
    {
        $request->validate([
            'tarif_persen' => 'required|numeric|min:0|max:100',
            'status_aktif' => 'required|boolean'
        ]);

        try {
            Pph21TerRate::findOrFail($id)->update([
                'tarif_persen' => $request->tarif_persen,
                'status_aktif' => $request->status_aktif,
            ]);
            return redirect()->back()->with('success', 'Tarif TER berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui tarif TER: ' . $e->getMessage());
        }
    }

    public function progresifRates()
    {
        $rates = Pph21ProgresifRate::orderBy('pkp_dari')->get();
        return Inertia::render('Pph21/ProgresifRates', [
            'rates' => $rates
        ]);
    }

    public function updateProgresifRate(Request $request, $id)
    {
        $request->validate([
            'tarif_persen' => 'required|numeric|min:0|max:100',
            'pkp_dari'     => 'required|integer|min:0',
            'pkp_sampai'   => 'nullable|integer|min:0',
            'status_aktif' => 'required|boolean'
        ]);

        try {
            Pph21ProgresifRate::findOrFail($id)->update([
                'pkp_dari'     => $request->pkp_dari,
                'pkp_sampai'   => $request->pkp_sampai ?: null,
                'tarif_persen' => $request->tarif_persen,
                'status_aktif' => $request->status_aktif,
            ]);
            return redirect()->back()->with('success', 'Tarif progresif berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui tarif progresif: ' . $e->getMessage());
        }
    }

    public function simulasi()
    {
        $setting        = Pph21Setting::getSetting();
        $statuskawin    = Statuskawin::orderBy('kode_status_kawin')->get();
        $jenistunjangan = Jenistunjangan::orderBy('kode_jenis_tunjangan')->get();
        $komponens      = Pph21FormulaKomponen::orderBy('urutan')->get();

        return Inertia::render('Pph21/Simulasi', [
            'setting' => $setting,
            'statuskawin' => $statuskawin,
            'jenistunjangan' => $jenistunjangan,
            'komponens' => $komponens
        ]);
    }

    public function hitungSimulasi(Request $request)
    {
        $request->validate([
            'gaji_pokok'       => 'required|numeric|min:0',
            'kode_status_kawin'=> 'required|exists:status_kawin,kode_status_kawin',
            'bulan'            => 'required|integer|min:1|max:12',
            'bpjs_kesehatan'   => 'nullable|numeric|min:0',
            'bpjs_tenagakerja' => 'nullable|numeric|min:0',
            'lembur'           => 'nullable|numeric|min:0',
            'tunjangan'        => 'nullable|array'
        ]);

        $nilaiKomponen = [
            'gaji_pokok'       => (float)$request->gaji_pokok,
            'bpjs_kesehatan'   => (float)($request->bpjs_kesehatan ?? 0),
            'bpjs_tenagakerja' => (float)($request->bpjs_tenagakerja ?? 0),
            'lembur'           => (float)($request->lembur ?? 0),
            'tunjangan'        => $request->tunjangan ?? [],
        ];

        $hasil = $this->pph21Service->hitung(
            $nilaiKomponen,
            $request->kode_status_kawin,
            (int)$request->bulan
        );

        $statusKawin = Statuskawin::where('kode_status_kawin', $request->kode_status_kawin)->first();
        $hasil['nama_status_kawin'] = $statusKawin ? $statusKawin->status_kawin : '-';
        $hasil['kode_status_kawin'] = $request->kode_status_kawin;
        $hasil['nilai_ptkp']        = $this->pph21Service->getNilaiPtkp($request->kode_status_kawin);

        return response()->json([
            'success' => true,
            'data'    => $hasil,
        ]);
    }

    public function generateSlip(Request $request)
    {
        $request->validate([
            'kode_slip_gaji' => 'required|exists:slip_gaji,kode_slip_gaji',
        ]);

        try {
            $this->pph21Service->hapusSnapshot($request->kode_slip_gaji);
            return redirect()->back()->with('success', 'Snapshot PPh 21 berhasil di-generate ulang.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal men-generate ulang: ' . $e->getMessage());
        }
    }
}
