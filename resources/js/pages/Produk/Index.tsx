import { useState, FormEventHandler, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProdukModal from "@/components/ProdukModal";
import SearchFilter from "@/components/SearchFilter";

interface Produk {
    id: number;
    nama_produk: string;
    harga: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    produks: Produk[];
}

export default function Index({ produks }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredProduks, setFilteredProduks] = useState(produks);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_produk: "",
        harga: "",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const filtered = produks.filter(produk =>
            produk.nama_produk.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProduks(filtered);
    }, [searchQuery, produks]);

    const openCreateModal = () => {
        setEditMode(false);
        reset();
        setShowModal(true);
    };

    const openEditModal = (produk: Produk) => {
        setSelectedProduk(produk);
        setData({
            nama_produk: produk.nama_produk,
            harga: produk.harga.toString(),
        });
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedProduk(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedProduk) {
            put(`/produk/${selectedProduk.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post("/produk", {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            router.delete(`/produk/${id}`);
        }
    };

    const handleDataChange = (field: string, value: string) => {
        setData(field as any, value);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-stone-50">
            <Head title="Product Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="produk" />

            {/* Main Content */}
            <main className="pt-12 pl-60 px-4 pb-6 transition-all">
                {/* Header Section */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-stone-900">Product Management</h1>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Create
                        </button>
                    </div>
                    <p className="text-xs text-stone-600">Manage and organize your products efficiently</p>
                </div>

                {/* Search & Filter */}
                <SearchFilter
                    onSearch={setSearchQuery}
                    onFilterChange={() => {}}
                    filters={{}}
                    searchPlaceholder="Search by product name..."
                />

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                    {filteredProduks.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-stone-600 text-sm">{searchQuery ? 'No results found' : 'No products found. Create your first product to get started.'}</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">No</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">Product Name</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">Price</th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-stone-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProduks.map((produk, index) => (
                                    <tr key={produk.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-stone-700 font-semibold text-xs">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <span className="text-xs font-bold text-white">
                                                        {produk.nama_produk.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-stone-900">{produk.nama_produk}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-rose-700 font-semibold text-xs">
                                                {formatPrice(produk.harga)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => openEditModal(produk)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(produk.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/30" onClick={closeModal} />
            )}

            {/* Modal */}
            <ProdukModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={handleDataChange}
            />
        </div>
    );
}
