import React, { FormEventHandler } from 'react';
import Modal from '@/components/Modal';
import { useForm } from '@inertiajs/react';

interface KontrakModalProps {
    show: boolean;
    onClose: () => void;
    itemPekerjaan: {
        id: number;
        order: {
            nama_project: string;
            company_name: string;
            customer_name: string;
        };
        commitment_fee: {
            id: number;
            jumlah: number;
            status: string;
        } | null;
    };
    termins: Array<{
        id: number;
        kode_tipe: string;
        nama_tipe: string;
    }>;
}

export default function KontrakModal({ show, onClose, itemPekerjaan, termins }: KontrakModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        item_pekerjaan_id: number;
        tanggal_mulai: string;
        tanggal_selesai: string;
        termin_id: number | string;
        harga_kontrak: number | string;
    }>({
        item_pekerjaan_id: itemPekerjaan.id,
        tanggal_mulai: '',
        tanggal_selesai: '',
        termin_id: '',
        harga_kontrak: '',
    });

    const commitmentFee = itemPekerjaan.commitment_fee?.jumlah || 0;
    const sisaPembayaran = data.harga_kontrak ? Number(data.harga_kontrak) - commitmentFee : 0;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        console.log('Submitting kontrak with data:', data);

        post('/kontrak', {
            onSuccess: () => {
                console.log('Kontrak created successfully');
                reset();
                onClose();
            },
            onError: (errors) => {
                console.error('Kontrak creation failed:', errors);
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Buat Kontrak
                </h2>

                {/* General Error */}
                {(errors as any).error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{(errors as any).error}</p>
                    </div>
                )}

                {/* Project Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Informasi Project</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Nama Project:</span>
                            <p className="font-medium text-gray-900">{itemPekerjaan.order.nama_project}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Customer:</span>
                            <p className="font-medium text-gray-900">{itemPekerjaan.order.customer_name}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Company:</span>
                            <p className="font-medium text-gray-900">{itemPekerjaan.order.company_name}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Commitment Fee:</span>
                            <p className="font-medium text-green-600">
                                Rp {commitmentFee.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Tanggal Mulai */}
                    <div>
                        <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Mulai <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="tanggal_mulai"
                            value={data.tanggal_mulai}
                            onChange={(e) => setData('tanggal_mulai', e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                        {errors.tanggal_mulai && (
                            <p className="mt-1 text-sm text-red-600">{errors.tanggal_mulai}</p>
                        )}
                    </div>

                    {/* Tanggal Selesai */}
                    <div>
                        <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Selesai <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="tanggal_selesai"
                            value={data.tanggal_selesai}
                            onChange={(e) => setData('tanggal_selesai', e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                        {errors.tanggal_selesai && (
                            <p className="mt-1 text-sm text-red-600">{errors.tanggal_selesai}</p>
                        )}
                    </div>

                    {/* Termin */}
                    <div>
                        <label htmlFor="termin_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Termin <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="termin_id"
                            value={data.termin_id}
                            onChange={(e) => setData('termin_id', e.target.value ? parseInt(e.target.value) : '')}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                        <label htmlFor="harga_kontrak" className="block text-sm font-medium text-gray-700 mb-1">
                            Harga Kontrak <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="harga_kontrak"
                            value={data.harga_kontrak}
                            onChange={(e) => setData('harga_kontrak', e.target.value ? parseFloat(e.target.value) : '')}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Masukkan harga kontrak"
                            min="0"
                            required
                        />
                        {errors.harga_kontrak && (
                            <p className="mt-1 text-sm text-red-600">{errors.harga_kontrak}</p>
                        )}
                    </div>

                    {/* Sisa Pembayaran */}
                    {data.harga_kontrak && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Sisa Pembayaran:</span>
                                <span className="text-xl font-bold text-amber-600">
                                    Rp {sisaPembayaran.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                (Harga Kontrak - Commitment Fee)
                            </p>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Kontrak'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
