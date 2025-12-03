import { useState, FormEventHandler, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProdukModal from "@/components/ProdukModal";
import SearchFilter from "@/components/SearchFilter";

interface ProdukImage {
    id: number;
    image: string;
}

interface Item {
    id: number;
    nama_item: string;
    pivot?: {
        harga_dasar: number;
        harga_jasa: number;
    };
}

interface BahanBakuData {
    item_id: number;
    harga_dasar: string;
    harga_jasa: string;
}

interface Produk {
    id: number;
    nama_produk: string;
    harga: number;
    harga_jasa: number;
    created_at: string;
    updated_at: string;
    produk_images: ProdukImage[];
    bahan_bakus?: Item[];
}

interface Props {
    produks: Produk[];
    bahanBakuItems: Item[];
}

export default function Index({ produks, bahanBakuItems = [] }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredProduks, setFilteredProduks] = useState(produks);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        nama_produk: "",
        produk_images: [] as File[],
        bahan_baku: [] as BahanBakuData[],
        _method: 'POST'
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
        const filtered = produks.filter(produk =>
            produk.nama_produk.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProduks(filtered);
    }, [searchQuery, produks]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedProduk(null);
        setSelectedImages([]);
        reset();
        setShowModal(true);
    };

    const openEditModal = (produk: Produk) => {
        setSelectedProduk(produk);
        setSelectedImages([]);
        
        // Convert existing bahan bakus ke format BahanBakuData
        const bahanBakuData: BahanBakuData[] = (produk.bahan_bakus || []).map(item => ({
            item_id: item.id,
            harga_dasar: (item.pivot?.harga_dasar || 0).toString(),
            harga_jasa: (item.pivot?.harga_jasa || 0).toString(),
        }));
        
        setData({
            nama_produk: produk.nama_produk,
            produk_images: [],
            bahan_baku: bahanBakuData,
            _method: 'POST'
        });
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedProduk(null);
        setSelectedImages([]);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('nama_produk', data.nama_produk);
        
        // Append all selected images
        selectedImages.forEach((file, index) => {
            formData.append(`produk_images[${index}]`, file);
        });

        // Append bahan baku dengan pivot data
        data.bahan_baku.forEach((bahan, index) => {
            formData.append(`bahan_baku[${index}][item_id]`, bahan.item_id.toString());
            formData.append(`bahan_baku[${index}][harga_dasar]`, bahan.harga_dasar || '0');
            formData.append(`bahan_baku[${index}][harga_jasa]`, bahan.harga_jasa || '0');
        });

        if (editMode && selectedProduk) {
            formData.append('_method', 'PUT');
            router.post(`/produk/${selectedProduk.id}`, formData, {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            router.post("/produk", formData, {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            router.delete(`/produk/${id}`);
        }
    };

    const handleDeleteImage = (imagePath: string) => {
        if (selectedProduk) {
            router.post(`/produk/${selectedProduk.id}/delete-image`, {
                image_path: imagePath
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['produks'] });
                }
            });
        }
    };

    const handleDataChange = (field: string, value: string | BahanBakuData[]) => {
        setData(field as any, value);
    };

    const handleImagesChange = (files: File[]) => {
        setSelectedImages(files);
        setData('produk_images', files);
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
            <Sidebar isOpen={sidebarOpen} currentPage="produk" onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="pt-12 pl-0 sm:pl-60 px-2 sm:px-4 pb-6 transition-all">
                {/* Header Section */}
                <div className="mb-4 sm:mb-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Product Management</h1>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="w-full sm:w-auto px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center sm:justify-start gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Create Product</span>
                            <span className="sm:hidden">Create</span>
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
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden overflow-x-auto">
                    {filteredProduks.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-stone-600 text-xs sm:text-sm">{searchQuery ? 'No results found' : 'No products found. Create your first product to get started.'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-stone-700">No</th>
                                        <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-stone-700">Image</th>
                                        <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-stone-700">Product Name</th>
                                        <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-stone-700">Price</th>
                                        <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-stone-700">Harga Jasa</th>
                                        <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-stone-700">Bahan Baku</th>
                                        <th className="px-3 sm:px-4 py-2.5 text-center font-semibold text-stone-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProduks.map((produk, index) => (
                                        <tr key={produk.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-3 sm:px-4 py-2.5">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-stone-700 font-semibold text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2.5">
                                                {produk.produk_images && produk.produk_images.length > 0 ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={`/storage/${produk.produk_images[0].image}`}
                                                            alt={produk.nama_produk}
                                                            className="w-12 h-12 object-cover rounded-lg border-2 border-stone-200"
                                                        />
                                                        {produk.produk_images.length > 1 && (
                                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                                {produk.produk_images.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-stone-900 truncate">{produk.nama_produk}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2.5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-rose-700 font-semibold text-xs whitespace-nowrap">
                                                        {formatPrice(produk.harga)}
                                                    </span>
                                                    {produk.bahan_bakus && produk.bahan_bakus.length > 0 && (
                                                        <span className="text-xs text-stone-500">
                                                            dari {produk.bahan_bakus.length} bahan baku
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2.5">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-700 font-semibold text-xs whitespace-nowrap">
                                                    {formatPrice(produk.harga_jasa || 0)}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {produk.bahan_bakus && produk.bahan_bakus.length > 0 ? (
                                                        produk.bahan_bakus.slice(0, 2).map((item) => (
                                                            <div key={item.id} className="flex flex-col">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                                                    {item.nama_item}
                                                                </span>
                                                                {item.pivot && (
                                                                    <span className="text-[10px] text-stone-500 ml-1">
                                                                        D: {formatPrice(item.pivot.harga_dasar)} | J: {formatPrice(item.pivot.harga_jasa)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-stone-400 text-xs">No materials</span>
                                                    )}
                                                    {produk.bahan_bakus && produk.bahan_bakus.length > 2 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-xs font-medium">
                                                            +{produk.bahan_bakus.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2.5">
                                                <div className="flex items-center justify-center gap-1">
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
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            <ProdukModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                existingImages={selectedProduk?.produk_images || []}
                productId={selectedProduk?.id}
                bahanBakuItems={bahanBakuItems}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={handleDataChange}
                onImagesChange={handleImagesChange}
                onDeleteImage={handleDeleteImage}
            />
        </div>
    );
}