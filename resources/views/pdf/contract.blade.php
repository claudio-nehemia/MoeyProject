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

    <ol start="6">
      <li>PIHAK PERTAMA tidak diperkenankan meninggalkan barang-barang yang tidak ada kaitannya dengan pelaksanaan pekerjaan interior.</li>
      <li>PIHAK PERTAMA tidak bertanggung jawab atas hilang atau rusaknya barang - barang dilokasi tempat pekerjaan, kecuali ada surat tanda terima yang disepakati PARA PIHAK.</li>
      <li>Apabila dalam pelaksanaan pekerjaan interior melakukan kesalahan untuk area atau barang - barang yang tidak bisa terprediksi atau terlihat, maka biaya itu akan ditanggung oleh PARA PIHAK.</li>
      <li>Pekerjaan diluar kontrak atau jenis penawaran sifatnya adalah bantuan dari PIHAK PERTAMA.</li>
      <li>Batas Toleransi Pembuatan interior adalah 5 cm, untuk mengantisipasi kemiringan dinding dan lantai lokasi project, toleransi tersebut tidak mempengaruhi biaya pembuatan interior.</li>
      <li>Contoh atau katalog material diluar yang kami berikan, akan dikenakan biaya sesuai dengan biaya material yang diminta.</li>
      <li>Perubahan <em>Material Finishing</em> yang sudah kami rekomendasikan di Form Approval, akan dikenakan biaya dan dengan pembayaran secara tunai.</li>
      <li>Segala biaya Fitout atau ijin lokasi proyek yang membutuhkan biaya di bebankan kepada PIHAK KEDUA dan untuk pembuatan ataupun koordinasi dokumen akan dibantu oleh PIHAK PERTAMA.</li>
    </ol>

    <div class="article">Pasal 3<br>HAK DAN KEWAJIBAN</div>

    <b>HAK DAN KEWAJIBAN PIHAK PERTAMA</b>
    <ol>
        <li>Apabila batas waktu penyelesaian pekerjaan (penyerahan pertama) sebagaimana yang telah ditentukan tidak dapat dipenuhi maka, PIHAK PERTAMA harus segera melaporkan pada PIHAK KEDUA sebab-sebab keterlambatan penyelesaian pekerjaan tersebut dan PIHAK PERTAMA akan mengajuan perpanjangan masa kontrak.</li>
        <li>Atas keterlambatan, PIHAK PERTAMA dikenakan denda maksimal 3% dari nilai kontrak setelah mencapai 45 (Empat puluh lima) hari keterlambatan.</li>
        <li>PIHAK PERTAMA berhak mendapat kenyamanan dilokasi kerja yang berkaitan dengan lingkungan atau perizinan dilingkungan.</li>
        <li>PIHAK PERTAMA berhak mengganti material sesuai atau setara dengan material yang sudah disetujui, jika material tersebut sudah discontinue atau sulit ditemukan dipasaran atau berlaku pekerjaan kurang dan wajib diterima PIHAK KEDUA.</li>
    </ol>

    <b>HAK DAN KEWAJIBAN PIHAK KEDUA</b>
    <ol>
        <li>PIHAK KEDUA bertanggung jawab atas lingkungan yang kondusif atau yang berkaitan dengan izin lingkungan.</li>
        <li>Jika PIHAK KEDUA dalam melakukan pembayaran terjadi keterlambatan, akan dikenakan denda sebesar maksimal 3% (tiga persen) dari kontrak yang harus dibayarkan setelah mencapai 45 (Empat puluh lima) hari keterlambatan.</li>
        <li>PIHAK KEDUA berhak mendapatkan garansi aksesoris selama 1 (satu) tahun sejak berita acara serah terima ditanda tangani.</li>
        <li>PIHAK KEDUA berhak mengajukan keluhan apabila pekerjaan yang dilaksanakan PIHAK PERTAMA tidak sesuai design dan gambar kerja.</li>
    </ol>
</div>

<div class="page-break"></div>

<!-- ================= Page 4 ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="article">Pasal 4<br>JANGKA WAKTU PELAKSANAAN</div>
    <ol>
        <li>Pelaksanaan pada Pasal 2 diatas dimulai setelah Surat Perjanjian ini ditandatangani oleh kedua belah pihak, Gambar kerja & Persetujuan Material sudah disetujui oleh PIHAK KEDUA dan area kerja dinyatakan sudah siap oleh PARA PIHAK.</li>
        <li>Terhitung pelaksanaan pekerjaan dimulai H+7, setelah Gambar kerja & tanda tangan approval material oleh PIHAK KEDUA.</li>
        <li>Pelaksanaan pekerjaan, harus sudah selesai 100% paling lambat 90 (Sembilah Puluh Hari Kerja) setelah pekerjaan dimulai ( sesuai poin pertama ).</li>
        <li>Waktu penyelesaian tersebut tidak dapat dirubah oleh PIHAK KEDUA kecuali dalam keadaan memaksa.</li>
        <li>Masa kontrak adalah diluar penyelesaian keluhan/complaint, pekerjaan free dan pekerjaan tambah.</li>
        <li>Masa kontrak berjalan berjalan normal sesuai dengan pasal 4 point 2 apabila :
            <ol type="a">
                <li>Sudah ada pembayaran Down payment (DP).</li>
                <li>Gambar kerja sudah disetujui oleh PARA PIHAK melalui grup WhastApp.</li>
                <li>Pembayaran dilakukan maksimal 3 (hari) hari sejak invoice diterbitkan.</li>
                <li>Tidak ada perubahan design, dimensi, spesifikasi dan lain lain yang tercantum di dalam gambar kerja yang telah disetujui.</li>
                <li>Tidak ada pekerjaan pihak lain yang menghambat proses instalasi dilapangan.</li>
            </ol>
        </li>
    </ol>

    <div class="article">Pasal 5<br>Spesifikasi Material Umum</div>
    <ol>
        <li>Standar Material Finishing :
            <ol type="a">
                <li>Finishing Luar HPL, PVC, Cat Duco dan melamin.</li>
                <li>Finishing dalam untuk kabinet menggunakan melamin putih. Selain melamin putih akan disesuaikan dengan dokumen penawaran.</li>
            </ol>
        </li>
        <li>Dimensi Material Finishing ;
            <ol type="a">
                <li>Ukuran dimensi 240 cm x 120 cm, selain ukuran dimensi 240 cm x 120 cm, menggunakan sambungan material.</li>
                <li>Finishing pinggiran panel, pintu, pintu kabinet menggunakan PVC edging dengan maximal lebar 4 cm, jika melebihi ukuran tersebut, maka menggunakan HPL.</li>
            </ol>
        </li>
        <li>Pembuatan panel dinding menggunakan material multiplek 9 mm dengan rangka 18 mm dengan material Finishing HPL Maksimal ketinggian 2,4 meter. Selain ukuran tersebut menggunakan sambungan Finishing HPL.</li>
        <li>Pembuatan kabinet menggunakan material kombinasi ukuran sesuai dengan fungsi dan kebutuhan, mulai dari 18 mm, 15 mm, 12 mm, 9 mm, 6 mm dan 3 mm.</li>
    </ol>

    <div class="article">Pasal 6<br>NILAI KONTRAK DAN PERUBAHAN NILAI KONTRAK</div>
    <ol>
        <li>Nilai kontrak adalah sebesar Rp. {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }},- (Harga tidak termasuk PPN).</li>
        <li>Apabila ada perubahan nilai kontrak karena ada pengurangan atau penambahan item pekerjaan yang tercantum di penawaran atau berdasarkan negosiasi harga, maka perwakilan dari PIHAK PERTAMA (Direktur atau Marketing) cukup tanda tangan di perubahan yang dimaksud & dinyatakan sah berlaku.</li>
    </ol>
</div>

<div class="page-break"></div>

<!-- ================= Page 5 ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="article">Pasal 7<br>CARA PEMBAYARAN</div>
    <p>Pembayaran dilaksanakan sesuai termin pembayaran dan sesuai dengan prestasi pekerjaan yang telah disepakati dalam proses terhadap kontrak dengan ketentuan sebagai berikut :</p>
    <ol>
        <li>Pembayaran I (Pertama) sebesar 50% dari nilai kontrak yang berlaku sebagai Down Payment.</li>
        <li>Pembayaran II (Kedua) sebesar 40% dari nilai kontrak, dibayarkan paling lambat 3 (tiga) hari setelah pengiriman barang.</li>
        <li>Pembayaran III (Ketiga) sebesar 10% dari nilai kontrak yang akan dibayarkan paling lambat 3 (tiga) hari setelah serah terima.</li>
        <li>Jika ada penambahan pekerjaan/adendum, maka pembayaran nilai pekerjaan tambah dibayarkan lunas (tanpa termin pembayaran), sebelum pekerjaan tambah dimulai.</li>
        <li>Segala bentuk pembayaran yang dilakukan diluar rekening yang tercantum di invoice, PIHAK PERTAMA tidak bertanggung jawab.</li>
    </ol>

    <div class="article">Pasal 8<br>PENYERAHAN PEKERJAAN</div>
    <ol>
        <li>Setelah seluruh pekerjaan diselesaikan, PIHAK PERTAMA dapat meminta secara tertulis untuk melaksanakan Penyerahan Pekerjaan</li>
        <li>PIHAK KEDUA, berdasarkan Berita Acara Pemeriksaan Penyelesaian Pekerjaan wajib menyetujui/tanda tangan Berita Acara penyerahan pekerjaan.</li>
    </ol>

    <div class="article">Pasal 9<br>KEADAAN MEMAKSA</div>
    <ol>
        <li>Bila dalam waktu pelaksanaan pekerjaan terjadi keadaan memaksa maka PIHAK PERTAMA dapat mengajukan permohonan perpanjangan waktu penyelesaian pekerjaan seperti yang telah ditetapkan dan dianggap berlaku.</li>
        <li>Apabila PIHAK KEDUA mengajukan perubahan design, dimensi, spesifikasi dan lain lain atau penambahan pekerjaan di tengah kontrak ini berlangsung, maka jadwal penyelesaian di kontrak ini dianggap batal dan akan disepakati jadwal baru yang ditanda tangani PARA PIHAK.</li>
        <li>Apabali tidak ada kesepakatan dalam masa kontrak, maka masa kontrak dengan tanpa persetujuan, menambah 1x (satu) kali Masa kontrak sesuai dengan masa kontrak yang telah di sepakati.</li>
    </ol>

    <div class="article">Pasal 10<br>PENYELESAIAN SENGKETA</div>
    <ol>
        <li>Bila terjadi sengketa antara kedua belah pihak diutamakan penyelesaiannya secara musyawarah.</li>
        <li>Jika musyawarah tidak ada penyelesaian maka semua sengketa yang timbul dari perjanjian ini, akan diselesaikan oleh kedua belah pihak yang mewakili tempat kedudukan hukum yang sah dan tidak berubah di Kantor Pegadilan Negeri di Kota Tangerang.</li>
    </ol>
</div>

<div class="page-break"></div>

<!-- ================= Page 6 — Penutup & Tanda Tangan ================= -->
<div class="page">
    @if(file_exists($kopPath))
        <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
    @endif
    <hr class="kop-divider">

    <div class="article">Pasal 11<br>PENUTUP</div>
    <p>
        Demikian Surat Perjanjian pelaksanaan pekerjaan ini dibuat dan ditandatangani oleh kedua belah pihak pada hari, tanggal, bulan dan tahun tersebut diatas.
        <br><br>
        Demikian perjanjian ini dibuat dalam rangkap 2 (dua), masing-masing bermeterai cukup dan mempunyai kekuatan hukum yang sama.
    </p>

    <div style="margin-top:36px;">
        <table class="two-col" style="border:0;">
            <tr>
                <td style="width:50%; text-align: center;">
                    <div>PIHAK PERTAMA</div>
                    <div style="height: 100px;"></div>
                    <div class="signature" style="margin-top: 0;">
                        <strong>{{ $direkturName }}</strong>
                    </div>
                </td>
                <td style="width:50%; text-align: center;">
                    <div>PIHAK KEDUA</div>
                    <div style="height: 100px;"></div>
                    <div class="signature" style="margin-top: 0;">
                        <strong>{{ $contractData['customer_name'] }}</strong>
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
