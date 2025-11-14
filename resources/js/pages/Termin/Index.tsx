import Navbar from '@/components/Navbar';
import SearchFilter from '@/components/SearchFilter';
import Sidebar from '@/components/Sidebar';
import TerminModal from '@/components/TerminModal';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Termin {
    id: number;
    kode_tipe: string;
    nama_tipe: string;
    deskripsi: string | null;
    tahapan: { step: number; text: string }[];
    created_at: string;
    updated_at: string;
}

interface Props {
    termins: Termin[];
}

export default function Index({ termins }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTermins, setFilteredTermins] = useState(termins);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode_tipe: '',
        nama_tipe: '',
        deskripsi: '',
        tahapan: [{ tahapan: '' }],
    });

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const filtered = termins.filter(
            (termin) =>
                termin.kode_tipe
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                termin.nama_tipe
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );
        setFilteredTermins(filtered);
    }, [searchQuery, termins]);

    const handleTahapanChange = (index: number, value: string) => {
        const updated = [...data.tahapan];
        updated[index].tahapan = value;
        setData('tahapan', updated);
    };

    const addTahapanRow = () => {
        setData('tahapan', [...data.tahapan, { tahapan: '' }]);
    };

    const removeTahapanRow = (index: number) => {
        if (data.tahapan.length <= 1) return;
        const updated = data.tahapan.filter((_, i) => i !== index);
        setData('tahapan', updated);
    };

    const setTahapanData = (tahapan: { tahapan: string }[]) => {
        setData('tahapan', tahapan);
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedTermin(null);
        reset();
        setData('tahapan', [{ tahapan: '' }]);
        setShowModal(true);
    };

    const openEditModal = (termin: Termin) => {
        setSelectedTermin(termin);
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedTermin(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedTermin) {
            put(`/termin/${selectedTermin.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/termin', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this termin?')) {
            router.delete(`/termin/${id}`);
        }
    };

    const handleDataChange = (field: string, value: string) => {
        setData(field as any, value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-stone-50">
            <Head title="Termin Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="termin"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-2 pt-12 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header Section */}
                <div className="mb-4 sm:mb-5">
                    <div className="mb-2 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-0">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 shadow-md">
                                <svg
                                    className="h-4 w-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Termin Management
                            </h1>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-400 to-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:from-rose-500 hover:to-rose-700 hover:shadow-lg sm:w-auto sm:justify-start sm:px-3.5 sm:text-sm"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="hidden sm:inline">Create</span>
                        </button>
                    </div>
                    <p className="text-xs text-stone-600">
                        Manage and organize your payment terms efficiently
                    </p>
                </div>

                {/* Search & Filter */}
                <SearchFilter
                    onSearch={setSearchQuery}
                    onFilterChange={() => {}}
                    filters={{}}
                    searchPlaceholder="Search by code or name..."
                />

                {/* Table Section */}
                <div className="overflow-hidden overflow-x-auto rounded-xl border border-stone-100 bg-white shadow-sm">
                    {filteredTermins.length === 0 ? (
                        <div className="p-6 text-center sm:p-8">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
                                <svg
                                    className="h-6 w-6 text-rose-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                    />
                                </svg>
                            </div>
                            <p className="text-xs text-stone-600 sm:text-sm">
                                {searchQuery
                                    ? 'No results found'
                                    : 'No termins found. Create your first termin to get started.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold text-stone-700 sm:px-4">
                                            No
                                        </th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-stone-700 sm:px-4">
                                            Code
                                        </th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-stone-700 sm:px-4">
                                            Name
                                        </th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-stone-700 sm:px-4">
                                            Tahapan
                                        </th>
                                        <th className="px-3 py-2.5 text-center font-semibold text-stone-700 sm:px-4">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTermins.map((termin, index) => (
                                        <tr
                                            key={termin.id}
                                            className="border-b border-stone-100 transition-colors hover:bg-stone-50/50"
                                        >
                                            <td className="px-3 py-2.5 sm:px-4">
                                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-xs font-semibold text-stone-700">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 sm:px-4">
                                                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-100 to-rose-200 px-2 py-1 text-xs font-semibold whitespace-nowrap text-rose-700">
                                                    {termin.kode_tipe}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 sm:px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 shadow-sm sm:h-7 sm:w-7">
                                                        <span className="text-xs font-bold text-white">
                                                            {termin.nama_tipe
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="truncate font-medium text-stone-900">
                                                        {termin.nama_tipe}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 sm:px-4">
                                                <div className="flex flex-col gap-1">
                                                    {termin.tahapan &&
                                                    termin.tahapan.length >
                                                        0 ? (
                                                        termin.tahapan.map(
                                                            (item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-2 rounded-lg bg-stone-100 px-2 py-1 text-xs"
                                                                >
                                                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                                                        {
                                                                            item.step
                                                                        }
                                                                    </span>
                                                                    <span className="text-stone-700">
                                                                        {
                                                                            item.text
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-stone-400">
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5 sm:px-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(
                                                                termin,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
                                                        title="Edit"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                termin.id,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Overlay */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/30"
                    onClick={closeModal}
                />
            )}

            {/* Modal */}
            <TerminModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={handleDataChange}
                onTahapanChange={handleTahapanChange}
                onAddTahapan={addTahapanRow}
                onRemoveTahapan={removeTahapanRow}
                onSetTahapan={setTahapanData}
                selectedTerminId={selectedTermin?.id}
            />
        </div>
    );
}
