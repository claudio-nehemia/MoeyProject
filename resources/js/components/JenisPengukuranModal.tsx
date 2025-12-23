import { FormEventHandler } from "react";

interface JenisPengukuranModalProps {
    show: boolean;
    editMode: boolean;
    deleteMode?: boolean;
    processing: boolean;
    data: {
        nama_pengukuran: string;
    };
    errors: {
        nama_pengukuran?: string;
    };
    onClose: () => void;
    // onSubmit: FormEventHandler;
    onSubmit: () => void;
    onDataChange: (field: string, value: string) => void;
}

export default function JenisPengukuranModal({
    show,
    editMode,
    deleteMode = false,
    processing,
    data,
    errors,
    onClose,
    onSubmit,
    onDataChange
}: JenisPengukuranModalProps) {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-100"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={
                    deleteMode
                        ? "bg-gradient-to-r from-red-500 to-red-700 px-6 py-4"
                        : "bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-4"
                }>
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">
                            {deleteMode
                                ? "Delete Jenis Pengukuran"
                                : editMode
                                    ? "Edit Jenis Pengukuran"
                                    : "Create New Jenis Pengukuran"}
                        </h3>

                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* DELETE MODE UI */}
                {deleteMode ? (
                    <form onSubmit={onSubmit} className="p-6 space-y-6">
                        <p className="text-stone-700 text-center">
                            Apakah Anda yakin ingin menghapus{" "}
                            <span className="font-semibold">{data.nama_pengukuran}</span>?
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg hover:bg-stone-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processing ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </form>
               ) : (
                    /* NORMAL MODE (CREATE / EDIT) */
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-stone-700 mb-2">
                                Nama Pengukuran
                            </label>
                            <input
                                type="text"
                                value={data.nama_pengukuran}
                                onChange={(e) => onDataChange("nama_pengukuran", e.target.value)}
                                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                disabled={processing}
                            />
                            {errors.nama_pengukuran && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.nama_pengukuran}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg hover:bg-stone-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={onSubmit} // ✅ sekarang BENAR
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg"
                            >
                                {processing ? "Saving..." : editMode ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
