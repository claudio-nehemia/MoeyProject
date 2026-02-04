import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';
import KontrakModal from './KontrakModal';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

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
    response_time: string | null;
    response_by: string | null;
    pm_response_time: string | null;
    pm_response_by: string | null;
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
    id: number;
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
        percentage: number;
    }>;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
    termins: Termin[];
}

export default function Index({ itemPekerjaans, termins }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemPekerjaan, setSelectedItemPekerjaan] =
        useState<ItemPekerjaan | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [uploading, setUploading] = useState<number | null>(null);
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>(
        {},
    );
    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: any; marketing?: any }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: any } | null>(null);

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    // Fetch dual task responses (regular & marketing)
    useEffect(() => {
        itemPekerjaans.forEach(item => {
            const orderId = item.order.id;
            if (orderId) {
                // Regular
                axios.get(`/task-response/${orderId}/kontrak`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching regular task response (kontrak):', err);
                        }
                    });
                // Marketing
                axios.get(`/task-response/${orderId}/kontrak?is_marketing=1`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching marketing task response (kontrak):', err);
                        }
                    });
            }
        });
    }, [itemPekerjaans]);

    const handleOpenModal = (itemPekerjaan: ItemPekerjaan) => {
        setSelectedItemPekerjaan(itemPekerjaan);
        setIsModalOpen(true);
    };

    const handleResponse = (itemPekerjaanId: number) => {
        if (confirm('Tandai order ini sebagai sudah di-response?')) {
            router.post(
                `/kontrak/response`,
                { item_pekerjaan_id: itemPekerjaanId },
                {
                    preserveState: false,
                    preserveScroll: true,
                    onSuccess: () => {
                        console.log('Response berhasil dicatat');
                    },
                },
            );
        }
    };

    const handlePmResponse = (kontrakId: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan PM response untuk kontrak ini?')) {
            router.post(`/pm-response/kontrak/${kontrakId}`, {}, {
                preserveScroll: true,
            });
        }
    };

    const handleUploadSignedContract = (kontrakId: number, file: File) => {
        if (!file) return;

        setUploading(kontrakId);
        const formData = new FormData();
        formData.append('signed_contract', file);

        router.post(`/kontrak/${kontrakId}/upload-signed`, formData, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => {
                setUploading(null);
                if (fileInputRefs.current[kontrakId]) {
                    fileInputRefs.current[kontrakId]!.value = '';
                }
            },
        });
    };

    const handleDeleteSignedContract = (kontrakId: number) => {
        if (confirm('Hapus kontrak yang sudah ditandatangani?')) {
            router.delete(`/kontrak/${kontrakId}/delete-signed`, {
                preserveState: false,
                preserveScroll: true,
            });
        }
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <Head title="Kontrak" />
            <Navbar />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="kontrak"
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
            >
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h2 className="mb-6 text-2xl font-semibold text-gray-800">
                                    Kontrak Management
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Project Info
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Grand Total RAB
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Commitment Fee
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Sisa Pembayaran
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Termin & Tahap 1
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Durasi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Response Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {itemPekerjaans.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-6 py-4 text-center text-gray-500"
                                                    >
                                                        Tidak ada item pekerjaan
                                                        dengan RAB Internal yang
                                                        sudah disubmit
                                                    </td>
                                                </tr>
                                            ) : (
                                                itemPekerjaans.map((item) => {
                                                    const orderId = item.order.id;
                                                    const taskResponse = taskResponses[orderId];
                                                    const tahap1 =
                                                        item.kontrak?.termin
                                                            ?.tahapan?.[0];
                                                    const tahap1Persentase =
                                                        tahap1?.persentase || 0;
                                                    const tahap1Nominal =
                                                        item.sisa_pembayaran *
                                                        (tahap1Persentase /
                                                            100);

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900">
                                                                        {
                                                                            item
                                                                                .order
                                                                                .nama_project
                                                                        }
                                                                    </div>
                                                                    <div className="text-gray-500">
                                                                        {
                                                                            item
                                                                                .order
                                                                                .company_name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {
                                                                            item
                                                                                .order
                                                                                .customer_name
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-bold text-indigo-600">
                                                                    {formatRupiah(
                                                                        item
                                                                            .rab_kontrak
                                                                            .grand_total,
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    Nilai
                                                                    Kontrak
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.commitment_fee ? (
                                                                    <div className="text-sm">
                                                                        <div className="font-semibold text-gray-900">
                                                                            {formatRupiah(
                                                                                item
                                                                                    .commitment_fee
                                                                                    .jumlah,
                                                                            )}
                                                                        </div>
                                                                        <span
                                                                            className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                                                                item
                                                                                    .commitment_fee
                                                                                    .status ===
                                                                                'Paid'
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                            }`}
                                                                        >
                                                                            {
                                                                                item
                                                                                    .commitment_fee
                                                                                    .status
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-bold text-blue-600">
                                                                    {formatRupiah(
                                                                        item.sisa_pembayaran,
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    (Grand Total
                                                                    - Commitment
                                                                    Fee)
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.kontrak
                                                                    ?.termin ? (
                                                                    <div className="text-sm">
                                                                        <div className="mb-2 font-medium text-gray-900">
                                                                            {
                                                                                item
                                                                                    .kontrak
                                                                                    .termin
                                                                                    .nama
                                                                            }
                                                                        </div>
                                                                        {tahap1 && (
                                                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                                                                                <div className="flex items-center gap-2 text-xs">
                                                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 font-bold text-white">
                                                                                        1
                                                                                    </span>
                                                                                    <span className="font-medium text-amber-800">
                                                                                        {
                                                                                            tahap1.text
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                {tahap1Persentase >
                                                                                    0 && (
                                                                                    <div className="mt-1 text-xs text-amber-700">
                                                                                        <span className="font-bold">
                                                                                            {
                                                                                                tahap1Persentase
                                                                                            }

                                                                                            %
                                                                                        </span>{' '}
                                                                                        ={' '}
                                                                                        {formatRupiah(
                                                                                            tahap1Nominal,
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">
                                                                        Belum
                                                                        ada
                                                                        kontrak
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.kontrak ? (
                                                                    <div className="text-sm">
                                                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-800">
                                                                            <svg
                                                                                className="mr-1 h-4 w-4"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                />
                                                                            </svg>
                                                                            {
                                                                                item
                                                                                    .kontrak
                                                                                    .durasi_kontrak
                                                                            }{' '}
                                                                            Hari
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.kontrak && item.kontrak.response_time ? (
                                                                    <div className="space-y-1">
                                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                                                            ✓
                                                                            Sudah
                                                                            Response
                                                                        </span>
                                                                        <div className="text-xs text-gray-600">
                                                                            <div>
                                                                                <strong>
                                                                                    Oleh:
                                                                                </strong>{' '}
                                                                                {
                                                                                    item
                                                                                        .kontrak
                                                                                        .response_by
                                                                                }
                                                                            </div>
                                                                            <div>
                                                                                <strong>
                                                                                    Waktu:
                                                                                </strong>{' '}
                                                                                {
                                                                                    item
                                                                                        .kontrak
                                                                                        .response_time
                                                                                }
                                                                            </div>
                                                                        </div>

                                                                        {item.kontrak.pm_response_time && (
                                                                            <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2">
                                                                                <p className="text-xs font-semibold text-purple-900">✓ PM Response</p>
                                                                                <p className="text-xs text-purple-700">By: {item.kontrak.pm_response_by}</p>
                                                                                <p className="text-xs text-purple-700">{item.kontrak.pm_response_time}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                                                                        ⚠️
                                                                        Belum
                                                                        Response
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {!item.kontrak ? (
                                                                    isNotKepalaMarketing ? (
                                                                        <button
                                                                            onClick={() =>
                                                                                handleResponse(
                                                                                    item.id,
                                                                                )
                                                                            }
                                                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-green-700 hover:shadow-lg"
                                                                        >
                                                                            <svg
                                                                                className="h-5 w-5"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                />
                                                                            </svg>
                                                                            Mark as Response
                                                                        </button>
                                                                    ) : null
                                                                ) : !item.kontrak.durasi_kontrak ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleOpenModal(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase transition duration-150 ease-in-out hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                                                                    >
                                                                        Buat
                                                                        Kontrak
                                                                    </button>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {/* Task Response Deadline & Extend Button */}
                                                                        {/* Task Response Deadline - REGULAR */}
                                                                        {taskResponses[orderId]?.regular && taskResponses[orderId]?.regular.status !== 'selesai' && (
                                                                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                                <div className="flex justify-between items-center">
                                                                                    <div>
                                                                                        <p className="text-xs font-medium text-yellow-800">
                                                                                            Deadline Kontrak
                                                                                        </p>
                                                                                        <p className="text-sm font-semibold text-yellow-900">
                                                                                            {formatDeadline(taskResponses[orderId]?.regular.deadline)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => setShowExtendModal({ orderId, tahap: 'kontrak', isMarketing: false, taskResponse: taskResponses[orderId]?.regular })}
                                                                                        className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                                                                                    >
                                                                                        Perpanjang
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* Task Response Deadline - MARKETING (Kepala Marketing only) */}
                                                                        {isKepalaMarketing && taskResponses[orderId]?.marketing && taskResponses[orderId]?.marketing.status !== 'selesai' && (
                                                                            <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                                                <div className="flex justify-between items-center">
                                                                                    <div>
                                                                                        <p className="text-xs font-medium text-purple-800">
                                                                                            Deadline Kontrak (Marketing)
                                                                                        </p>
                                                                                        <p className="text-sm font-semibold text-purple-900">
                                                                                            {formatDeadline(taskResponses[orderId]?.marketing.deadline)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => setShowExtendModal({ orderId, tahap: 'kontrak', isMarketing: true, taskResponse: taskResponses[orderId]?.marketing })}
                                                                                        className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors"
                                                                                    >
                                                                                        Perpanjang (Marketing)
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* PM Response Button */}
                                                                        {isKepalaMarketing && !item.kontrak.pm_response_time && (
                                                                            <button
                                                                                onClick={() => handlePmResponse(item.kontrak!.id)}
                                                                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-purple-700 hover:shadow-lg"
                                                                            >
                                                                                PM Response
                                                                            </button>
                                                                        )}

                                                                        {/* Status Badge */}
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            {item
                                                                                .kontrak
                                                                                .signed_contract_path ? (
                                                                                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
                                                                                    ✓
                                                                                    Kontrak
                                                                                    TTD
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">
                                                                                    ⏳
                                                                                    Belum
                                                                                    TTD
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            {/* Download Draft PDF */}
                                                                            <a
                                                                                href={`/kontrak/${item.kontrak!.id}/print`}
                                                                                target="_blank"
                                                                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                                                                                title="Download Draft Kontrak"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                    />
                                                                                </svg>
                                                                                Draft
                                                                            </a>

                                                                            {/* Upload Signed Contract */}
                                                                            <input
                                                                                type="file"
                                                                                accept=".pdf"
                                                                                className="hidden"
                                                                                ref={(
                                                                                    el,
                                                                                ) => {
                                                                                    fileInputRefs.current[
                                                                                        item.kontrak!.id
                                                                                    ] =
                                                                                        el;
                                                                                }}
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const file =
                                                                                        e
                                                                                            .target
                                                                                            .files?.[0];
                                                                                    if (
                                                                                        file
                                                                                    ) {
                                                                                        handleUploadSignedContract(
                                                                                            item
                                                                                                .kontrak!
                                                                                                .id,
                                                                                            file,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <button
                                                                                onClick={() =>
                                                                                    fileInputRefs.current[
                                                                                        item
                                                                                            .kontrak!
                                                                                            .id
                                                                                    ]?.click()
                                                                                }
                                                                                disabled={
                                                                                    uploading ===
                                                                                    item
                                                                                        .kontrak
                                                                                        .id
                                                                                }
                                                                                className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md disabled:opacity-50"
                                                                                title="Upload Kontrak TTD"
                                                                            >
                                                                                {uploading ===
                                                                                item
                                                                                    .kontrak
                                                                                    .id ? (
                                                                                    <>
                                                                                        <svg
                                                                                            className="h-4 w-4 animate-spin"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                        >
                                                                                            <circle
                                                                                                className="opacity-25"
                                                                                                cx="12"
                                                                                                cy="12"
                                                                                                r="10"
                                                                                                stroke="currentColor"
                                                                                                strokeWidth="4"
                                                                                            ></circle>
                                                                                            <path
                                                                                                className="opacity-75"
                                                                                                fill="currentColor"
                                                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                                                            ></path>
                                                                                        </svg>
                                                                                        <span>
                                                                                            Uploading...
                                                                                        </span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <svg
                                                                                            className="h-4 w-4"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                                                            />
                                                                                        </svg>
                                                                                        <span>
                                                                                            Upload
                                                                                            TTD
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </button>

                                                                            {/* Download Signed Contract (if exists) */}
                                                                            {item
                                                                                .kontrak
                                                                                .signed_contract_path && (
                                                                                <>
                                                                                    <a
                                                                                        href={`/kontrak/${item.kontrak!.id}/download-signed`}
                                                                                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md"
                                                                                        title="Download Kontrak TTD"
                                                                                    >
                                                                                        <svg
                                                                                            className="h-4 w-4"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                            />
                                                                                        </svg>
                                                                                        TTD
                                                                                    </a>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleDeleteSignedContract(
                                                                                                item
                                                                                                    .kontrak!
                                                                                                    .id,
                                                                                            )
                                                                                        }
                                                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-200"
                                                                                        title="Hapus Kontrak TTD"
                                                                                    >
                                                                                        <svg
                                                                                            className="h-4 w-4"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>

                                                                        {/* Signed At Info */}
                                                                        {item.kontrak?.signed_at && (
                                                                            <div className="text-xs text-gray-500">
                                                                                TTD:{' '}
                                                                                {
                                                                                    item
                                                                                        .kontrak
                                                                                        .signed_at
                                                                                }
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

            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    taskResponse={showExtendModal.taskResponse}
                    isMarketing={showExtendModal.isMarketing}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </div>
    );
}