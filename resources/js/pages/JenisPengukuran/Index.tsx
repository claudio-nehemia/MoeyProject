import { useState, FormEventHandler, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import SearchFilter from "@/components/SearchFilter";
import JenisPengukuranModal from "@/components/JenisPengukuranModal";

interface JenisPengukuran {
    id: number;
    nama_pengukuran: string;
}

interface Props {
    jenisPengukuran: JenisPengukuran[];
}

export default function Index({ jenisPengukuran }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedJenisPengukuran, setSelectedJenisPengukuran] =
        useState<JenisPengukuran | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredData, setFilteredData] = useState(jenisPengukuran);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_pengukuran: "",
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

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const filtered = jenisPengukuran.filter((item) =>
            item.nama_pengukuran.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredData(filtered);
    }, [searchQuery, jenisPengukuran]);

    const openCreateModal = () => {
        setEditMode(false);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: JenisPengukuran) => {
        setSelectedJenisPengukuran(item);
        setData({
            nama_pengukuran: item.nama_pengukuran,
        });
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setDeleteMode(false);
        setSelectedJenisPengukuran(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (deleteMode && selectedJenisPengukuran) {
            router.delete(`/jenis-pengukuran/${selectedJenisPengukuran.id}`, {
                onSuccess: closeModal,
            });
            return;
        }

        if (editMode && selectedJenisPengukuran) {
            put(`/jenis-pengukuran/${selectedJenisPengukuran.id}`, {
                onSuccess: closeModal,
            });
        } else {
            post("/jenis-pengukuran", {
                onSuccess: closeModal,
            });
        }
    };

    const openDeleteModal = (item: JenisPengukuran) => {
        setSelectedJenisPengukuran(item);
        setData({ nama_pengukuran: item.nama_pengukuran });
        setDeleteMode(true);
        setEditMode(false);
        setShowModal(true);
    };

    const handleDataChange = (field: string, value: string) => {
        setData(field as any, value);
    };

    return (
        <>
            <Head title="Jenis Pengukuran" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="jenis-pengukuran"
                onClose={() => setSidebarOpen(false)}
            />

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
                        className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent mb-2"
                        style={{ fontFamily: "Playfair Display, serif" }}
                    >
                        Jenis Pengukuran
                    </h1>
                    <p className="text-stone-600 text-sm">
                        Manage all measurement types used in project inspections.
                    </p>
                </div>

                {/* Content container */}
                <div
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200"
                    style={{
                        animation: mounted ? "fadeInUp 0.6s ease-out" : "none",
                    }}
                >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 px-5 py-4 border-b border-yellow-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
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
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-stone-800">
                                        All Measurement Types
                                    </h2>
                                    <p className="text-xs text-stone-500">
                                        Total: {filteredData.length} types
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all shadow-lg shadow-yellow-500/30 text-sm font-medium"
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
                                Create Jenis Pengukuran
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
                        <SearchFilter
                            onSearch={setSearchQuery}
                            filters={{}}
                            onFilterChange={() => {}}
                            searchPlaceholder="Search measurement type..."
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
                                        Measurement Name
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-stone-200">
                                {filteredData.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-yellow-50/30 transition-colors"
                                    >
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                {index + 1}
                                            </span>
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/jenis-pengukuran/${item.id}`}
                                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                            >
                                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {item.nama_pengukuran.charAt(
                                                        0
                                                    ).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-semibold text-stone-800 hover:text-yellow-600 transition-colors">
                                                    {item.nama_pengukuran}
                                                </div>
                                            </Link>
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/jenis-pengukuran/${item.id}`}
                                                    className="inline-flex items-center px-2.5 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs font-medium shadow-sm"
                                                >
                                                    View
                                                </Link>

                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-medium shadow-sm"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => openDeleteModal(item)}
                                                    className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium shadow-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredData.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-stone-500 font-medium">
                                    No measurement types found.
                                </p>
                                <p className="text-stone-400 text-sm mt-1">
                                    Click "Add Measurement" to add a new type.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <JenisPengukuranModal
                show={showModal}
                editMode={editMode}
                deleteMode={deleteMode}
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
