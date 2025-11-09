import { useState, FormEventHandler, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import JenisItemModal from "@/components/JenisItemModal";
import SearchFilter from "@/components/SearchFilter";

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Props {
    jenisItems: JenisItem[];
}

export default function Index({ jenisItems }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedJenisItem, setSelectedJenisItem] = useState<JenisItem | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredJenisItems, setFilteredJenisItems] = useState(jenisItems);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_jenis_item: "",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const filtered = jenisItems.filter(item =>
            item.nama_jenis_item.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredJenisItems(filtered);
    }, [searchQuery, jenisItems]);

    const openCreateModal = () => {
        setEditMode(false);
        reset();
        setShowModal(true);
    };

    const openEditModal = (jenisItem: JenisItem) => {
        setSelectedJenisItem(jenisItem);
        setData({
            nama_jenis_item: jenisItem.nama_jenis_item,
        });
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedJenisItem(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedJenisItem) {
            put(`/jenis-item/${selectedJenisItem.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post("/jenis-item", {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this jenis item?")) {
            router.delete(`/jenis-item/${id}`);
        }
    };

    const handleDataChange = (field: string, value: string) => {
        setData(field as any, value);
    };

    return (
        <>
            <Head title="Jenis Item Management" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="jenis-item" />

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
                        className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent mb-2"
                        style={{ fontFamily: "Playfair Display, serif" }}
                    >
                        Jenis Item Management
                    </h1>
                    <p className="text-stone-600 text-sm">
                        Manage item types for your inventory
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
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-5 py-4 border-b border-indigo-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
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
                                        All Item Types
                                    </h2>
                                    <p className="text-xs text-stone-500">
                                        Total: {filteredJenisItems.length} types
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-400 to-indigo-600 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-500/30 text-sm font-medium"
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
                                Add Item Type
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
                        <SearchFilter
                            onSearch={setSearchQuery}
                            onFilterChange={() => {}}
                            filters={{}}
                            searchPlaceholder="Search by item type name..."
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
                                        Item Type
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {filteredJenisItems.map((jenisItem, index) => (
                                    <tr
                                        key={jenisItem.id}
                                        className="hover:bg-indigo-50/30 transition-colors"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/jenis-item/${jenisItem.id}`}
                                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                            >
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {jenisItem.nama_jenis_item.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-stone-800 hover:text-indigo-600 transition-colors">
                                                        {jenisItem.nama_jenis_item}
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/jenis-item/${jenisItem.id}`}
                                                    className="inline-flex items-center px-2.5 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-xs font-medium shadow-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => openEditModal(jenisItem)}
                                                    className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(jenisItem.id)}
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

                        {jenisItems.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-indigo-400"
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
                                <p className="text-stone-500 font-medium">
                                    No item types found
                                </p>
                                <p className="text-stone-400 text-sm mt-1">
                                    Click "Add Item Type" to create your first item type
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Jenis Item Modal */}
            <JenisItemModal
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
