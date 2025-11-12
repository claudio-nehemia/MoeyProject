import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import KontrakModal from './KontrakModal';

interface CommitmentFee {
    id: number;
    jumlah: number;
    status: string;
}

interface Kontrak {
    id: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    harga_kontrak: number;
    termin: string | null;
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
    kontrak: Kontrak | null;
}

interface Termin {
    id: number;
    kode_tipe: string;
    nama_tipe: string;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
    termins: Termin[];
}

export default function Index({ itemPekerjaans, termins }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemPekerjaan, setSelectedItemPekerjaan] = useState<ItemPekerjaan | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    const handleOpenModal = (itemPekerjaan: ItemPekerjaan) => {
        setSelectedItemPekerjaan(itemPekerjaan);
        setIsModalOpen(true);
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
                                                Commitment Fee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Harga Kontrak
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sisa Pembayaran
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Termin
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal Kontrak
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
                                                const commitmentFee = item.commitment_fee?.jumlah || 0;
                                                const hargaKontrak = item.kontrak?.harga_kontrak || 0;
                                                const sisaPembayaran = hargaKontrak - commitmentFee;

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
                                                            {item.commitment_fee ? (
                                                                <div className="text-sm">
                                                                    <div className="font-semibold text-gray-900">
                                                                        {formatRupiah(item.commitment_fee.jumlah)}
                                                                    </div>
                                                                    <span
                                                                        className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                                                                            item.commitment_fee.status === 'paid'
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
                                                            {item.kontrak ? (
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {formatRupiah(item.kontrak.harga_kontrak)}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.kontrak ? (
                                                                <div className="text-sm font-bold text-blue-600">
                                                                    {formatRupiah(sisaPembayaran)}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.kontrak?.termin ? (
                                                                <span className="text-sm text-gray-900">
                                                                    {item.kontrak.termin}
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {item.kontrak ? (
                                                                <div className="text-sm text-gray-900">
                                                                    <div>
                                                                        Mulai:{' '}
                                                                        {new Date(item.kontrak.tanggal_mulai).toLocaleDateString('id-ID')}
                                                                    </div>
                                                                    <div>
                                                                        Selesai:{' '}
                                                                        {new Date(item.kontrak.tanggal_selesai).toLocaleDateString('id-ID')}
                                                                    </div>
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
                                                                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                                    ✓ Kontrak Dibuat
                                                                </span>
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
