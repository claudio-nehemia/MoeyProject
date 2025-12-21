import { Head, Link } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export default function GambarKerjaShow({ file }: any) {
    const [sidebarOpen, setSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Preview Gambar Kerja" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="gambar-kerja"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-3 pb-6 w-full overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">
                            Preview Gambar Kerja
                        </h1>
                        <p className="text-sm text-stone-600">
                            {file.original_name}
                        </p>
                    </div>

                    <Link
                        href="/gambar-kerja"
                        className="px-4 py-2 text-sm bg-stone-200 rounded-lg hover:bg-stone-300"
                    >
                        ← Kembali
                    </Link>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    {file.is_image ? (
                        <img
                            src={file.url}
                            alt={file.original_name}
                            className="max-h-[75vh] mx-auto object-contain rounded"
                        />
                    ) : (
                        <iframe
                            src={file.url}
                            className="w-full h-[75vh] border rounded"
                        />
                    )}

                    <div className="mt-4 text-xs text-stone-600">
                        Upload oleh <b>{file.uploaded_by}</b> •{' '}
                        {new Date(file.created_at).toLocaleString('id-ID')}
                    </div>
                </div>
            </main>
        </div>
    );
}
