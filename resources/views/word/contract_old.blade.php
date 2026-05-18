<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>Perjanjian Kerjasama</title>
    <!--[if gte mso 9]>
    <xml>
     <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
     </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page Section1 {
            size: 595.3pt 841.9pt;
            margin: 0.8in 0.8in 0.8in 0.8in;
            mso-header: h1;
            mso-header-margin: .2in;
            mso-footer-margin: .2in;
            mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }

        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
            mso-line-height-rule: exactly;
        }

        p { margin: 0 0 8pt 0; }

        .page-break { page-break-before: always; mso-page-break-before: always; }
        .no-break { page-break-inside: avoid; }
        .center { text-align: center; }
        .right { text-align: right; }
        .justify { text-align: justify; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }

        .article-title {
            font-weight: bold;
            text-align: center;
            margin: 15pt 0 8pt 0;
            text-transform: uppercase;
            text-decoration: underline;
        }

        .article-content {
            text-align: justify;
            margin-bottom: 10pt;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            border-spacing: 0;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            page-break-inside: avoid;
        }

        td { vertical-align: top; padding: 2pt 0; border: none; }
    </style>
</head>
<body>
<div style="mso-element:header" id="h1">
    @if(!empty($kopPath))
        <p style="margin:0; text-align:center;">
            <img src="{{ $kopPath }}" alt="Kop" style="width: 450pt; height: auto;">
        </p>
    @endif
</div>

<div class="Section1">
    <!-- HALAMAN 1: SURAT PENAWARAN -->
    <div class="justify">
        <table width="100%">
            <tr>
                <td align="right">Tangerang, {{ $contractData['tanggal'] }}</td>
            </tr>
        </table>

        <div style="margin-top: 10pt;">
            <table width="100%">
                <tr><td width="60">No</td><td width="15">:</td><td>{{ $contractData['nomor'] }}</td></tr>
                <tr><td>Lamp</td><td>:</td><td>1 Berkas Perjanjian Kerjasama Project Interior {{ $contractData['project']['nama'] }}</td></tr>
            </table>
        </div>

        <div style="margin-top: 20pt;">
            <strong>Kepada Yth,</strong><br/>
            <strong>{{ $contractData['customer_name'] }}</strong><br/>
            Di {{ $contractData['alamat'] }}
        </div>

        <p style="margin-top: 20pt;">Dengan Hormat,</p>

        <p>
            Bersama surat ini kami bermaksud memperkenalkan perusahaan kami <strong>{{ $companyName }}</strong> yang beralamat di <strong>Ruko Arcadia Blok B 6, Jl Kelapa Lilin Utara II No 6, Kelapa Dua-Tangerang</strong>.
        </p>

        <p>
            Kami adalah perusahaan yang bergerak di bidang Interior dan telah bekerjasama dengan berbagai perusahaan ternama di Jakarta dan kota-kota besar lainnya di Indonesia.
        </p>

        <p>
            Berdasarkan pertemuan yang sudah kita lakukan sebelumnya, <strong>{{ $contractData['customer_name'] }}</strong> saat ini sedang membutukan jasa pembuatan interior untuk ;
        </p>

        @php
            $jenisInterior = strtolower($kontrak->itemPekerjaan->moodboard->order->jenisInterior->nama_interior ?? '');
            $isRumah = str_contains($jenisInterior, 'rumah');
            $isHotel = str_contains($jenisInterior, 'hotel');
            $isKitchen = str_contains($jenisInterior, 'kitchen');
            $isApartemen = str_contains($jenisInterior, 'apartemen');
            $isResto = str_contains($jenisInterior, 'restauran');
            $isKantor = str_contains($jenisInterior, 'kantor');
            $isBooth = str_contains($jenisInterior, 'booth');
            $isOthers = !$isRumah && !$isApartemen && !$isKantor && !$isHotel && !$isResto && !$isBooth && !$isKitchen;
        @endphp

        <table width="100%" style="margin-top: 10pt;">
            <tr>
                <td width="33%">( {!! $isRumah ? 'V' : '&nbsp;&nbsp;' !!} ) Rumah Tinggal</td>
                <td width="33%">( {!! $isHotel ? 'V' : '&nbsp;&nbsp;' !!} ) Hotel</td>
                <td width="33%">( {!! $isKitchen ? 'V' : '&nbsp;&nbsp;' !!} ) Kitchen Set</td>
            </tr>
            <tr>
                <td>( {!! $isApartemen ? 'V' : '&nbsp;&nbsp;' !!} ) Apartemen</td>
                <td>( {!! $isResto ? 'V' : '&nbsp;&nbsp;' !!} ) Restaurant/Café</td>
                <td>( {!! $isOthers ? 'V' : '&nbsp;&nbsp;' !!} ) Others</td>
            </tr>
            <tr>
                <td>( {!! $isKantor ? 'V' : '&nbsp;&nbsp;' !!} ) Kantor</td>
                <td>( {!! $isBooth ? 'V' : '&nbsp;&nbsp;' !!} ) Booth</td>
                <td></td>
            </tr>
        </table>

        <p style="margin-top: 20pt;">
            Sehubungan dengan hal tersebut kami bermaksud mengajukan penawaran untuk menjadi kotraktor pembuatan interior dengan kualitas bahan terjamin, harga bersaing dan bergaransi.
        </p>

        <p>
            Besar Harapan kami, penawaran ini dapat diwujudkan dalam bentuk kerjasama. Berikut kami lampirkan dokumen Perjanjian kerjasama, invoice dan kwitansi.
        </p>

        <p>
            Demikian surat penawaran ini kami buat, atas perhatian dan kerjasama baiknya kami sampaikan ucapakan terimakasih.
        </p>

        <div style="margin-top: 25pt;">
            Hormat Kami,<br/>
            <strong>{{ $companyName }}</strong>
            <div style="height: 50pt;"></div>
            <strong>{{ $direkturName }}</strong><br/>
            Direktur
        </div>
    </div>

    <!-- HALAMAN 2: PKS -->
    <div class="page-break">
        <div class="center bold">
            <span style="font-size: 13pt;">PERJANJIAN KERJASAMA (PKS)</span><br/>
            <span style="font-size: 13pt;">{{ strtoupper($companyName) }}</span><br/>
            <span>Nomor : {{ $contractData['nomor_kontrak'] }}</span>
        </div>

        <p class="justify" style="margin-top: 20pt;">
            Perjanjian Kerjasama ("selanjutnya disebut Perjanjian") ini dibuat dan ditandatangani pada hari ini <strong>{{ $contractData['hari_ini'] }}</strong>,
            tanggal <strong>({{ $contractData['tgl_angka'] }} (Tanggal {{ $contractData['tgl_terbilang'] }}, Bulan {{ $contractData['bln_terbilang'] }}, Tahun {{ $contractData['thn_terbilang'] }})</strong>, kami yang bertanda tangan dibawah ini :
        </p>

        <table style="margin-top: 15pt;">
            <tr><td width="80">1. Nama</td><td width="15">:</td><td><strong>{{ $direkturName }}</strong></td></tr>
            <tr><td>&nbsp;&nbsp;&nbsp;Jabatan</td><td>:</td><td>Direktur {{ $companyName }}</td></tr>
            <tr><td>&nbsp;&nbsp;&nbsp;Alamat</td><td>:</td><td>Ruko Arcadia Blok B 6, Jl Kelapa Lilin Utara II No 6, Kelapa Dua-Tangerang.</td></tr>
        </table>
        <p class="justify">Dalam hal ini bertindak untuk dan atas nama <strong>{{ $companyName }}</strong>, Perseroan Terbatas yang didirikan menurut Hukum lndonesia, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong> :</p>

        <table style="margin-top: 15pt;">
            <tr><td width="80">2. Nama</td><td width="15">:</td><td><strong>{{ $contractData['customer_name'] }}</strong></td></tr>
            @if(isset($contractData['nik']))
            <tr><td>&nbsp;&nbsp;&nbsp;NIK</td><td>:</td><td>{{ $contractData['nik'] }}</td></tr>
            @endif
            <tr><td>&nbsp;&nbsp;&nbsp;Alamat</td><td>:</td><td>{{ $contractData['alamat'] }}</td></tr>
        </table>
        <p class="justify">Dalam hal ini bertindak untuk dan atas nama sendiri, selanjutnya dalam perjanjian ini disebut sebagai <strong>PIHAK KEDUA</strong>.</p>

        <div class="article-title">Pasal 1<br/>RUANG LINGKUP KERIASAMA</div>
        <div class="article-content">
            1. PIHAK PERTAMA melaksanakan pekerjaan atas dasar dokumen kontrak yang terdiri dari dokumen dokumen sebagai berikut :<br/>
            &nbsp;&nbsp;&nbsp;1.1. Surat Perjanjian Kontrak & Penawaran beserta lampirannya.<br/>
            &nbsp;&nbsp;&nbsp;1.2. Spesifikasi yang dicantumkan di penawaran.<br/>
            &nbsp;&nbsp;&nbsp;1.3. Gambar kerja<br/>
            2. PIHAK KEDUA memberikan pekerjaan Pelaksanaan Jasa Interior.
        </div>

        <div class="article-title">Pasal 2<br/>PELAKSANAAN PEKERJAAN</div>
        <div class="article-content">
            Untuk melaksanakan pekerjaan tersebut dalam Pasal 2 kontrak ini, PIHAK PERTAMA :<br/>
            1. Wajib menyediakan tenaga kerja yang cukup serta mempunyai keahlian sesuai dengan bidangnya.<br/>
            2. Tidak dibenarkan menyimpan material di area di luar lingkup kerja.<br/>
            3. Tidak dibenarkan meninggalkan sampah di area kerja ketika pekerjaan selesai.<br/>
            4. PARA PIHAK melakukan komunikasi ketika project berjalan hanya melalui WhatApp Group Project, komunikasi selain di WhatApp Grup tersebut dianggap tidak berlaku.<br/>
            5. PIHAK KEDUA tidak bisa mengajukan keluhan atas segala bentuk pekerjaan yang sudah sesuai dengan Gambar kerja yang sudah disepakati PARA PIHAK.<br/>
            6. PIHAK PERTAMA tidak diperkenankan meninggalkan barang–barang yang tidak ada kaitannya dengan pelaksanaan pekerjaan interior.<br/>
            7. PIHAK PERTAMA tidak bertanggung jawab atas hilang atau rusaknya barang – barang dilokasi tempat pekerjaan, kecuali ada surat tanda terima yang disepakati PARA PIHAK.<br/>
            8. Apabila dalam pelaksanaan pekerjaan interior melakukan kesalahan untuk area atau barang – barang yang tidak bisa terprediksi atau terlihat, maka biaya itu akan ditanggung oleh PARA PIHAK.<br/>
            9. Pekerjaan diluar kontrak atau jenis penawaran sifatnya adalah bantuan dari PIHAK PERTAMA.<br/>
            10. Batas Toleransi Pembuatan interior adalah 5 cm, untuk mengantisipasi kemiringan dinding dan lantai lokasi project, toleransi tersebut tidak mempengaruhi biaya pembuatan interior.<br/>
            11. Contoh atau katalog material diluar yang kami berikan, akan dikenakan biaya sesuai dengan biaya material yang diminta.<br/>
            12. Perubahan Material Finishing yang sudah kami rekomendasikan di Form Approval, akan dikenakan biaya dan dengan pembayaran secara tunai.<br/>
            13. Segala biaya Fitout atau ijin lokasi proyek yang membutuhkan biaya di bebankan kepada PIHAK KEDUA dan untuk pembuatan ataupun koordinasi dokumen akan dibantu oleh PIHAK PERTAMA.
        </div>

        <div class="article-title">Pasal 3<br/>HAK DAN KEWAJIBAN</div>
        <div class="article-content">
            <strong>HAK DAN KEWAJIBAN PIHAK PERTAMA</strong><br/>
            1. Apabila batas waktu penyelesaian pekerjaan (penyerahan pertama) sebagaimana yang telah ditentukan tidak dapat dipenuhi maka, PIHAK PERTAMA harus segera melaporkan pada PIHAK KEDUA sebab-sebab keterlambatan penyelesaian pekerjaan terebut dan PIHAK PERTAMA akan mengajuan perpanjangan masa kontrak.<br/>
            2. Atas keterlambatan, PIHAK PERTAMA dikenakan denda maksimal 3% dari nilai kontrak setelah mencapai 45 (Empat puluh lima) hari keterlambatan.<br/>
            3. PIHAK PERTAMA berhak mendapat kenyamanan dilokasi kerja yang berkaitan dengan lingkungan atau perizinan dilingkunangan.<br/>
            4. PIHAK PERTAMA berhak mengganti material sesuai atau setara dengan material yang sudah disetujui, jika material tersebut sudah discontinue atau sulit ditemukan dipasaran atau berlaku pekerjaan kurang dan wajib diterima PIHAK KEDUA.<br/><br/>
            <strong>HAK DAN KEWAJIBAN PIHAK KEDUA</strong><br/>
            1. PIHAK KEDUA bertanggung jawab atas lingkungan yang kondusif atau yang berkaitan dengan izin lingkungan.<br/>
            2. Jika PIHAK KEDUA dalam melakukan pembayaran terjadi keterlambatan, akan dikenakan denda sebesar maksimal 3% (tiga persen) dari kontrak yang harus dibayarkan setelah mencapai 45 (Empat puluh lima) hari keterlambatan.<br/>
            3. PIHAK KEDUA berhak mendapatkan garansi aksesoris selama 1 (satu) tahun sejak berita acara serah terima ditanda tangani.<br/>
            4. PIHAK KEDUA berhak mengajukan keluhan apabila pekerjaan yang dilaksanakan PIHAK PERTAMA tidak sesuai design dan gambar kerja.
        </div>

        <div class="article-title">Pasal 4<br/>JANGKA WAKTU PELAKSANAAN</div>
        <div class="article-content">
            1. Pelaksanaan pada Pasal 2 diatas dimulai setelah Surat Perjanjian ini ditandatangani oleh kedua belah pihak, Gambar kerja & Persetujuan Material sudah disetujui oleh PIHAK KEDUA dan area kerja dinyatakan sudah siap oleh PARA PIHAK.<br/>
            2. Terhitung pelaksanaan pekerjaan dimulai H+7, setelah Gambar kerja & tanda tangan approval material oleh PIHAK KEDUA.<br/>
            3. Pelaksanaan pekerjaan, harus sudah selesai 100% paling lambat 90 (Sembilah Puluh Hari Kerja) setelah pekerjaan dimulai ( sesuai poin pertama ).<br/>
            4. Waktu penyelesaian tersebut tidak dapat dirubah oleh PIHAK KEDUA kecuali dalam keadaan memaksa.<br/>
            5. Masa kontrak adalah diluar penyelesaian keluhan/complaint, pekerjaan free dan pekerjaan tambah.<br/>
            6. Masa kontrak berjalan berjalan normal sesuai dengan pasal 4 point 2 apabila :<br/>
            &nbsp;&nbsp;&nbsp;a. Sudah ada pembayaran Down payment (DP).<br/>
            &nbsp;&nbsp;&nbsp;b. Gambar kerja sudah di setujui oleh PARA PIHAK melalui grup WhastApp.<br/>
            &nbsp;&nbsp;&nbsp;c. Pembayaran dilakukan maksimal 3 (hari) hari sejak invoice diterbitkan.<br/>
            &nbsp;&nbsp;&nbsp;d. Tidak ada perubahan design, dimensi, spesifikasi dan lain lain yang tercantum di dalam gambar kerja yang telah disetujui.<br/>
            &nbsp;&nbsp;&nbsp;e. Tidak ada pekerjaan pihak lain yang menghambat proses instalasi dilapangan.
        </div>

        <div class="article-title">Pasal 5<br/>Spesifikasi Material Umum</div>
        <div class="article-content">
            1. Standar Material Finishing ;<br/>
            &nbsp;&nbsp;&nbsp;a. Finishing Luar HPL, PVC, Cat Duco dan melamin.<br/>
            &nbsp;&nbsp;&nbsp;b. Finishing dalam untuk kabinet menggunakan melamin putih. Selain melamin putih akan disesuaikan dengan dokumen penawaran.<br/>
            2. Dimensi Material Finishing ;<br/>
            &nbsp;&nbsp;&nbsp;a. Ukuran dimensi 240 cm x 120 cm, selain ukuran dimensi 240 cm x 120 cm, menggunakan sambungan material.<br/>
            &nbsp;&nbsp;&nbsp;b. Finishing pinggiran panel, pintu, pintu kabinet menggunakan PVC edging dengan maximal lebar 4 cm, jika melebihi ukuran tersebut, maka menggunakan HPL.<br/>
            3. Pembuatan panel dinding menggunakan material multiplek 9 mm dengan rangka 18 mm dengan material Finishing HPL Maksimal ketinggian 2,4 meter. Selain ukuran tersebut menggunakan sambungan Finishing HPL.<br/>
            4. Pembuatan kabinet menggunakan material kombinasi ukuran sesuai dengan fungsi dan kebutuhan, mulai dari 18 mm, 15 mm, 12 mm, 9 mm, 6 mm dan 3 mm.
        </div>

        <div class="no-break">
            <div class="article-title">Pasal 6<br/>NILAI KONTRAK DAN PERUBAHAN NILAI KONTRAK</div>
            <div class="article-content">
                1. Nilai kontrak adalah sebesar <strong>Rp. {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }},- ({{ $contractData['nominal_terbilang'] }})</strong>. Harga tidak termasuk PPN.<br/>
                2. Apabila ada perubahan nilai kontrak karena ada pengurangan atau penambahan item pekerjaan yang tercantum di penawaran atau berdasarkan negosiasi harga, maka perwakilan dari PIHAK PERTAMA (Direktur atau Marketing) cukup tanda tangan di perubahan yang dimaksud & dinyatakan sah berlaku.
            </div>
        </div>

        <div class="no-break">
            <div class="article-title">Pasal 7<br/>CARA PEMBAYARAN</div>
            <div class="article-content">
                Pembayaran dilaksanakan sesuai termin pembayaran dan sesuai dengan prestasi pekerjaan yang telah disepakati dalam proses terhadap kontrak dengan ketentuan sebagai berikut :<br/>
                @if($kontrak->termin && $kontrak->termin->tahapan)
                    @foreach($kontrak->termin->tahapan as $idx => $tahap)
                        {{ $idx + 1 }}. Pembayaran ke-{{ $idx + 1 }} sebesar {{ $tahap['persentase'] }}% dari nilai kontrak ({{ $tahap['text'] }}).<br/>
                    @endforeach
                @else
                    1. Pembayaran I (Pertama) sebesar 50% dari nilai kontrak yang berlaku sebagai Down Payment.<br/>
                    2. Pembayaran II (Kedua) sebesar 40% dari nilai kontrak, dibayarkan paling lambat 3 (tiga) hari setelah pengiriman barang.<br/>
                    3. Pembayaran III (Ketiga) sebesar 10 % dari nilai kontrak yang akan dibayarkan paling lambat 3 (tiga) hari setelah serah terima.<br/>
                @endif
                4. Jika ada penambahan pekerjaan/adendum, maka pembayaran nilai pekerjaan tambah dibayarkan lunas (tanpa termin pembayaran), sebelum pekerjaan tambah dimulai.<br/>
                5. Segala bentuk pembayaran yang dilakukan diluar rekening yang tercantum di invoice, PIHAK PERTAMA tidak bertanggung jawab.
            </div>
        </div>

        <div class="article-title">Pasal 8<br/>PENYERAHAN PEKERJAAN</div>
        <div class="article-content">
            1. Setelah seluruh pekerjaan diselesaikan, PIHAK PERTAMA dapat meminta secara tertulis untuk melaksanakan Penyerahan Pekerjaan<br/>
            2. PIHAK KEDUA, berdasarkan Berita Acara Pemeriksaan Penyelesaian Pekerjaan wajib menyetujui/tanda tangan Berita Acara penyerahan pekerjaan .
        </div>

        <div class="article-title">Pasal 9<br/>KEADAAN MEMAKSA</div>
        <div class="article-content">
            1. Bila dalam waktu pelaksanaan pekerjaan terjadi keadaan memaksa maka PIHAK PERTAMA dapat mengajukan permohonan perpanjangan waktu penyelesaian pekerjaan seperti yang telah ditetapkan dan dianggap berlaku.<br/>
            2. Apabila PIHAK KEDUA mengajukan perubahan design, dimensi, spesifikasi dan lain lain atau penambahan pekerjaan di tengah kontrak ini berlangsung, maka jadwal penyelesaian di kontrak ini dianggap batal dan akan disepakati jadwal baru yang ditanda tangani PARA PIHAK.<br/>
            3. Apabali tidak ada kesepakatan dalam masa kontrak, maka masa kontrak dengan tanpa persetujuan, menambah 1x (satu) kali Masa kontrak sesuai dengan masa kontrak yang telah di sepakati.
        </div>

        <div class="article-title">Pasal 10<br/>PENYELESAIAN SENGKETA</div>
        <div class="article-content">
            1. Bila terjadi sengketa antara kedua belah pihak diutamakan penyelesaiannya secara musyawarah.<br/>
            2. Jika musyawarah tidak ada penyelesaian maka semua sengketa yang timbul dari perjanjian ini, akan diselesaikan oleh kedua belah pihak yang mewakili tempat kedudukan hukum yang sah dan tidak berubah di Kantor Pegadilan Negeri di Kota Tangerang.
        </div>

        <div class="no-break">
            <div class="article-title">Pasal 11<br/>PENUTUP</div>
            <div class="article-content">
                Demikian Surat Perjanjian pelaksanaan pekerjaan ini dibuat dan ditandatangani oleh kedua belah pihak pada hari, tanggal, bulan dan tahun tersebut diatas.<br/>
                Demikian perjanjian ini dibuat dalam rangkap 2 (dua), masing-masing bermeterai cukup dan mempunyai kekuatan hukum yang sama.
            </div>

            <table width="100%" style="margin-top: 50pt;">
                <tr>
                    <td align="center">
                        PIHAK PERTAMA
                        <div style="height: 60pt;"></div>
                        <strong>{{ $direkturName }}</strong><br/>
                        Direktur
                    </td>
                    <td align="center">
                        PIHAK KEDUA
                        <div style="height: 60pt;"></div>
                        <strong>{{ $contractData['customer_name'] }}</strong>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- HALAMAN 3: SURAT PENGAJUAN DP (DINAMIS) -->
    @php
        if (!function_exists('penyebut')) {
            function penyebut($nilai) {
                $nilai = abs($nilai);
                $huruf = array("", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas");
                $temp = "";
                if ($nilai < 12) { $temp = " ". $huruf[$nilai]; }
                else if ($nilai < 20) { $temp = penyebut($nilai - 10). " Belas"; }
                else if ($nilai < 100) { $temp = penyebut($nilai/10)." Puluh". penyebut($nilai % 10); }
                else if ($nilai < 200) { $temp = " Seratus" . penyebut($nilai - 100); }
                else if ($nilai < 1000) { $temp = penyebut($nilai/100) . " Ratus" . penyebut($nilai % 100); }
                else if ($nilai < 2000) { $temp = " Seribu" . penyebut($nilai - 1000); }
                else if ($nilai < 1000000) { $temp = penyebut($nilai/1000) . " Ribu" . penyebut($nilai % 1000); }
                else if ($nilai < 1000000000) { $temp = penyebut($nilai/1000000) . " Juta" . penyebut($nilai % 1000000); }
                else if ($nilai < 1000000000000) { $temp = penyebut($nilai/1000000000) . " Milyar" . penyebut(fmod($nilai,1000000000)); }
                return $temp;
            }
        }

        if (!function_exists('terbilang')) {
            function terbilang($nilai) {
                if($nilai<0) { $hasil = "Minus ". trim(penyebut($nilai)); }
                else { $hasil = trim(penyebut($nilai)); }
                return $hasil . " Rupiah";
            }
        }

        $dpPersentase = 50;
        $dpText = 'DP 50%';
        if($kontrak->termin && $kontrak->termin->tahapan && count($kontrak->termin->tahapan) > 0) {
            $dpPersentase = $kontrak->termin->tahapan[0]['persentase'];
            $dpText = $kontrak->termin->tahapan[0]['text'] ?? ('DP ' . $dpPersentase . '%');
        }
        $dpNominal = ($contractData['nominal_kontrak'] * $dpPersentase) / 100;
        $dpTerbilangValue = terbilang($dpNominal);
        $totalTerbilangValue = terbilang($contractData['nominal_kontrak']);
    @endphp

    <div class="page-break justify">
        <table width="100%">
            <tr><td align="right">Tangerang, {{ $contractData['tanggal'] }}</td></tr>
        </table>

        <div style="margin-top: 10pt;">
            <table width="100%">
                <tr><td width="60">Nomor</td><td width="15">:</td><td>{{ $contractData['nomor_surat_fee'] }}</td></tr>
                <tr><td>Hal</td><td>:</td><td>Pengajuan {{ $dpText }}</td></tr>
            </table>
        </div>

        <div style="margin-top: 20pt;">
            <strong>Kepada Yth,</strong><br/>
            <strong>{{ $contractData['customer_name'] }}</strong><br/>
            Di {{ $contractData['alamat'] }}
        </div>

        <p style="margin-top: 20pt;">Dengan Hormat,</p>

        <p class="justify">
            Sehubungan dengan rencana Kerjasama Pelaksanaan Project Interior <strong>{{ $contractData['project']['nama'] }}</strong>, bersama ini Kami bermaksud mengajukan permohonan pembayaran {{ $dpText }} sebesar <strong>Rp. {{ number_format($dpNominal, 0, ',', '.') }},- ({{ $dpTerbilangValue }})</strong> dari jumlah harga yang disetujui yaitu <strong>Rp. {{ number_format($contractData['nominal_kontrak'], 0, ',', '.') }},- ({{ $totalTerbilangValue }})</strong>.
        </p>

        <p>Berikut ini Kami lampirkan Kwitansi, Quotation, Invoice dan Kelengkapan Administrasi.</p>

        <p>Demikian Kami sampaikan, atas perhatian dan kerjasama {{ $contractData['customer_name'] }}, Kami ucapkan terima kasih.</p>

        <div style="margin-top: 30pt;">
            Hormat Kami,<br/>
            <strong>{{ $companyName }}</strong>
            <div style="height: 50pt;"></div>
            <strong>{{ $direkturName }}</strong><br/>
            Direktur
        </div>
    </div>

    <!-- HALAMAN 4: INVOICE -->
    <div class="page-break justify">
        <h2 class="center underline">INVOICE</h2>
        <p>No. {{ $contractData['nomor_invoice_fee'] }}</p>

        <div style="margin-top: 20pt;">
            <table width="100%">
                <tr><td width="80">Kepada</td><td width="15">:</td><td><strong>{{ $contractData['customer_name'] }}</strong></td></tr>
                <tr><td>Hal</td><td>:</td><td>Pelaksanaan Project Interior {{ $contractData['project']['nama'] }}</td></tr>
            </table>
        </div>

        <p style="margin-top: 40pt;">Pembayaran ditransfer melalui rekening :</p>
        <table>
            <tr><td width="100">Bank</td><td width="15">:</td><td><strong>{{ strtoupper($nameBank) }}</strong></td></tr>
            <tr><td>No Rekening</td><td>:</td><td><strong>{{ $norekBank }}</strong></td></tr>
            <tr><td>Atas Nama</td><td>:</td><td><strong>PT. MOEY LIVING INDONESIA</strong></td></tr>
        </table>

        <div style="margin-top: 60pt;">
            <table width="100%">
                <tr>
                    <td width="60%"></td>
                    <td align="center">
                        Hormat Kami,<br/>
                        <strong>{{ $companyName }}</strong>
                        <div style="height: 50pt;"></div>
                        <strong>{{ $direkturName }}</strong><br/>
                        Direktur
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- HALAMAN 5: KWITANSI (STYLE BARU) -->
    <div class="page-break">
        <h2 class="center underline"><u>KWITANSI</u></h2>
        <p class="center" style="margin-top: -10pt;">No. {{ $contractData['nomor_kwitansi_fee'] }}</p>

        <table width="100%" style="margin-top: 30pt;">
            <tr>
                <td width="140" style="font-style: italic;">Sudah terima dari</td>
                <td width="15">:</td>
                <td style="font-size: 12pt;">{{ $contractData['customer_name'] }}</td>
            </tr>
            <tr>
                <td style="font-style: italic; padding-top: 15pt;">Uang Sebesar</td>
                <td style="padding-top: 15pt;">:</td>
                <td style="padding-top: 15pt;">
                    <div style="background-color: #e8e8e8; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 12pt; text-align: center;">
                        <strong style="font-size: 13pt; letter-spacing: 0.5pt;">
                            " Rp. {{ number_format($dpNominal, 0, ',', '.') }},- ( {{ strtoupper($dpTerbilangValue) }} ) "
                        </strong>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="font-style: italic; padding-top: 15pt;">Untuk Pembayaran</td>
                <td style="padding-top: 15pt;">:</td>
                <td style="padding-top: 15pt;">{{ $dpText }} untuk Pelaksanaan Project Interior {{ $contractData['project']['nama'] }}</td>
            </tr>
        </table>

        <table width="100%" style="margin-top: 50pt;">
            <tr>
                <td width="50%" style="vertical-align: bottom;">
                    <div style="border: 2px solid #000; padding: 10pt; background-color: #f9f9f9; width: 180pt;">
                        <table width="100%">
                            <tr>
                                <td width="30" style="font-size: 16pt;">Rp</td>
                                <td align="center" style="font-size: 16pt; font-weight: bold; border-bottom: 1px solid #000;">
                                    {{ number_format($dpNominal, 0, ',', '.') }},-
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td align="center">
                    Tangerang, {{ $contractData['today'] ?? $contractData['tanggal'] }}<br/><br/>
                    <strong>Hormat Kami,</strong><br/>
                    <strong>{{ $companyName }}</strong>
                    <div style="height: 60pt;"></div>
                    <strong><u>{{ $direkturName }}</u></strong><br/>
                    Direktur
                </td>
            </tr>
        </table>
    </div>
</div>
</body>
</html>
