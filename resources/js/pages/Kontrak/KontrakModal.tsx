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
        rab_kontrak: {
            id: number;
            grand_total: number;
        };
        sisa_pembayaran: number;
    };
    termins: Array<{
        id: number;
        kode_tipe: string;
        nama_tipe: string;
        tahapan: Array<{
            step: number;
            text: string;
            persentase?: number;
            percentage: number;
        }>;
    }>;
}

export default function KontrakModal({ show, onClose, itemPekerjaan, termins }: KontrakModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        item_pekerjaan_id: number;
        durasi_kontrak: number | string;
        termin_id: number | string;
    }>({
        item_pekerjaan_id: itemPekerjaan.id,
        durasi_kontrak: '',
        termin_id: '',
    });

    const grandTotal = itemPekerjaan.rab_kontrak.grand_total;
    const commitmentFee = itemPekerjaan.commitment_fee?.jumlah || 0;
    const sisaPembayaran = itemPekerjaan.sisa_pembayaran;

    // Get tahap 1 info when termin is selected
    const selectedTermin = termins.find(t => t.id === Number(data.termin_id));
    const tahap1 = selectedTermin?.tahapan?.[0];
    const tahap1Persentase = tahap1?.persentase || 0;
    const tahap1Nominal = sisaPembayaran * (tahap1Persentase / 100);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

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
            <div className="p-6">
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
                    </div>
                </div>

                {/* Nilai Kontrak Info - Auto dari RAB Kontrak */}
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                    <h3 className="font-semibold text-indigo-900 mb-3">💰 Nilai Kontrak (dari RAB Kontrak)</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Grand Total RAB Kontrak:</span>
                            <span className="text-xl font-bold text-indigo-600">{formatRupiah(grandTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Commitment Fee:</span>
                            <span className="font-semibold text-green-600">{formatRupiah(commitmentFee)}</span>
                        </div>
                        <hr className="border-indigo-200" />
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Sisa Pembayaran:</span>
                            <span className="text-2xl font-bold text-amber-600">{formatRupiah(sisaPembayaran)}</span>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Durasi Kontrak */}
                    <div>
                        <label htmlFor="durasi_kontrak" className="block text-sm font-medium text-gray-700 mb-1">
                            Durasi Kontrak (Hari) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="durasi_kontrak"
                                value={data.durasi_kontrak}
                                onChange={(e) => setData('durasi_kontrak', e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-16"
                                placeholder="Contoh: 30"
                                min="1"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                Hari
                            </span>
                        </div>
                        {errors.durasi_kontrak && (
                            <p className="mt-1 text-sm text-red-600">{errors.durasi_kontrak}</p>
                        )}
                        {data.durasi_kontrak && (
                            <p className="mt-1 text-xs text-gray-500">
                                ≈ {Math.floor(Number(data.durasi_kontrak) / 30)} bulan {Number(data.durasi_kontrak) % 30} hari
                            </p>
                        )}
                    </div>

                    {/* Termin */}
                    <div>
                        <label htmlFor="termin_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Termin Pembayaran <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="termin_id"
                            value={data.termin_id}
                            onChange={(e) => setData('termin_id', e.target.value ? parseInt(e.target.value) : '')}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                        
                        {/* Tampilkan Tahapan Termin */}
                        {selectedTermin?.tahapan && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">Tahapan Pembayaran:</h4>
                                <div className="space-y-1.5">
                                    {selectedTermin.tahapan.map((tahap, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                                {tahap.step}
                                            </span>
                                            <span className="text-gray-700">{tahap.text}</span>
                                            {tahap.persentase && (
                                                <span className="ml-auto text-xs font-bold text-blue-600">
                                                    {tahap.persentase}%
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Tahap 1 - Pembayaran Pertama */}
                    {tahap1 && (
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white font-bold">
                                    1
                                </span>
                                <div>
                                    <h4 className="font-bold text-amber-800">Pembayaran Tahap 1</h4>
                                    <p className="text-sm text-amber-700">{tahap1.text}</p>
                                </div>
                            </div>
                            {tahap1Persentase > 0 && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            {tahap1Persentase}% dari Sisa Pembayaran
                                        </span>
                                        <span className="text-xl font-bold text-amber-600">
                                            {formatRupiah(tahap1Nominal)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Nominal yang harus dibayar customer untuk melanjutkan ke tahap berikutnya
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Batal
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Simpan Kontrak
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}