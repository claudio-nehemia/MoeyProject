import { useState, FormEventHandler, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import JenisInteriorModal from "@/components/JenisInteriorModal";
import SearchFilter from "@/components/SearchFilter";

interface JenisInterior {
    id: number;
    nama_interior: string;
}

interface Props {
    jenisInteriors: JenisInterior[];
}

export default function Index({ jenisInteriors }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedJenisInterior, setSelectedJenisInterior] = useState<JenisInterior | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredJenisInteriors, setFilteredJenisInteriors] = useState(jenisInteriors);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_interior: "",
    });

useEffect(() => {
        setMounted(true);
        
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const filtered = jenisInteriors.filter(interior =>
            interior.nama_interior.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredJenisInteriors(filtered);
    }, [searchQuery, jenisInteriors]);

    const openCreateModal = () => {
        setEditMode(false);
        reset();
        setShowModal(true);
    };

    const openEditModal = (jenisInterior: JenisInterior) => {
        setSelectedJenisInterior(jenisInterior);
        setData({
            nama_interior: jenisInterior.nama_interior,
        });
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedJenisInterior(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedJenisInterior) {
            put(`/jenis-interior/${selectedJenisInterior.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post("/jenis-interior", {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this jenis interior?")) {
            router.delete(`/jenis-interior/${id}`);
        }
    };

    const handleDataChange = (field: string, value: string) => {
        setData(field as any, value);
    };

    return (
        <>
            <Head title="Jenis Interior Management" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="jenis-interior" onClose={() => setSidebarOpen(false)} />

            <div
                className={`transition-all duration-300 ${
                    sidebarOpen ? "ml-60" : "ml-0"
                } p-3 mt-12`}
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
                }}
            >
                {/* Header */}
                <div className="mb-6">
                    <h1
                        className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent mb-2"
                        style={{ fontFamily: "Playfair Display, serif" }}
                    >
                        Jenis Interior Management
                    </h1>
                    <p className="text-stone-600 text-sm">
                        Manage interior types for your products
                    </p>
                </div>

                {/* Content Card */}
                <div
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200"
                    style={{
                        animation: mounted ? "fadeInUp 0.6s ease-out" : "none",
                    }}
                >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-5 py-4 border-b border-teal-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-stone-800">
                                        All Interior Types
                                    </h2>
                                    <p className="text-xs text-stone-500">
                                        Total: {filteredJenisInteriors.length} types
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-400 to-teal-600 text-white rounded-lg hover:from-teal-500 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/30 text-sm font-medium"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Add Interior Type
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
                        <SearchFilter
                            onSearch={setSearchQuery}
                            onFilterChange={() => {}}
                            filters={{}}
                            searchPlaceholder="Search by interior type name..."
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-stone-50 border-b border-stone-200">
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Interior Type
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {filteredJenisInteriors.map((jenisInterior, index) => (
                                    <tr
                                        key={jenisInterior.id}
                                        className="hover:bg-teal-50/30 transition-colors"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {jenisInterior.nama_interior.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-stone-800">
                                                        {jenisInterior.nama_interior}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(jenisInterior)}
                                                    className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(jenisInterior.id)}
                                                    className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium shadow-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {jenisInteriors.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-teal-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                        />
                                    </svg>
                                </div>
                                <p className="text-stone-500 font-medium">
                                    No interior types found
                                </p>
                                <p className="text-stone-400 text-sm mt-1">
                                    Click "Add Interior Type" to create your first interior type
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Jenis Interior Modal */}
            <JenisInteriorModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={handleDataChange}
            />
        </>
    );
}
