<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Inertia\Inertia;
use App\Models\Divisi;
use App\Models\Permission;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $roles = Role::with(['divisi', 'permissions'])->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'nama_role' => $role->nama_role,
                'divisi_id' => $role->divisi_id,
                'divisi' => $role->divisi,
                'permissions_count' => $role->permissions->count(),
                'users_count' => $role->users()->count(),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return Inertia::render('Role/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $divisis = Divisi::select('id', 'nama_divisi')->get();
        $permissions = Permission::select('id', 'name', 'display_name', 'group')
            ->orderBy('group')
            ->orderBy('display_name')
            ->get()
            ->groupBy('group');
            
        return response()->json([
            'divisis' => $divisis,
            'permissions' => $permissions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_role' => 'required|string|max:255|unique:roles,nama_role',
            'divisi_id' => 'required|exists:divisis,id',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name'
        ], [
            'nama_role.required' => 'Role name is required',
            'nama_role.unique' => 'Role name already exists',
            'divisi_id.required' => 'Divisi is required',
            'divisi_id.exists' => 'Selected divisi is invalid',
        ]);

        $role = Role::create([
            'nama_role' => $validated['nama_role'],
            'divisi_id' => $validated['divisi_id'],
        ]);

        // Assign permissions if provided
        if (isset($validated['permissions']) && !empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->back()->with('success', 'Role created successfully with ' . count($validated['permissions'] ?? []) . ' permissions.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        $role->load(['users', 'divisi', 'permissions']);
        
        return Inertia::render('Role/Show', [
            'role' => [
                'id' => $role->id,
                'nama_role' => $role->nama_role,
                'divisi' => $role->divisi,
                'permissions' => $role->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'display_name' => $permission->display_name,
                        'group' => $permission->group,
                    ];
                })->groupBy('group'),
                'users' => $role->users,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        $divisis = Divisi::select('id', 'nama_divisi')->get();
        $permissions = Permission::select('id', 'name', 'display_name', 'group')
            ->orderBy('group')
            ->orderBy('display_name')
            ->get()
            ->groupBy('group');
        
        $rolePermissions = $role->permissions()->pluck('name')->toArray();
        
        return response()->json([
            'divisis' => $divisis,
            'role' => [
                'id' => $role->id,
                'nama_role' => $role->nama_role,
                'divisi_id' => $role->divisi_id,
            ],
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'nama_role' => 'required|string|max:255|unique:roles,nama_role,' . $role->id,
            'divisi_id' => 'required|exists:divisis,id',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name'
        ], [
            'nama_role.required' => 'Role name is required',
            'nama_role.unique' => 'Role name already exists',
            'divisi_id.required' => 'Divisi is required',
            'divisi_id.exists' => 'Selected divisi is invalid',
        ]);

        $role->update([
            'nama_role' => $validated['nama_role'],
            'divisi_id' => $validated['divisi_id'],
        ]);

        // Sync permissions
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        } else {
            $role->permissions()->detach();
        }

        return redirect()->back()->with('success', 'Role updated successfully with ' . count($validated['permissions'] ?? []) . ' permissions.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete role that has assigned users. Please reassign or remove users first.');
        }

        // Detach all permissions
        $role->permissions()->detach();
        
        // Delete role
        $role->delete();
        
        return redirect()->back()->with('success', 'Role deleted successfully.');
    }

    /**
     * Get permissions for a specific role
     */
    public function getPermissions(Role $role)
    {
        $permissions = $role->permissions()->pluck('name')->toArray();
        
        return response()->json([
            'permissions' => $permissions,
            'total' => count($permissions)
        ]);
    }

    /**
     * Update permissions for a role
     */
    public function updatePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        $role->syncPermissions($validated['permissions']);

        return redirect()->back()->with('success', 'Permissions updated successfully. Total: ' . count($validated['permissions']));
    }

    /**
     * Get all available permissions grouped
     */
    public function getAllPermissions()
    {
        $permissions = Permission::select('id', 'name', 'display_name', 'group')
            ->orderBy('group')
            ->orderBy('display_name')
            ->get()
            ->groupBy('group');

        return response()->json([
            'permissions' => $permissions,
            'total' => Permission::count()
        ]);
    }
}