import { useState, FormEventHandler, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import RoleModal from "@/components/RoleModal";
import SearchFilter from "@/components/SearchFilter";

interface Divisi {
    id: number;
    nama_divisi: string;
}

interface Role {
    id: number;
    nama_role: string;
    divisi_id: number;
    divisi: Divisi;
}

interface Props {
    roles: Role[];
}

export default function Index({ roles }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [mounted, setMounted] = useState(false);
    const [divisis, setDivisis] = useState<Divisi[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDivisi, setSelectedDivisi] = useState("");
    const [filteredRoles, setFilteredRoles] = useState(roles);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_role: "",
        divisi_id: 0,
    });

    useEffect(() => {
        setMounted(true);
        fetchDivisis();
    }, []);

    const fetchDivisis = async () => {
        try {
            const response = await fetch("/role/create");
            const data = await response.json();
            setDivisis(data);
        } catch (error) {
            console.error("Failed to fetch divisis:", error);
        }
    };

    useEffect(() => {
        let filtered = roles.filter(role =>
            role.nama_role.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (selectedDivisi) {
            filtered = filtered.filter(role =>
                role.divisi_id.toString() === selectedDivisi
            );
        }
        setFilteredRoles(filtered);
    }, [searchQuery, selectedDivisi, roles]);

    const openCreateModal = async () => {
        try {
            const response = await fetch("/role/create");
            const fetchedDivisis = await response.json();
            setDivisis(fetchedDivisis);
            setEditMode(false);
            reset();
            setShowModal(true);
        } catch (error) {
            console.error("Failed to fetch divisis:", error);
        }
    };

    const openEditModal = async (role: Role) => {
        try {
            const response = await fetch(`/role/${role.id}/edit`);
            const responseData = await response.json();
            setDivisis(responseData.divisis);
            setSelectedRole(role);
            setData({
                nama_role: role.nama_role,
                divisi_id: role.divisi_id,
            });
            setEditMode(true);
            setShowModal(true);
        } catch (error) {
            console.error("Failed to fetch role data:", error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedRole(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedRole) {
            put(`/role/${selectedRole.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post("/role", {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this role?")) {
            router.delete(`/role/${id}`);
        }
    };

    const handleDataChange = (field: string, value: string | number) => {
        setData(field as any, value);
    };

    return (
        <>
            <Head title="Role Management" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="role" />

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
                        className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2"
                        style={{ fontFamily: "Playfair Display, serif" }}
                    >
                        Role Management
                    </h1>
                    <p className="text-stone-600 text-sm">
                        Manage roles and their divisions
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
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-5 py-4 border-b border-purple-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-stone-800">
                                        All Roles
                                    </h2>
                                    <p className="text-xs text-stone-500">
                                        Total: {filteredRoles.length} roles
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30 text-sm font-medium"
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
                                Add Role
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
                        <SearchFilter
                            onSearch={setSearchQuery}
                            onFilterChange={(key, value) => {
                                if (key === 'divisi_id') {
                                    setSelectedDivisi(value);
                                }
                            }}
                            filters={{
                                divisi_id: {
                                    label: 'Divisi',
                                    options: divisis.map(divisi => ({
                                        value: divisi.id.toString(),
                                        label: divisi.nama_divisi
                                    }))
                                }
                            }}
                            searchPlaceholder="Search by role name..."
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
                                        Role Name
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Divisi
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {filteredRoles.map((role, index) => (
                                    <tr
                                        key={role.id}
                                        className="hover:bg-purple-50/30 transition-colors"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/role/${role.id}`}
                                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                            >
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {role.nama_role.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-stone-800 hover:text-purple-600 transition-colors">
                                                        {role.nama_role}
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                {role.divisi.nama_divisi}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/role/${role.id}`}
                                                    className="inline-flex items-center px-2.5 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-xs font-medium shadow-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => openEditModal(role)}
                                                    className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role.id)}
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

                        {roles.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-purple-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-stone-500 font-medium">
                                    No roles found
                                </p>
                                <p className="text-stone-400 text-sm mt-1">
                                    Click "Add Role" to create your first role
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Role Modal */}
            <RoleModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                divisis={divisis}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={handleDataChange}
            />
        </>
    );
}
