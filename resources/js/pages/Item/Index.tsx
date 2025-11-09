import { useState, FormEventHandler, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ItemModal from "@/components/ItemModal";
import SearchFilter from "@/components/SearchFilter";

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Item {
    id: number;
    nama_item: string;
    jenis_item_id: number;
    jenis_item: JenisItem;
    harga: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    items: Item[];
}

export default function Index({ items }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredItems, setFilteredItems] = useState(items);
    const [jenisItems, setJenisItems] = useState<JenisItem[]>([]);
    const [selectedJenisItem, setSelectedJenisItem] = useState("");

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_item: "",
        jenis_item_id: "",
        harga: "",
    });

    useEffect(() => {
        setMounted(true);
        fetchJenisItems();
    }, []);

    const fetchJenisItems = async () => {
        try {
            const response = await fetch('/api/jenis-item');
            const data = await response.json();
            setJenisItems(data);
        } catch (error) {
            console.error('Error fetching jenis items:', error);
        }
    };

    useEffect(() => {
        let filtered = items.filter(item =>
            item.nama_item.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (selectedJenisItem) {
            filtered = filtered.filter(item =>
                item.jenis_item_id.toString() === selectedJenisItem
            );
        }
        setFilteredItems(filtered);
    }, [searchQuery, selectedJenisItem, items]);

    const openCreateModal = () => {
        setEditMode(false);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: Item) => {
        setSelectedItem(item);
        setData({
            nama_item: item.nama_item,
            jenis_item_id: item.jenis_item_id.toString(),
            harga: item.harga.toString(),
        });
        setEditMode(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedItem(null);
        reset();
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        if (editMode && selectedItem) {
            put(`/item/${selectedItem.id}`, {
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post("/item", {
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this item?")) {
            router.delete(`/item/${id}`);
        }
    };

    const handleDataChange = (key: string, value: string) => {
        setData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-stone-50">
            <Head title="Item Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="item" />

            {/* Main Content */}
            <main className="pt-12 pl-60 px-4 pb-6 transition-all ml-5">
                {/* Header Section */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042L5.960 9H9a2 2 0 100-4H6.75A2.75 2.75 0 004.75 2.5a2.5 2.5 0 00-2.466 2.667L1.897 5H1a1 1 0 000 2v3a1 1 0 001 1h1.17l.04.04a.997.997 0 00.042.01L5.96 18H3a1 1 0 100 2h14a1 1 0 100-2h-2.22l-.305-1.222a.997.997 0 00-.01-.042L14.04 11H11a2 2 0 100 4h2.25a2.75 2.75 0 002.25 2.5 2.5 2.5 0 002.466-2.667l.04-.04H19a1 1 0 100-2v-3a1 1 0 00-1-1h-1.17l-.04-.04a.997.997 0 00-.042-.01L14.04 2H17a1 1 0 100-2H3z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-stone-900 mt-10">Item Management</h1>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Create
                        </button>
                    </div>
                    <p className="text-xs text-stone-600">Manage and organize your items efficiently</p>
                </div>

                {/* Search & Filter */}
                <SearchFilter
                    onSearch={setSearchQuery}
                    onFilterChange={(key, value) => {
                        if (key === 'jenis_item_id') {
                            setSelectedJenisItem(value);
                        }
                    }}
                    filters={{
                        jenis_item_id: {
                            label: 'Item Type',
                            options: jenisItems.map(jenisItem => ({
                                value: jenisItem.id.toString(),
                                label: jenisItem.nama_jenis_item
                            }))
                        }
                    }}
                    searchPlaceholder="Search by item name..."
                />

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                    {filteredItems.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-stone-600 text-sm">{searchQuery || selectedJenisItem ? 'No results found' : 'No items found. Create your first item to get started.'}</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">No</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">Item Name</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">Type</th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-stone-700">Price</th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-stone-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item, index) => (
                                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-orange-100 to-orange-200 text-stone-700 font-semibold text-xs">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <span className="text-xs font-bold text-white">
                                                        {item.nama_item.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-stone-900">{item.nama_item}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 font-medium text-xs">
                                                {item.jenis_item.nama_jenis_item}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 font-semibold text-xs">
                                                {formatPrice(item.harga)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link
                                                    href={`/item/${item.id}`}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
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
            <ItemModal
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
