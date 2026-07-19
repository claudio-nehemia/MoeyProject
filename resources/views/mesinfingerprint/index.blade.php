@extends('layouts.app')
@section('titlepage', 'Mesin Fingerprint')

@section('content')
@section('navigasi')
    <div class="d-flex justify-content-between align-items-center w-100">
        <div>
            Mesin Fingerprint
            <div class="text-muted mt-1" style="font-size: 0.75rem; font-weight: normal; text-transform: none; letter-spacing: 0px;">
                Manajemen perangkat sidik jari dan otentikasi ADMS.
            </div>
        </div>
        <nav aria-label="breadcrumb" class="d-none d-md-block" style="font-size: 0.75rem;">
            <ol class="breadcrumb breadcrumb-style1 mb-0">
                <li class="breadcrumb-item">
                    <a href="{{ route('dashboard.index') }}">
                        <i class="ti ti-home-2 ti-xs"></i>
                    </a>
                </li>
                <li class="breadcrumb-item">
                    <a href="javascript:void(0);">
                        <i class="ti ti-settings ti-xs me-1"></i> Konfigurasi
                    </a>
                </li>
                <li class="breadcrumb-item active">
                    <i class="ti ti-device-desktop ti-xs me-1"></i> Mesin Fingerprint
                </li>
            </ol>
        </nav>
    </div>
@endsection

<div class="row">
    <div class="col-lg-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
            @can('mesinfingerprint.create')
                <a href="#" class="btn btn-primary" id="btnCreate">
                    <i class="ti ti-plus me-1"></i> Tambah Mesin
                </a>
            @endcan
        </div>
        <form action="{{ route('mesin-fingerprint.index') }}" method="GET">
            <div class="row g-2 mb-3">
                <div class="col-lg-10 col-md-9 col-sm-12">
                    <x-input-with-icon label="Cari Merek / Type" value="{{ Request('nama_mesin') }}"
                        name="nama_mesin" icon="ti ti-search" hideLabel />
                </div>
                <div class="col-lg-2 col-md-3 col-sm-12">
                    <button class="btn btn-primary w-100"><i class="ti ti-search me-1"></i> Cari</button>
                </div>
            </div>
        </form>
    </div>
</div>

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center py-2" style="background-color: var(--theme-color-1) !important; color: white !important; min-height: 50px;">
                <div class="d-flex align-items-center">
                    <i class="ti ti-device-desktop me-2 fs-5"></i>
                    <h6 class="card-title mb-0 text-white">Data Mesin Fingerprint</h6>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead style="background-color: var(--theme-color-1) !important; color: white !important;">
                            <tr>
                                <th class="text-white py-3" style="width: 60px;">NO.</th>
                                <th class="text-white py-3">SN / DEV-ID</th>
                                <th class="text-white py-3">MEREK</th>
                                <th class="text-white py-3">TYPE</th>
                                <th class="text-white py-3">LOKASI</th>
                                <th class="text-white py-3">KOORDINAT</th>
                                <th class="text-white py-3 text-center">STATUS</th>
                                <th class="text-white py-3 text-center" style="width: 100px;">#</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($mesinfinger as $d)
                                <tr>
                                    <td class="py-2">{{ $loop->iteration + $mesinfinger->firstItem() - 1 }}</td>
                                    <td class="fw-bold py-2 text-primary">{{ $d->sn }}</td>
                                    <td class="py-2">{{ $d->nama_mesin }}</td>
                                    <td class="py-2">{{ $d->merk ?? '-' }}</td>
                                    <td class="py-2">{{ $d->lokasi ?? '-' }}</td>
                                    <td class="py-2 text-muted" style="font-size: 0.8rem;">{{ $d->titik_koordinat ?? '-' }}</td>
                                    <td class="py-2 text-center">
                                        @if ($d->status == 'Aktif')
                                            <span class="badge bg-label-success">Aktif</span>
                                        @else
                                            <span class="badge bg-label-danger">Nonaktif</span>
                                        @endif
                                    </td>
                                    <td class="py-2 text-center">
                                        <div class="d-inline-flex border rounded overflow-hidden shadow-xs">
                                            @can('mesinfingerprint.edit')
                                                <a href="#" class="btn btn-sm btnEdit px-2 py-1 border-0 rounded-0"
                                                    id="{{ \Crypt::encrypt($d->id) }}" title="Edit"
                                                    style="background: #f8f9fa;">
                                                    <i class="ti ti-edit fs-6 text-primary"></i>
                                                </a>
                                            @endcan
                                            @can('mesinfingerprint.delete')
                                                <form method="POST" name="deleteform" class="deleteform m-0"
                                                    action="{{ route('mesin-fingerprint.delete', \Crypt::encrypt($d->id)) }}">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="button" class="btn btn-sm btnDelete px-2 py-1 border-0 rounded-0 border-start"
                                                        title="Hapus" style="background: #f8f9fa;">
                                                        <i class="ti ti-trash fs-6 text-danger"></i>
                                                    </button>
                                                </form>
                                            @endcan
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                            @if($mesinfinger->isEmpty())
                                <tr>
                                    <td colspan="8" class="text-center py-4 text-muted">Data tidak ditemukan.</td>
                                </tr>
                            @endif
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="mt-2">
            {{ $mesinfinger->links('pagination::bootstrap-5') }}
        </div>
    </div>
</div>

<x-modal-form id="modal" show="loadmodal" />
@endsection

@push('myscript')
<script>
    $(function() {
        function loading() {
            $("#loadmodal").html(`<div class="sk-wave sk-primary" style="margin:auto">
                <div class="sk-wave-rect"></div>
                <div class="sk-wave-rect"></div>
                <div class="sk-wave-rect"></div>
                <div class="sk-wave-rect"></div>
                <div class="sk-wave-rect"></div>
                </div>`);
        };

        $("#btnCreate").click(function(e) {
            e.preventDefault();
            loading();
            $('#modal').modal("show");
            $(".modal-title").text("Tambah Data Mesin");
            $("#loadmodal").load("{{ route('mesin-fingerprint.create') }}");
        });

        $(".btnEdit").click(function(e) {
            e.preventDefault();
            loading();
            var id = $(this).attr("id");
            $('#modal').modal("show");
            $(".modal-title").text("Edit Data Mesin");
            $.ajax({
                type: 'POST',
                url: '{{ route('mesin-fingerprint.edit') }}',
                cache: false,
                data: {
                    _token: "{{ csrf_token() }}",
                    id: id
                },
                success: function(respond) {
                    $('#loadmodal').html(respond);
                }
            });
        });

        $(".btnDelete").click(function(e) {
            var form = $(this).closest("form");
            e.preventDefault();
            Swal.fire({
                title: 'Apakah Kamu Yakin?',
                text: "Data ini akan dihapus secara permanen!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Hapus!'
            }).then((result) => {
                if (result.isConfirmed) {
                    form.submit();
                }
            })
        });
    });
</script>
@endpush
