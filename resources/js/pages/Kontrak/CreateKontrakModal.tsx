import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

interface CommitmentFee {
    id: number;
    jumlah: number;
    status: string;
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
}

interface Termin {
    id: number;
    kode_tipe: string;
    nama_tipe: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    itemPekerjaan: ItemPekerjaan;
    termins: Termin[];
}

export default function CreateKontrakModal({ isOpen, onClose, itemPekerjaan, termins }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        item_pekerjaan_id: itemPekerjaan.id,
        tanggal_mulai: '',
        tanggal_selesai: '',
        termin_id: '',
        harga_kontrak: '',
    });

    const [sisaPembayaran, setSisaPembayaran] = useState(0);
    const commitmentFee = itemPekerjaan.commitment_fee?.jumlah || 0;

    useEffect(() => {
        const hargaKontrak = parseFloat(data.harga_kontrak) || 0;
        setSisaPembayaran(hargaKontrak - commitmentFee);
    }, [data.harga_kontrak, commitmentFee]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('kontrak.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                {/* Modal panel */}
                <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={submit}>
                        <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                        Buat Kontrak
                                    </h3>

                                    {/* Project Info */}
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-sm">
                                            <div className="font-semibold text-gray-900">
                                                {itemPekerjaan.order.nama_project}
                                            </div>
                                            <div className="text-gray-600">
                                                {itemPekerjaan.order.company_name} - {itemPekerjaan.order.customer_name}
                                            </div>
                                            <div className="mt-2 font-medium text-blue-600">
                                                Commitment Fee: {formatRupiah(commitmentFee)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Tanggal Mulai */}
                                        <div>
                                            <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700">
                                                Tanggal Mulai
                                            </label>
                                            <input
                                                type="date"
                                                id="tanggal_mulai"
                                                value={data.tanggal_mulai}
                                                onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            />
                                            {errors.tanggal_mulai && (
                                                <p className="mt-1 text-sm text-red-600">{errors.tanggal_mulai}</p>
                                            )}
                                        </div>

                                        {/* Tanggal Selesai */}
                                        <div>
                                            <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700">
                                                Tanggal Selesai
                                            </label>
                                            <input
                                                type="date"
                                                id="tanggal_selesai"
                                                value={data.tanggal_selesai}
                                                onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            />
                                            {errors.tanggal_selesai && (
                                                <p className="mt-1 text-sm text-red-600">{errors.tanggal_selesai}</p>
                                            )}
                                        </div>

                                        {/* Termin */}
                                        <div>
                                            <label htmlFor="termin_id" className="block text-sm font-medium text-gray-700">
                                                Termin Pembayaran
                                            </label>
                                            <select
                                                id="termin_id"
                                                value={data.termin_id}
                                                onChange={(e) => setData('termin_id', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            >
                                                <option value="">Pilih Termin</option>
                                                {termins.map((termin) => (
                                                    <option key={termin.id} value={termin.id}>
                                                        {termin.kode_tipe} - {termin.nama_tipe}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.termin_id && (
                                                <p className="mt-1 text-sm text-red-600">{errors.termin_id}</p>
                                            )}
                                        </div>

                                        {/* Harga Kontrak */}
                                        <div>
                                            <label htmlFor="harga_kontrak" className="block text-sm font-medium text-gray-700">
                                                Harga Kontrak
                                            </label>
                                            <input
                                                type="number"
                                                id="harga_kontrak"
                                                value={data.harga_kontrak}
                                                onChange={(e) => setData('harga_kontrak', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="0"
                                                min="0"
                                                step="1"
                                                required
                                            />
                                            {errors.harga_kontrak && (
                                                <p className="mt-1 text-sm text-red-600">{errors.harga_kontrak}</p>
                                            )}
                                        </div>

                                        {/* Sisa Pembayaran */}
                                        {data.harga_kontrak && (
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Sisa Pembayaran:
                                                    </span>
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {formatRupiah(sisaPembayaran)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Harga Kontrak - Commitment Fee
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Kontrak'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
