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
use App\Http\Controllers\JenisItemController;
use App\Http\Controllers\MoodboardController;
use App\Http\Controllers\EstimasiController;
use App\Http\Controllers\JenisInteriorController;
use App\Http\Controllers\SurveyResultsController;
use App\Http\Controllers\CommitmentFeeController;

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

    // ORDER PLANNING ROUTES
    Route::resource('order', OrderController::class);

    // SURVEY RESULTS ROUTES
    Route::resource('survey-results', SurveyResultsController::class);
    Route::post('survey-results/{orderId}/mark-response', [SurveyResultsController::class, 'markResponse'])->name('survey-results.mark-response');

    // MOODBOARD ROUTES
    Route::get('moodboard',[MoodboardController::class,'index'])->name('moodboard.index');
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


});

require __DIR__.'/settings.php';
