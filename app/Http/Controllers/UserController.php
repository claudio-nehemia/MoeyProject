<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('role.divisi')->get();
        return Inertia::render('User/Index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        $roles = Role::select('id', 'nama_role')->get();
        return response()->json($roles);
    }

    public function fetchRoles()
    {
        $roles = Role::select('id', 'nama_role')->get();
        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $roles = Role::select('id', 'nama_role')->get();
        return response()->json([
            'roles' => $roles,
            'user' => $user
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($request->filled('password')) {
            $request->validate([
                'password' => 'string|min:8|confirmed',
            ]);
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'User updated successfully.');
    }
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }
}

