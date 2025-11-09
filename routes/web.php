<?php

use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\JenisItemController;
use App\Http\Controllers\JenisInteriorController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Divisi Routes
    Route::resource('divisi', DivisiController::class);

    // Role Routes
    Route::resource('role', RoleController::class);

    // User Routes
    Route::resource('user', UserController::class);
    Route::get('/api/user/roles', [UserController::class, 'fetchRoles'])->name('user.fetchRoles');

    // Jenis Interior Routes
    Route::resource('jenis-interior', JenisInteriorController::class);

    // Jenis Item Routes
    Route::resource('jenis-item', JenisItemController::class);
    Route::get('/api/jenis-item', [ItemController::class, 'getJenisItems'])->name('jenis-item.fetch');

    // Item Routes
    Route::resource('item', ItemController::class);

    // Produk Routes
    Route::resource('produk', ProdukController::class);
});

require __DIR__.'/settings.php';
