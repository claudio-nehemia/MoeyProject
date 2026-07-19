<form action="{{ route('mesin-fingerprint.store') }}" method="POST">
    @csrf
    <x-input-with-icon icon="ti ti-barcode" label="Serial Number (Dev ID)" name="sn" placeholder="Contoh: C2609075E32F282D" required />
    <div class="form-group mb-3">
        <label for="nama_mesin" class="form-label" style="font-weight: 600;">
            Merek <span class="text-danger">*</span>
        </label>
        <select name="nama_mesin" id="nama_mesin" class="form-select" required>
            <option value="">Pilih Merek</option>
            <option value="Fingerspot">Fingerspot</option>
            <option value="Solution">Solution</option>
        </select>
    </div>
    <x-input-with-icon icon="ti ti-tag" label="Type Mesin" name="merk" placeholder="Contoh: Revo-151" />
    <x-input-with-icon icon="ti ti-map-pin" label="Lokasi Penempatan" name="lokasi" placeholder="Contoh: Lantai 1" />
    <x-input-with-icon icon="ti ti-map-2" label="Titik Koordinat" name="titik_koordinat" placeholder="Contoh: -6.200000, 106.816666" />
    
    <div class="form-group mb-3">
        <label for="status" class="form-label" style="font-weight: 600;">
            Status <span class="text-danger">*</span>
        </label>
        <select name="status" id="status" class="form-select" required>
            <option value="">Pilih Status</option>
            <option value="Aktif" selected>Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
        </select>
    </div>
    
    <div class="row mt-3">
        <div class="col">
            <button type="submit" class="btn btn-primary w-100" id="btnSimpan"><i class="ti ti-send me-1"></i> Simpan Data</button>
        </div>
    </div>
</form>
