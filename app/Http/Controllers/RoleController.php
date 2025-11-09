<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Inertia\Inertia;
use App\Models\Divisi;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $roles = Role::with('divisi')->get();
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
        return response()->json($divisis);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_role' => 'required|string|max:255',
            'divisi_id' => 'required|exists:divisis,id',
        ]);

        Role::create($validated);

        return redirect()->back()->with('success', 'Role created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        $role->load('users', 'divisi');
        return Inertia::render('Role/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        $divisis = Divisi::select('id', 'nama_divisi')->get();
        return response()->json([
            'divisis' => $divisis,
            'role' => $role
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'nama_role' => 'required|string|max:255',
            'divisi_id' => 'required|exists:divisis,id',
        ]);

        $role->update($validated);

        return redirect()->back()->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        $role->delete();

        return redirect()->back()->with('success', 'Role deleted successfully.');
    }
}
