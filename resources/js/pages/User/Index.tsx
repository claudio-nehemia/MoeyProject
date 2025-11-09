import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UserModal from '@/components/UserModal';
import SearchFilter from '@/components/SearchFilter';

interface Role {
    id: number;
    nama_role: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    role?: {
        nama_role: string;
        divisi?: {
            nama_divisi: string;
        };
    };
    created_at: string;
    updated_at: string;
}

interface Props {
    users: User[];
}

export default function Index({ users }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [mounted, setMounted] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
    });

    useEffect(() => {
        setMounted(true);
        fetchRoles();
    }, []);

    useEffect(() => {
        let filtered = users.filter((user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (selectedRole) {
            filtered = filtered.filter((user) =>
                user.role_id.toString() === selectedRole
            );
        }

        setFilteredUsers(filtered);
    }, [searchQuery, selectedRole, users]);

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/user/roles');
            const rolesData = await response.json();
            setRoles(rolesData);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const openCreateModal = async () => {
        setEditMode(false);
        setSelectedUser(null);
        reset();
        await fetchRoles();
        setShowModal(true);
    };

    const openEditModal = async (user: User) => {
        setEditMode(true);
        setSelectedUser(user);
        
        // Fetch roles
        try {
            const response = await fetch(`/user/${user.id}/edit`);
            const responseData = await response.json();
            setRoles(responseData.roles);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
        
        setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role_id: user.role_id.toString(),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditMode(false);
        setSelectedUser(null);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedUser) {
            put(`/user/${selectedUser.id}`, {
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post('/user', {
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/user/${id}`);
        }
    };

    return (
        <>
            <Head title="User Management" />
            
            {/* Add custom animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }

                .fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .slideInLeft {
                    animation: slideInLeft 0.5s ease-out forwards;
                }

                .glass-effect {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                }

                .float {
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                .table-row-hover:hover {
                    transform: translateX(4px);
                    background: linear-gradient(to right, #fffbeb, white);
                }
            `}</style>
            
            {/* Navbar */}
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} currentPage="user" />

            {/* Main Content */}
            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-12">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-5 ${mounted ? 'fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h1 className="text-2xl font-light tracking-tight text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    User Management
                                </h1>
                                <span className="flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                            </div>
                            <p className="text-xs text-stone-600">
                                Manage system users and their roles
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                            </svg>
                            Add New User
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <SearchFilter
                        onSearch={setSearchQuery}
                        onFilterChange={(key, value) => {
                            if (key === 'role_id') {
                                setSelectedRole(value);
                            }
                        }}
                        filters={{
                            role_id: {
                                label: 'Role',
                                options: roles.map(role => ({
                                    value: role.id.toString(),
                                    label: role.nama_role
                                }))
                            }
                        }}
                        searchPlaceholder="Search by name or email..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-lg ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-sm text-left text-stone-600">
                            <thead className="text-xs text-stone-700 uppercase bg-gradient-to-r from-stone-50 to-stone-100 border-b-2 border-amber-200">
                                <tr>
                                    <th scope="col" className="px-5 py-3 font-semibold">No</th>
                                    <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                                    <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                                    <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                                    <th scope="col" className="px-5 py-3 font-semibold">Divisi</th>
                                    <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-14 h-14 text-stone-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                <p className="text-stone-500 font-medium text-sm">{searchQuery || selectedRole ? 'No results found' : 'No user data available'}</p>
                                                <p className="text-stone-400 text-xs mt-1">{searchQuery || selectedRole ? 'Try adjusting your search or filter' : 'Click "Add New User" to get started'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user, index) => (
                                        <tr key={user.id} className="bg-white border-b border-stone-100 table-row-hover transition-all">
                                            <td className="px-5 py-3">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-stone-900 text-sm">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs text-stone-600">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {user.role?.nama_role || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs text-stone-600">
                                                    {user.role?.divisi?.nama_divisi || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="inline-flex items-center px-2.5 py-1.5 text-xs text-amber-600 hover:text-white bg-amber-50 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 font-medium rounded-lg mr-2 transition-all transform hover:scale-105"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="inline-flex items-center px-2.5 py-1.5 text-xs text-red-600 hover:text-white bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium rounded-lg transition-all transform hover:scale-105"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <UserModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                roles={roles}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={setData}
            />
        </>
    );
}
