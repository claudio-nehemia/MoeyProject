import { FormEventHandler, useState, useEffect } from "react";

interface Divisi {
    id: number;
    nama_divisi: string;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
    group: string;
}

interface GroupedPermissions {
    [group: string]: Permission[];
}

interface RoleModalProps {
    show: boolean;
    editMode: boolean;
    processing: boolean;
    data: {
        nama_role: string;
        divisi_id: number;
        permissions?: string[];
    };
    errors: {
        nama_role?: string;
        divisi_id?: string;
        permissions?: string;
    };
    divisis: Divisi[];
    permissions?: GroupedPermissions;
    rolePermissions?: string[];
    onClose: () => void;
    onSubmit: FormEventHandler;
    onDataChange: (field: string, value: string | number | string[]) => void;
}

export default function RoleModal({
    show,
    editMode,
    processing,
    data,
    errors,
    divisis,
    permissions,
    rolePermissions = [],
    onClose,
    onSubmit,
    onDataChange
}: RoleModalProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(rolePermissions);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (show) {
            setSelectedPermissions(rolePermissions);
            // Expand all groups by default
            if (permissions) {
                const allGroups = Object.keys(permissions).reduce((acc, group) => {
                    acc[group] = true;
                    return acc;
                }, {} as { [key: string]: boolean });
                setExpandedGroups(allGroups);
            }
        }
    }, [show, rolePermissions, permissions]);

    if (!show) return null;

    const togglePermission = (permissionName: string) => {
        const newPermissions = selectedPermissions.includes(permissionName)
            ? selectedPermissions.filter(p => p !== permissionName)
            : [...selectedPermissions, permissionName];
        
        setSelectedPermissions(newPermissions);
        onDataChange('permissions', newPermissions);
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const selectAllInGroup = (groupPermissions: Permission[]) => {
        const groupPermissionNames = groupPermissions.map(p => p.name);
        const allSelected = groupPermissionNames.every(name => selectedPermissions.includes(name));
        
        let newPermissions: string[];
        if (allSelected) {
            // Deselect all in group
            newPermissions = selectedPermissions.filter(p => !groupPermissionNames.includes(p));
        } else {
            // Select all in group
            const toAdd = groupPermissionNames.filter(p => !selectedPermissions.includes(p));
            newPermissions = [...selectedPermissions, ...toAdd];
        }
        
        setSelectedPermissions(newPermissions);
        onDataChange('permissions', newPermissions);
    };

    const selectAll = () => {
        if (!permissions) return;
        
        const allPermissionNames = Object.values(permissions)
            .flat()
            .map(p => p.name);
        
        if (selectedPermissions.length === allPermissionNames.length) {
            setSelectedPermissions([]);
            onDataChange('permissions', []);
        } else {
            setSelectedPermissions(allPermissionNames);
            onDataChange('permissions', allPermissionNames);
        }
    };

    // Filter permissions based on search
    const filteredPermissions = permissions ? Object.entries(permissions).reduce((acc, [group, perms]) => {
        const filtered = perms.filter(p => 
            p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[group] = filtered;
        }
        return acc;
    }, {} as GroupedPermissions) : {};

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        onDataChange('permissions', selectedPermissions);
        onSubmit(e);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {editMode ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                                {editMode ? 'Edit Role & Permissions' : 'Create New Role'}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Basic Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nama Role Field */}
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                    Nama Role <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_role}
                                    onChange={(e) => onDataChange('nama_role', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="e.g., Admin, Manager"
                                    disabled={processing}
                                />
                                {errors.nama_role && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.nama_role}
                                    </div>
                                )}
                            </div>

                            {/* Divisi Field */}
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                    Divisi <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.divisi_id}
                                    onChange={(e) => onDataChange('divisi_id', parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    disabled={processing}
                                >
                                    <option value="">Select Divisi</option>
                                    {divisis.map((divisi) => (
                                        <option key={divisi.id} value={divisi.id}>
                                            {divisi.nama_divisi}
                                        </option>
                                    ))}
                                </select>
                                {errors.divisi_id && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.divisi_id}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Permissions Section */}
                        {permissions && Object.keys(permissions).length > 0 && (
                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-semibold text-stone-800">
                                            Permissions
                                        </h4>
                                        <p className="text-sm text-stone-600 mt-1">
                                            Select permissions for this role ({selectedPermissions.length} selected)
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                                    >
                                        {selectedPermissions.length === Object.values(permissions).flat().length 
                                            ? 'Deselect All' 
                                            : 'Select All'}
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search permissions..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Permissions List */}
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {Object.entries(filteredPermissions).map(([group, groupPermissions]) => {
                                        const allSelected = groupPermissions.every(p => selectedPermissions.includes(p.name));
                                        const someSelected = groupPermissions.some(p => selectedPermissions.includes(p.name));
                                        const isExpanded = expandedGroups[group];

                                        return (
                                            <div key={group} className="border border-stone-200 rounded-lg overflow-hidden">
                                                {/* Group Header */}
                                                <div 
                                                    className="bg-stone-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-colors"
                                                    onClick={() => toggleGroup(group)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <svg 
                                                            className={`w-5 h-5 text-stone-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        <h5 className="font-semibold text-stone-800">{group}</h5>
                                                        <span className="text-xs text-stone-500">
                                                            ({groupPermissions.filter(p => selectedPermissions.includes(p.name)).length}/{groupPermissions.length})
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            selectAllInGroup(groupPermissions);
                                                        }}
                                                        className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 border border-purple-300 rounded hover:bg-purple-50 transition-colors"
                                                    >
                                                        {allSelected ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>

                                                {/* Group Permissions */}
                                                {isExpanded && (
                                                    <div className="p-4 space-y-2 bg-white">
                                                        {groupPermissions.map((permission) => (
                                                            <label
                                                                key={permission.name}
                                                                className="flex items-center gap-3 p-2.5 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors group"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPermissions.includes(permission.name)}
                                                                    onChange={() => togglePermission(permission.name)}
                                                                    className="w-4 h-4 text-purple-600 border-stone-300 rounded focus:ring-2 focus:ring-purple-500"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium text-stone-800 group-hover:text-purple-600 transition-colors">
                                                                        {permission.display_name}
                                                                    </div>
                                                                    <div className="text-xs text-stone-500 font-mono">
                                                                        {permission.name}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {Object.keys(filteredPermissions).length === 0 && (
                                        <div className="text-center py-8 text-stone-500">
                                            <svg className="w-12 h-12 mx-auto mb-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            No permissions found
                                        </div>
                                    )}
                                </div>

                                {errors.permissions && (
                                    <div className="flex items-center gap-1.5 mt-3 text-red-600 text-sm">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.permissions}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t bg-stone-50 px-6 py-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-white transition-colors font-medium"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all font-medium shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {editMode ? 'Update Role' : 'Create Role'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}