import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import KontrakModal from './KontrakModal';

interface CommitmentFee {
    id: number;
    jumlah: number;
    status: string;
}

interface RabKontrak {
    id: number;
    grand_total: number;
}

interface Kontrak {
    id: number;
    durasi_kontrak: number;
    harga_kontrak: number;
    nilai_project?: number;
    signed_contract_path: string | null;
    signed_at: string | null;
    termin: {
        id: number;
        nama: string;
        tahapan: Array<{
            step: number;
            text: string;
            persentase?: number;
        }>;
    } | null;
}

interface Order {
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface ItemPekerjaan {
    id: number;
    order: Order;
    commitment_fee: CommitmentFee | null;
    rab_kontrak: RabKontrak;
    sisa_pembayaran: number;
    kontrak: Kontrak | null;
}

interface Termin {
    id: number;
    kode_tipe: string;
    nama_tipe: string;
    tahapan: Array<{
        step: number;
        text: string;
//         persentase?: number;
        percentage: number;
    }>;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
    termins: Termin[];
}

export default function Index({ itemPekerjaans, termins }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemPekerjaan, setSelectedItemPekerjaan] = useState<ItemPekerjaan | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [uploading, setUploading] = useState<number | null>(null);
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    const handleOpenModal = (itemPekerjaan: ItemPekerjaan) => {
        setSelectedItemPekerjaan(itemPekerjaan);
        setIsModalOpen(true);
    };

    const handleUploadSignedContract = (kontrakId: number, file: File) => {
        if (!file) return;
        
        setUploading(kontrakId);
        const formData = new FormData();
        formData.append('signed_contract', file);
        
        router.post(`/kontrak/${kontrakId}/upload-signed`, formData, {
            onFinish: () => {
                setUploading(null);
                // Reset file input
                if (fileInputRefs.current[kontrakId]) {
                    fileInputRefs.current[kontrakId]!.value = '';
                }
            },
        });
    };

    const handleDeleteSignedContract = (kontrakId: number) => {
        if (confirm('Hapus kontrak yang sudah ditandatangani?')) {
            router.delete(`/kontrak/${kontrakId}/delete-signed`);
        }
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <Head title="Kontrak" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="kontrak" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                                    Kontrak Management
                                </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Project Info
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Grand Total RAB
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Commitment Fee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sisa Pembayaran
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Termin & Tahap 1
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Durasi
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {itemPekerjaans.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                                    Tidak ada item pekerjaan dengan RAB Internal yang sudah disubmit
                                                </td>
                                            </tr>
                                        ) : (
                                            itemPekerjaans.map((item) => {
                                                // Get tahap 1 info from termin
                                                const tahap1 = item.kontrak?.termin?.tahapan?.[0];
                                                const tahap1Persentase = tahap1?.persentase || 0;
                                                const tahap1Nominal = item.sisa_pembayaran * (tahap1Persentase / 100);

                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm">
                                                                <div className="font-medium text-gray-900">
                                                                    {item.order.nama_project}
                                                                </div>
                                                                <div className="text-gray-500">
                                                                    {item.order.company_name}
                                                                </div>
                                                                <div className="text-gray-500 text-xs">
                                                                    {item.order.customer_name}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-indigo-600">
                                                                {formatRupiah(item.rab_kontrak.grand_total)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Nilai Kontrak
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.commitment_fee ? (
                                                                <div className="text-sm">
                                                                    <div className="font-semibold text-gray-900">
                                                                        {formatRupiah(item.commitment_fee.jumlah)}
                                                                    </div>
                                                                    <span
                                                                        className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                                                                            item.commitment_fee.status === 'Paid'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-yellow-100 text-yellow-800'
                                                                        }`}
                                                                    >
                                                                        {item.commitment_fee.status}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-blue-600">
                                                                {formatRupiah(item.sisa_pembayaran)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                (Grand Total - Commitment Fee)
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.kontrak?.termin ? (
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900 mb-2">
                                                                        {item.kontrak.termin.nama}
                                                                    </div>
                                                                    {tahap1 && (
                                                                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold">
                                                                                    1
                                                                                </span>
                                                                                <span className="text-amber-800 font-medium">{tahap1.text}</span>
                                                                            </div>
                                                                            {tahap1Persentase > 0 && (
                                                                                <div className="mt-1 text-xs text-amber-700">
                                                                                    <span className="font-bold">{tahap1Persentase}%</span> = {formatRupiah(tahap1Nominal)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">Belum ada kontrak</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.kontrak ? (
                                                                <div className="text-sm">
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                        {item.kontrak.durasi_kontrak} Hari
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {!item.kontrak ? (
                                                                <button
                                                                    onClick={() => handleOpenModal(item)}
                                                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                                >
                                                                    Buat Kontrak
                                                                </button>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {/* Status Badge */}
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {item.kontrak.signed_contract_path ? (
                                                                            <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                                                ✓ Kontrak TTD
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                                                                                ⏳ Belum TTD
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Action Buttons */}
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {/* Download Draft PDF */}
                                                                        <a
                                                                            href={`/kontrak/${item.kontrak.id}/print`}
                                                                            target="_blank"
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                            title="Download Draft Kontrak"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            Draft
                                                                        </a>
                                                                        
                                                                        {/* Upload Signed Contract */}
                                                                        <input
                                                                            type="file"
                                                                            accept=".pdf"
                                                                            className="hidden"
                                                                            ref={(el) => { fileInputRefs.current[item.kontrak!.id] = el; }}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    handleUploadSignedContract(item.kontrak!.id, file);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => fileInputRefs.current[item.kontrak!.id]?.click()}
                                                                            disabled={uploading === item.kontrak.id}
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                                                            title="Upload Kontrak TTD"
                                                                        >
                                                                            {uploading === item.kontrak.id ? (
                                                                                <>
                                                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                    </svg>
                                                                                    <span>Uploading...</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                                                    </svg>
                                                                                    <span>Upload KONTRAK DENGAN TTD</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        
                                                                        {/* Download Signed Contract (if exists) */}
                                                                        {item.kontrak.signed_contract_path && (
                                                                            <>
                                                                                <a
                                                                                    href={`/kontrak/${item.kontrak.id}/download-signed`}
                                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                                    title="Download Kontrak TTD"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    TTD
                                                                                </a>
                                                                                <button
                                                                                    onClick={() => handleDeleteSignedContract(item.kontrak!.id)}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all duration-200"
                                                                                    title="Hapus Kontrak TTD"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Signed At Info */}
                                                                    {item.kontrak.signed_at && (
                                                                        <div className="text-xs text-gray-500">
                                                                            TTD: {item.kontrak.signed_at}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedItemPekerjaan && (
                <KontrakModal
                    show={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedItemPekerjaan(null);
                    }}
                    itemPekerjaan={selectedItemPekerjaan}
                    termins={termins}
                />
            )}
        </div>
    );
}