<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Perjanjian Kerjasama</title>
    <style>
        /* Basic reset */
        html,body{margin:0;padding:0;font-family:"Times New Roman", serif;color:#000;}
        body{font-size:14px;line-height:1.6;}

        /* page wrapper */
        .page {
            padding: 30px 45px;
            box-sizing: border-box;
            /* width: 100%; */
        }

        .page-break { page-break-after: always; }

        /* Kop surat (full width) */
        .kop-surat { display:block; width:100%; height:auto; margin-bottom:6px; }

        hr.kop-divider { border:0; border-top:1px solid #d0d0d0; margin:8px 0 12px 0; }

        /* alignment */
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }

        /* simple tables */
        table { width:100%; border-collapse: collapse; margin-bottom:8px; }
        td { vertical-align: top; padding: 3px 6px; }
        th { padding: 6px; border:1px solid #000; background:#f3f3f3; }

        /* small info table */
        .info-table td:first-child { width:120px; font-weight:600; }

        /* invoice style table (with borders) */
        .invoice-table { border-collapse: collapse; width:100%; margin-bottom:16px; }
        .invoice-table th, .invoice-table td { border:1px solid #000; padding:8px; font-size:13px; }
        .invoice-table th { text-align:center; font-weight:700; }

        /* article/section headings */
        .article { font-weight:bold; margin:18px 0 8px 0; text-align: center;}

        /* signature */
        .signature { margin-top:28px; }
        .signature .sign-block { width:220px; text-align:left; }
        .signature img { width:140px; height:auto; display:block; margin-top:12px; }

        /* nominal box for kwitansi */
        .nominal-box { border:1px solid #000; width:180px; height:36px; line-height:36px; text-align:center; display:inline-block; }

        /* lists */
        ol { margin:6px 0 6px 18px; }
        ul { margin:6px 0 6px 18px; }

        /* small helper to not use float/flex */
        .two-col { width:100%; }
        .two-col td { vertical-align: top; }

        /* avoid absolute positioning for DOMPDF stability */

        /* css comitmennt fee */
        body.commitmentfee {
        font-family: "Times New Roman", serif;
        font-size: 14px;
        margin: 0;
    }

    .page-commitmentfee {
        padding: 35px 45px;
        box-sizing: border-box;
    }

    .page-break-commitmentfee {
        page-break-after: always;
    }

    .center-commitmentfee { text-align: center; }
    .right-commitmentfee  { text-align: right; }

    .header-table-commitmentfee {
        width: 100%;
        border-bottom: 1.5px solid #cfcfcf;
        margin-bottom: 20px;
    }

    .header-table-commitmentfee td {
        vertical-align: middle;
        padding-bottom: 5px;
    }

    .header-logo-commitmentfee {
        width: 180px;
    }

    .header-title-commitmentfee {
        text-align: right;
        font-size: 14px;
    }

    table.commitmentfee {
        width: 100%;
        border-collapse: collapse;
    }

    table.commitmentfee td {
        padding: 4px 2px;
        vertical-align: top;
    }

    table.commitmentfee th {
        padding: 6px;
        border: 1px solid #000;
    }

    .red-bar-commitmentfee {
        width: 100%;
        height: 20px;
        background: #be1e2d;
        margin: 20px 0;
    }

    .invoice-table-commitmentfee {
        width: 100%;
        border-collapse: collapse;
    }

    .invoice-table-commitmentfee th,
    .invoice-table-commitmentfee td {
        border: 1px solid #000 !important;
        padding: 6px;
        font-size: 14px;
    }

    .signature-commitmentfee img {
        width: 120px;
        margin: 5px 0;
    }

    .kwitansi-footer-commitmentfee {
        margin-top: 20px;
    }

    .nominal-box-commitmentfee {
        border: 1px solid #000;
        width: 180px;
        height: 35px;
        text-align: center;
        line-height: 35px;
        display: inline-block;
    }

    .signature-box-commitmentfee {
        width: 200px;
        text-align: center;
        float: right;
        margin-bottom: 15px;
    }

    .kop-surat-commitmentfee {
        width: 100%;
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0;
    }
    </style>
</head>
<body>

<!-- ================= Page 1 — Surat Penawaran ================= -->
<div class="page">
    {{-- Kop --}}
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="right">{{ $contractData['tanggal'] }}</div>

    <div style="margin-top:10px;">
        <div>No : {{ $contractData['nomor'] }}</div>
        <div>Hal : Penawaran Kerjasama Project Interior</div>
        <div>Lamp : 1 Berkas Perjanjian Kerjasama</div>
    </div>

    <div style="margin-top:18px;">
        Kepada Yth,<br/>
        <strong>{{ $contractData['customer_name'] }}</strong><br/>
        Di {{ $contractData['alamat'] }}
    </div>

    <div style="margin-top:16px;">
        Dengan hormat,
    </div>

    <div style="margin-top:8px; text-align:justify; text-indent:36px;">
        Bersama surat ini kami bermaksud memperkenalkan perusahaan kami <strong>{{ $companyName }}</strong> yang beralamat di {{ $companyAddress }}.
    </div>

    <div style="margin-top:8px; text-align:justify; text-indent:36px;">
        Kami adalah perusahaan yang bergerak di bidang interior dan telah bekerjasama dengan berbagai perusahaan. Berdasarkan pertemuan sebelumnya, <strong>{{ $contractData['customer_name'] }}</strong> saat ini membutuhkan jasa pembuatan interior untuk project <strong>{{ $contractData['project']['nama'] }}</strong>.
    </div>

    <div style="margin-top:8px; text-align:justify; text-indent:36px;">
        Sehubungan dengan hal tersebut kami bermaksud mengajukan penawaran untuk menjadi kontraktor pembuatan interior dengan kualitas bahan terjamin, harga bersaing dan bergaransi.
    </div>

    <div style="margin-top:12px;">
        Demikian surat penawaran ini kami buat. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
    </div>

    <div class="signature">
        <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
        <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
    </div>
</div>

<div class="page-break"></div>

<!-- ================= Page 2 — Perjanjian (awal) ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="center" style="margin-top:8px; margin-bottom:8px;">
        <span style="font-size:16px; font-weight:bold;">PERJANJIAN KERJASAMA</span><br/>
        <span style="font-size:13px;">{{$companyName}}</span><br/>
        <span style="font-size:12px;">Nomor : {{ $contractData['nomor_kontrak'] }}</span>
    </div>

    <div style="margin-top:12px; text-align:justify;">
        Perjanjian ini dibuat dan ditandatangani pada hari ini, antara pihak-pihak berikut:
    </div>

    {{-- Pihak --}}
    <table class="info-table" style="margin-top:8px;">
        <tr><td><b>1. Nama</b></td><td>: {{ $direkturName }}</td></tr>
        <tr><td>Jabatan</td><td>: {{$jabatanDirektur}}</td></tr>
        <tr><td>Alamat</td><td>: {{ $companyAddress }}</td></tr>
    </table>

    <p style="margin-top:8px; text-align:justify;">
        Dalam hal ini bertindak untuk dan atas nama PT. Moey Jaya Abadi (selanjutnya disebut <strong>PIHAK PERTAMA</strong>).
    </p>

    <table class="info-table" style="margin-top:8px;">
        <tr><td><b>2. Nama</b></td><td>: {{ $contractData['customer_name'] }}</td></tr>
        <tr><td>Alamat</td><td>: {{ $contractData['alamat'] }}</td></tr>
    </table>

    <p style="margin-top:8px; text-align:justify;">
        Dalam hal ini bertindak untuk dan atas nama sendiri (selanjutnya disebut <strong>PIHAK KEDUA</strong>).
    </p>

    <div class="article">Pasal 1<br>RUANG LINGKUP KERJASAMA</div>
        <ol>
            <li>PIHAK PERTAMA melaksanakan pekerjaan atas dasar dokumen kontrak yang terdiri dari:
                <ol type="a">
                    <li>Surat Penawaran beserta lampirannya.</li>
                    <li>Surat Kontrak.</li>
                    <li>Spesifikasi yang dicantumkan di penawaran.</li>
                    <li>Gambar kerja.</li>
                </ol>
            </li>
            <li>PIHAK KEDUA memberikan pekerjaan Pelaksanaan Jasa Interior.</li>
        </ol>

        <div class="article">Pasal 2<br>PELAKSANAAN PEKERJAAN</div>
        <ol>
            <li>Wajib menyediakan tenaga kerja yang cukup serta mempunyai keahlian sesuai dengan bidangnya.</li>
            <li>Tidak dibenarkan menyimpan material di area di luar lingkup kerja.</li>
            <li>Tidak dibenarkan meninggalkan sampah di area kerja ketika pekerjaan selesai.</li>
        </ol>
</div>

<div class="page-break"></div>

<!-- ================= Page 3 ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat"
    @endif
    <hr class="kop-divider">

    <ol start="4">
      <li>PARA PIHAK melakukan komunikasi ketika project berjalan hanya melalui WhatsApp Grup project, komunikasi selain di WhatsApp Grup tersebut dianggap tidak berlaku.</li>
      <li>PIHAK KEDUA tidak bisa mengajukan keluhan atas segala bentuk pekerjaan yang sudah sesuai dengan gambar kerja yang sudah disepakati PARA PIHAK.</li>
      <li>PIHAK PERTAMA tidak diperkenankan meninggalkan barang–barang yang tidak ada kaitannya dengan pelaksanaan pekerjaan interior.</li>
      <li>PIHAK PERTAMA tidak bertanggung jawab atas hilang atau rusaknya barang–barang pada Pasal 3 Point 6, kecuali ada surat tanda terima yang disepakati PARA PIHAK.</li>
      <li>Apabila dalam pelaksanaan pekerjaan interior melakukan kesalahan untuk area atau barang–barang yang tidak bisa terprediksi atau terlihat, maka biaya itu akan ditanggung oleh PARA PIHAK.</li>
      <li>Pekerjaan diluar kontrak atau jenis penawaran sifatnya adalah bantuan dari PIHAK PERTAMA.</li>
      <li>Batas toleransi pembuatan interior adalah ±5 cm, untuk mengantisipasi kemiringan dinding dan lantai lokasi project, toleransi tersebut tidak mempengaruhi biaya pembuatan interior.</li>
      <li>Contoh atau katalog material diluar yang kami berikan, akan dikenakan biaya sesuai dengan biaya material yang diminta.</li>
      <li>Perubahan <em>Material Finishing</em> yang sudah kami rekomendasikan di Form Approval, akan dikenakan biaya dan dengan pembayaran secara tunai.</li>
      <li>Segala biaya Fitout atau ijin lokasi project yang membutuhkan biaya dibebankan kepada PIHAK KEDUA dan untuk pembuatan ataupun koordinasi dokumen akan dibantu oleh PIHAK PERTAMA.</li>
    </ol>

    <div class="article">Pasal 3<br>JANGKA WAKTU PELAKSANAAN</div>
        <ol>
            <li>Pelaksanaan dimulai setelah perjanjian ditandatangani, gambar kerja disetujui dan area siap digunakan.</li>
            <li>Pekerjaan harus selesai 100% paling lambat 65 hari kerja setelah dimulai.</li>
            <li>Waktu penyelesaian tidak dapat dirubah kecuali keadaan memaksa.</li>
            <li>Masa kontrak tidak termasuk komplain, pekerjaan free, dan pekerjaan tambah.</li>
            <li>Masa kontrak berjalan normal jika:
                <ol type="a">
                    <li>Down Payment telah dibayar.</li>
                    <li>Gambar kerja disetujui melalui grup WhatsApp.</li>
                    <li>Pembayaran progress maksimal 7 hari setelah invoice.</li>
                    <li>Tidak ada perubahan design/dimensi/spesifikasi.</li>
                    <li>Tidak ada pihak lain yang menghambat instalasi.</li>
                </ol>
            </li>
            <li>Jika poin 5 tidak terpenuhi, masa kontrak dihitung ulang kecuali PIHAK KEDUA mengajukan banding tertulis.</li>
        </ol>
</div>

<div class="page-break"></div>

<!-- ================= Page 4 ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="article">Pasal 4<br>PENYERAHAN PEKERJAAN</div>
        <ol>
            <li>Setelah pekerjaan selesai, PIHAK PERTAMA dapat meminta penyerahan pekerjaan secara tertulis.</li>
            <li>PIHAK KEDUA wajib mengeluarkan Berita Acara Penyerahan berdasarkan pemeriksaan penyelesaian pekerjaan.</li>
        </ol>

        <div class="article">Pasal 5<br>NILAI KONTRAK DAN PERUBAHAN NILAI</div>
        <ol>
            <li>Nilai kontrak adalah sebesar Rp. {{ number_format($contractData['nominal'] ?? 0, 0, ',', '.') }} (Harga belum termasuk PPN).</li>
            <li>Jika ada pengurangan/penambahan item pekerjaan, cukup tanda tangan perwakilan PIHAK PERTAMA pada bagian yang dirubah.</li>
        </ol>

        <div class="article">Pasal 6<br>CARA PEMBAYARAN</div>
        <ol>
            <li>Pembayaran I: 50% sebagai Down Payment.</li>
            <li>Pembayaran II: 40%, dibayar maksimal 3 hari setelah pengiriman barang.</li>
            <li>Pembayaran III: 10%, dibayar maksimal 3 hari setelah serah terima.</li>
            <li>Pembayaran di luar rekening resmi pada invoice tidak menjadi tanggung jawab PIHAK PERTAMA.</li>
        </ol>

        <div class="article">Pasal 7<br>KEADAAN MEMAKSA</div>
        <ol>
            <li>Jika terjadi keadaan memaksa, PIHAK PERTAMA dapat mengajukan perpanjangan waktu.</li>
            <li>Jika PIHAK KEDUA mengubah desain/spesifikasi/menambah pekerjaan, jadwal lama gugur dan dibuat jadwal baru.</li>
            <li>Jika tidak ada kesepakatan, masa kontrak otomatis ditambah 1x masa kontrak sebelumnya.</li>
        </ol>

        <div class="article">Pasal 8<br>HAK DAN KEWAJIBAN</div>

        <b>Hak & Kewajiban PIHAK PERTAMA</b>
        <ol>
            <li>Jika penyelesaian terlambat, PIHAK PERTAMA wajib memberi laporan alasan keterlambatan.</li>
            <li>Jika terlambat > 45 hari, dikenakan denda max 3% dari nilai kontrak.</li>
            <li>Berhak mendapat kenyamanan lokasi kerja terkait lingkungan/perizinan.</li>
            <li>Berhak mengganti material setara jika material discontinue/sulit ditemukan.</li>
        </ol>

        <b>Hak & Kewajiban PIHAK KEDUA</b>
        <ol>
            <li>Bertanggung jawab atas izin lingkungan dan kondusivitas lokasi.</li>
            <li>Jika pembayaran terlambat >45 hari, denda max 3% dari nilai kontrak.</li>
            <li>Berhak garansi aksesoris 1 tahun sejak serah terima.</li>
            <li>Berhak mengajukan keluhan jika pekerjaan tidak sesuai gambar kerja.</li>
        </ol>

</div>

{{-- <div class="page-break"></div> --}}

<!-- ================= Page 5 ================= -->
{{-- <div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="article">Pasal 7<br>KEADAAN MEMAKSA</div>
        <ol>
            <li>Jika terjadi keadaan memaksa, PIHAK PERTAMA dapat mengajukan perpanjangan waktu.</li>
            <li>Jika PIHAK KEDUA mengubah desain/spesifikasi/menambah pekerjaan, jadwal lama gugur dan dibuat jadwal baru.</li>
            <li>Jika tidak ada kesepakatan, masa kontrak otomatis ditambah 1x masa kontrak sebelumnya.</li>
        </ol>

        <div class="article">Pasal 8<br>HAK DAN KEWAJIBAN</div>

        <b>Hak & Kewajiban PIHAK PERTAMA</b>
        <ol>
            <li>Jika penyelesaian terlambat, PIHAK PERTAMA wajib memberi laporan alasan keterlambatan.</li>
            <li>Jika terlambat > 45 hari, dikenakan denda max 3% dari nilai kontrak.</li>
            <li>Berhak mendapat kenyamanan lokasi kerja terkait lingkungan/perizinan.</li>
            <li>Berhak mengganti material setara jika material discontinue/sulit ditemukan.</li>
        </ol>

        <b>Hak & Kewajiban PIHAK KEDUA</b>
        <ol>
            <li>Bertanggung jawab atas izin lingkungan dan kondusivitas lokasi.</li>
            <li>Jika pembayaran terlambat >45 hari, denda max 3% dari nilai kontrak.</li>
            <li>Berhak garansi aksesoris 1 tahun sejak serah terima.</li>
            <li>Berhak mengajukan keluhan jika pekerjaan tidak sesuai gambar kerja.</li>
        </ol>
</div> --}}

<div class="page-break"></div>

<!-- ================= Page 6 — Penutup & Tanda Tangan ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="article">Pasal 9<br>SENGKETA ARBITRASI</div>
        <ol>
            <li>Penyelesaian sengketa diutamakan dengan musyawarah.</li>
            <li>Jika tidak tercapai, sengketa diselesaikan di Pengadilan Negeri Kota Tangerang.</li>
        </ol>

        <div class="article">Pasal 10<br>PENUTUP</div>
        <p>
            Perjanjian ini dibuat dan ditandatangani oleh kedua belah pihak pada hari, tanggal, bulan dan tahun tersebut di atas.
            Perjanjian dibuat dalam 2 rangkap bermeterai cukup dan memiliki kekuatan hukum yang sama.
        </p>

    <div style="margin-top:36px;">
        <table class="two-col" style="border:0;">
            <tr>
                {{-- <td style="width:60%;">
                    <div>PIHAK PERTAMA,<br/><br/><br/>
                        <div class="signature">
                            <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
                            <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
                        </div>
                    </div> --}}
                    <div>PIHAK PERTAMA,<p>Hormat Kami,<br><strong>{{$companyName}}</strong></p><br/><br/></br>
                        <div class="signature">
                            <strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}
                        </div>
                    </div>
                </td>
                <td style="width:40%;">
                    <div>PIHAK KEDUA,<br/></br></br><p><br><strong></strong></p><br/><br/>
                        <div class="signature">
                            <strong>{{ $contractData['customer_name'] }}</strong><br/>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>

<div class="page-break"></div>
<!-- ================= Page Comitment Fee ================= -->

<!-- =======================
     HALAMAN 1 — SURAT COMMITMENT FEE
======================= -->
<div class="page-commitmentfee page-break-commitmentfee">

    <!-- Header -->
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat-commitmentfee" alt="kop surat">
    @endif

    <p class="right-commitmentfee">{{$companyAddress}}, {{ $contractData['today'] }}</p>

    <p>No: {{ $contractData['nomor_surat_fee'] }}<br>
       Hal: Pengajuan Harga Kontrak Project Interior</p>

    <p>Kepada Yth,<br>
       <strong>{{ $contractData['customer_name'] }}</strong><br>
       Di {{ $contractData['alamat'] }}</p>

    <p>Dengan hormat,</p>

    <p>
        Sehubungan dengan rencana pelaksanaan project interior
        <strong>{{ $contractData['project']['nama'] }}</strong>, kami mengajukan
        <strong>Harga Kontrak sebesar Rp {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }},-</strong>.
    </p>

    <p>
        Harga Kontrak ini merupakan nilai total keseluruhan RAB kontrak untuk pelaksanaan project interior sesuai dengan spesifikasi yang telah disepakati.
    </p>

    <p>Pembayaran dapat dilakukan melalui rekening berikut:</p>

    <table class="commitmentfee">
        <tr><td width="120">Bank</td><td>: {{$nameBank}}</td></tr>
        <tr><td>No. Rekening</td><td>: {{$norekBank}}</td></tr>
        <tr><td>Atas Nama</td><td>: {{$atasNamaBank}}</td></tr>
    </table>

    <p>
        Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
    </p>

    <div class="signature">
        <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
        <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
    </div>

</div>


<!-- =======================
     HALAMAN 2 — INVOICE COMMITMENT FEE
======================= -->
<div class="page-commitmentfee page-break-commitmentfee">

    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat-commitmentfee" alt="kop surat">
    @endif

    <h2 class="center-commitmentfee">INVOICE</h2>

    <p>No: {{ $contractData['nomor_invoice_fee'] }}</p>
    <p class="right-commitmentfee">{{$companyAddress}}, {{ $contractData['today'] }}</p>

    <p>
        Kepada : <strong>{{ $contractData['customer_name'] }}</strong><br>
        Hal : Pembayaran Harga Kontrak Interior
    </p>

    <table class="invoice-table-commitmentfee">
        <thead>
            <tr>
                <th>URAIAN</th>
                <th>JUMLAH</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Total Pembayaran Harga Kontrak</td>
                <td>Rp {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <p><strong>Pembayaran melalui:</strong></p>

    <table class="commitmentfee">
        <tr><td width="120">Bank</td><td>: {{$nameBank}}</td></tr>
        <tr><td>No. Rekening</td><td>: {{$norekBank}}</td></tr>
        <tr><td>Atas Nama</td><td>: {{$atasNamaBank}}</td></tr>
    </table>

    <div class="signature">
        <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
        <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
    </div>

</div>

{{-- <div class="page-break-commitmentfee"></div> --}}

<!-- =======================
     HALAMAN 3 — KWITANSI COMMITMENT FEE
======================= -->
<div class="page-commitmentfee">

    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat-commitmentfee" alt="kop surat">
    @endif

    <h3 class="center-commitmentfee">KWITANSI</h3>
    <p class="center-commitmentfee">No: {{ $contractData['nomor_kwitansi_fee'] }}</p>

    <table class="commitmentfee">
        <tr>
            <td width="150">Sudah terima dari</td>
            <td>: <strong>{{ $contractData['customer_name'] }}</strong></td>
        </tr>
        <tr>
            <td>Uang Sebesar</td>
            <td>: <strong>Rp {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }},-</strong></td>
        </tr>
        <tr>
            <td>Untuk Pembayaran</td>
            <td>: Harga Kontrak Desain Interior</td>
        </tr>
    </table>

    <div class="kwitansi-footer-commitmentfee">
        <div class="nominal-box-commitmentfee">Rp {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }},-</div>

        <div class="signature">
            <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
            <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
        </div>

        <div style="clear: both;"></div>
    </div>

</div>

</body>
</html>
