<?php

use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\TerminController;
use App\Http\Controllers\KontrakController;
use App\Http\Controllers\RabJasaController;
use App\Http\Controllers\EstimasiController;
use App\Http\Controllers\JenisItemController;
use App\Http\Controllers\MoodboardController;
use App\Http\Controllers\RabVendorController;
use App\Http\Controllers\RabKontrakController;
use App\Http\Controllers\RabInternalController;
use App\Http\Controllers\CommitmentFeeController;
use App\Http\Controllers\ItemPekerjaanController;
use App\Http\Controllers\JenisInteriorController;
use App\Http\Controllers\SurveyResultsController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    // MASTER DATA ROUTES
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

    // Termin Routes
    Route::resource('termin', TerminController::class);

    // ORDER PLANNING ROUTES
    Route::resource('order', OrderController::class);

    // SURVEY RESULTS ROUTES
    Route::resource('survey-results', SurveyResultsController::class);
    Route::post('survey-results/{orderId}/mark-response', [SurveyResultsController::class, 'markResponse'])->name('survey-results.mark-response');

    // MOODBOARD ROUTES
    Route::get('moodboard', [MoodboardController::class, 'index'])->name('moodboard.index');
    Route::post('moodboard/response/{orderId}', [MoodboardController::class, 'responseMoodboard'])->name('moodboard.response');
    Route::post('moodboard/desain-kasar', [MoodboardController::class, 'uploadDesainKasar'])->name('moodboard.uploadDesainKasar');
    Route::post('moodboard/desain-final/{moodboardId}', [MoodboardController::class, 'uploadDesainFinal'])->name('moodboard.uploadDesainFinal');
    Route::post('moodboard/revise/{moodboardId}', [MoodboardController::class, 'reviseMoodboard'])->name('moodboard.revise');
    Route::post('moodboard/accept/{moodboardId}', [MoodboardController::class, 'acceptDesain'])->name('moodboard.accept');
    Route::get('moodboard/{id}', [MoodboardController::class, 'show'])->name('moodboard.show');
    Route::delete('moodboard/{moodboardId}', [MoodboardController::class, 'destroy'])->name('moodboard.delete');

    // ESTIMASI ROUTES
    Route::get('estimasi', [EstimasiController::class, 'index'])->name('estimasi.index');
    Route::post('estimasi/response/{moodboardId}', [EstimasiController::class, 'responseEstimasi'])->name('estimasi.response');
    Route::post('estimasi/store', [EstimasiController::class, 'store'])->name('estimasi.store');
    Route::post('estimasi/accept/{moodboardId}', [MoodboardController::class, 'acceptDesain'])->name('estimasi.accept');
    Route::post('estimasi/revise/{moodboardId}', [MoodboardController::class, 'reviseMoodboard'])->name('estimasi.revise');

    // COMMITMENT FEE ROUTES
    Route::get('commitment-fee', [CommitmentFeeController::class, 'index'])->name('commitment-fee.index');
    Route::post('commitment-fee/response/{moodboardId}', [CommitmentFeeController::class, 'responseFee'])->name('commitment-fee.response');
    Route::post('commitment-fee/update-fee/{commitmentFeeId}', [CommitmentFeeController::class, 'updateFee'])->name('commitment-fee.update-fee');
    Route::post('commitment-fee/upload-payment/{commitmentFeeId}', [CommitmentFeeController::class, 'uploadPayment'])->name('commitment-fee.upload-payment');

    // INPUT ITEM ROUTES

    // ITEM PEKERJAAN ROUTES
    Route::get('item-pekerjaan', [ItemPekerjaanController::class, 'index'])->name('item-pekerjaan.index');
    Route::post('item-pekerjaan/response/{moodboardId}', [ItemPekerjaanController::class, 'responseItemPekerjaan'])->name('item-pekerjaan.response');
    Route::get('item-pekerjaan/{itemPekerjaanId}/create', [ItemPekerjaanController::class, 'create'])->name('item-pekerjaan.create');
    Route::post('item-pekerjaan/store', [ItemPekerjaanController::class, 'store'])->name('item-pekerjaan.store');
    Route::get('item-pekerjaan/{itemPekerjaanId}/show', [ItemPekerjaanController::class, 'show'])->name('item-pekerjaan.show');
    Route::get('item-pekerjaan/{itemPekerjaanId}/edit', [ItemPekerjaanController::class, 'edit'])->name('item-pekerjaan.edit');
    Route::put('item-pekerjaan/{itemPekerjaanId}/update', [ItemPekerjaanController::class, 'update'])->name('item-pekerjaan.update');

    // RAB INTERNAL ROUTES
    Route::get('rab-internal', [RabInternalController::class, 'index'])->name('rab-internal.index');
    Route::post('rab-internal/response/{itemPekerjaanId}', [RabInternalController::class, 'responseRabInternal'])->name('rab-internal.response');
    Route::get('rab-internal/{rabInternalId}/create', [RabInternalController::class, 'create'])->name('rab-internal.create');
    Route::post('rab-internal/store', [RabInternalController::class, 'store'])->name('rab-internal.store');
    Route::get('rab-internal/{rabInternalId}/show', [RabInternalController::class, 'show'])->name('rab-internal.show');
    Route::get('rab-internal/{rabInternalId}/edit', [RabInternalController::class, 'edit'])->name('rab-internal.edit');
    Route::put('rab-internal/{rabInternalId}/update', [RabInternalController::class, 'update'])->name('rab-internal.update');
    Route::post('rab-internal/{rabInternalId}/submit', [RabInternalController::class, 'submit'])->name('rab-internal.submit');

    // RAB KONTRAK ROUTES (Auto-generate from RAB Internal)
    Route::get('rab-kontrak', [RabKontrakController::class, 'index'])->name('rab-kontrak.index');
    Route::post('rab-kontrak/{itemPekerjaanId}/generate', [RabKontrakController::class, 'generate'])->name('rab-kontrak.generate');
    Route::get('rab-kontrak/{rabKontrakId}/show', [RabKontrakController::class, 'show'])->name('rab-kontrak.show');
    Route::delete('rab-kontrak/{rabKontrakId}', [RabKontrakController::class, 'destroy'])->name('rab-kontrak.destroy');

    // RAB VENDOR ROUTES (Auto-generate from RAB Internal - Original Prices with Aksesoris)
    Route::get('rab-vendor', [RabVendorController::class, 'index'])->name('rab-vendor.index');
    Route::post('rab-vendor/{itemPekerjaanId}/generate', [RabVendorController::class, 'generate'])->name('rab-vendor.generate');
    Route::get('rab-vendor/{rabVendorId}/show', [RabVendorController::class, 'show'])->name('rab-vendor.show');
    Route::delete('rab-vendor/{rabVendorId}', [RabVendorController::class, 'destroy'])->name('rab-vendor.destroy');

    // RAB JASA ROUTES (Auto-generate from RAB Internal - Original Prices without Aksesoris)
    Route::get('rab-jasa', [RabJasaController::class, 'index'])->name('rab-jasa.index');
    Route::post('rab-jasa/{itemPekerjaanId}/generate', [RabJasaController::class, 'generate'])->name('rab-jasa.generate');
    Route::get('rab-jasa/{rabJasaId}/show', [RabJasaController::class, 'show'])->name('rab-jasa.show');
    Route::delete('rab-jasa/{rabJasaId}', [RabJasaController::class, 'destroy'])->name('rab-jasa.destroy');

    // KONTRAK ROUTES
    Route::resource('kontrak', KontrakController::class);

});

require __DIR__ . '/settings.php';
