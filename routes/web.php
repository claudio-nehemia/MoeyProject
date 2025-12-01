<?php

use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DefectController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\TerminController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\KontrakController;
use App\Http\Controllers\RabJasaController;
use App\Http\Controllers\EstimasiController;
use App\Http\Controllers\JenisItemController;
use App\Http\Controllers\MoodboardController;
use App\Http\Controllers\RabVendorController;
use App\Http\Controllers\RabKontrakController;
use App\Http\Controllers\DesainFinalController;
use App\Http\Controllers\RabInternalController;
use App\Http\Controllers\CommitmentFeeController;
use App\Http\Controllers\ItemPekerjaanController;
use App\Http\Controllers\JenisInteriorController;
use App\Http\Controllers\SurveyResultsController;
use App\Http\Controllers\ProjectManagementController;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // DASHBOARD = all role
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard'); 


    // MASTER DATA ROUTES = Admin
    // Divisi Routes
    Route::middleware(['permission:divisi.index'])->group(function () {
        Route::get('divisi', [DivisiController::class, 'index'])->name('divisi.index');
        Route::get('divisi/{divisi}', [DivisiController::class, 'show'])->name('divisi.show');
    });
    Route::post('divisi', [DivisiController::class, 'store'])
        ->middleware('permission:divisi.create')->name('divisi.store');
    Route::put('divisi/{divisi}', [DivisiController::class, 'update'])
        ->middleware('permission:divisi.edit')->name('divisi.update');
    Route::delete('divisi/{divisi}', [DivisiController::class, 'destroy'])
        ->middleware('permission:divisi.delete')->name('divisi.destroy');

    // Role Routes
    // Get all permissions (must be before {role} routes)
    Route::get('role/permissions', [RoleController::class, 'getAllPermissions'])
        ->middleware('permission:role.index')->name('role.allPermissions');
    Route::get('role/create', [RoleController::class, 'create'])
        ->middleware('permission:role.create')->name('role.create');
    
    Route::middleware(['permission:role.index'])->group(function () {
        Route::get('role', [RoleController::class, 'index'])->name('role.index');
        Route::get('role/{role}', [RoleController::class, 'show'])->name('role.show');
        Route::get('role/{role}/permissions', [RoleController::class, 'getPermissions'])->name('role.permissions');
        Route::get('role/{role}/edit', [RoleController::class, 'edit'])->name('role.edit');
    });
    Route::post('role', [RoleController::class, 'store'])
        ->middleware('permission:role.create')->name('role.store');
    Route::put('role/{role}', [RoleController::class, 'update'])
        ->middleware('permission:role.edit')->name('role.update');
    Route::post('role/{role}/permissions', [RoleController::class, 'updatePermissions'])
        ->middleware('permission:role.edit')->name('role.updatePermissions');
    Route::delete('role/{role}', [RoleController::class, 'destroy'])
        ->middleware('permission:role.delete')->name('role.destroy');

    // User Routes
    Route::middleware(['permission:user.index'])->group(function () {
        Route::get('user', [UserController::class, 'index'])->name('user.index');
        Route::get('user/{user}', [UserController::class, 'show'])->name('user.show');
        Route::get('/api/user/roles', [UserController::class, 'fetchRoles'])->name('user.fetchRoles');
    });
    Route::post('user', [UserController::class, 'store'])
        ->middleware('permission:user.create')->name('user.store');
    Route::put('user/{user}', [UserController::class, 'update'])
        ->middleware('permission:user.edit')->name('user.update');
    Route::delete('user/{user}', [UserController::class, 'destroy'])
        ->middleware('permission:user.delete')->name('user.destroy');

    // Jenis Interior Routes
    Route::resource('jenis-interior', JenisInteriorController::class)
        ->middleware([
            'index' => 'permission:jenis-interior.index',
            'store' => 'permission:jenis-interior.create',
            'update' => 'permission:jenis-interior.edit',
            'destroy' => 'permission:jenis-interior.delete',
        ]);

    // Jenis Item Routes
    Route::middleware(['permission:jenis-item.index'])->group(function () {
        Route::get('jenis-item', [JenisItemController::class, 'index'])->name('jenis-item.index');
        Route::get('/api/jenis-item', [ItemController::class, 'getJenisItems'])->name('jenis-item.fetch');
    });
    Route::post('jenis-item', [JenisItemController::class, 'store'])
        ->middleware('permission:jenis-item.create')->name('jenis-item.store');
    Route::put('jenis-item/{jenisItem}', [JenisItemController::class, 'update'])
        ->middleware('permission:jenis-item.edit')->name('jenis-item.update');
    Route::delete('jenis-item/{jenisItem}', [JenisItemController::class, 'destroy'])
        ->middleware('permission:jenis-item.delete')->name('jenis-item.destroy');

    // Item Routes
    Route::resource('item', ItemController::class)
        ->middleware([
            'index' => 'permission:item.index',
            'store' => 'permission:item.create',
            'update' => 'permission:item.edit',
            'destroy' => 'permission:item.delete',
        ]);

    // Produk Routes
    Route::resource('produk', ProdukController::class)
        ->middleware([
            'index' => 'permission:produk.index',
            'store' => 'permission:produk.create',
            'update' => 'permission:produk.edit',
            'destroy' => 'permission:produk.delete',
        ]);

    Route::get('produk', [ProdukController::class, 'index'])
        ->middleware('permission:produk.index')->name('produk.index');
    Route::post('produk', [ProdukController::class, 'store'])
        ->middleware('permission:produk.create')->name('produk.store');
    Route::put('produk/{produk}', [ProdukController::class, 'update'])
        ->middleware('permission:produk.edit')->name('produk.update');
    Route::delete('produk/{produk}', [ProdukController::class, 'destroy'])
        ->middleware('permission:produk.delete')->name('produk.destroy');
    Route::delete('produk/{produk}/delete-image', [ProdukController::class, 'deleteImage'])
        ->middleware('permission:produk.delete-image')->name('produk.delete-image');

    // Termin Routes
    Route::resource('termin', TerminController::class)
        ->middleware([
            'index' => 'permission:termin.index',
            'store' => 'permission:termin.create',
            'update' => 'permission:termin.edit',
            'destroy' => 'permission:termin.delete',
        ]);


    // ORDER PLANNING ROUTES
    Route::middleware('permission:order.index')->get('order', [OrderController::class, 'index'])->name('order.index');
    Route::middleware('permission:order.create')->get('order/create', [OrderController::class, 'create'])->name('order.create');
    Route::middleware('permission:order.create')->post('order', [OrderController::class, 'store'])->name('order.store');
    Route::middleware('permission:order.edit')->get('order/{order}/edit', [OrderController::class, 'edit'])->name('order.edit');
    Route::middleware('permission:order.edit')->put('order/{order}', [OrderController::class, 'update'])->name('order.update');
    Route::middleware('permission:order.show')->get('order/{order}', [OrderController::class, 'show'])->name('order.show');
    Route::middleware('permission:order.delete')->delete('order/{order}', [OrderController::class, 'destroy'])->name('order.destroy');

    // SURVEY RESULTS ROUTES
    Route::middleware(['permission:survey-results.index'])->group(function () {
        Route::get('survey-results', [SurveyResultsController::class, 'index'])->name('survey-results.index');
    });
    Route::middleware(['permission:survey-results.create'])->group(function () {
        Route::post('survey-results', [SurveyResultsController::class, 'store'])->name('survey-results.store');
        Route::post('survey-results/{orderId}/mark-response', [SurveyResultsController::class, 'markResponse'])
            ->name('survey-results.mark-response');
    });
    Route::get('survey-results/{surveyResult}/edit', [SurveyResultsController::class, 'edit'])
        ->middleware('permission:survey-results.edit')->name('survey-results.edit');
    Route::put('survey-results/{surveyResult}', [SurveyResultsController::class, 'update'])
        ->middleware('permission:survey-results.edit')->name('survey-results.update');
    Route::get('survey-results/{surveyResult}', [SurveyResultsController::class, 'show'])
        ->middleware('permission:survey-results.show')->name('survey-results.show');

    // MOODBOARD ROUTES
    Route::get('moodboard', [MoodboardController::class, 'index'])
        ->middleware('permission:moodboard.index')->name('moodboard.index');
    Route::get('moodboard/{id}', [MoodboardController::class, 'show'])
        ->middleware('permission:moodboard.show')->name('moodboard.show');
    
    Route::middleware(['permission:moodboard.response'])->group(function () {
        Route::post('moodboard/response/{orderId}', [MoodboardController::class, 'responseMoodboard'])
            ->name('moodboard.response');
    });
    
    Route::middleware(['permission:moodboard.upload-kasar'])->group(function () {
        Route::post('moodboard/desain-kasar', [MoodboardController::class, 'uploadDesainKasar'])
            ->name('moodboard.uploadDesainKasar');
        Route::put('/moodboard/{moodboardId}/desain-kasar', [MoodboardController::class, 'updateDesainKasar'])
            ->name('moodboard.update-desain-kasar');
        Route::delete('/moodboard/file-kasar/{fileId}', [MoodboardController::class, 'deleteFileKasar'])
            ->name('moodboard.delete-file-kasar');
        Route::post('/moodboard/file-kasar/{fileId}/replace', [MoodboardController::class, 'replaceFileKasar'])
            ->name('moodboard.replace-file-kasar');
    });
    
    Route::middleware(['permission:moodboard.upload-final'])->group(function () {
        Route::post('moodboard/desain-final/{moodboardId}', [MoodboardController::class, 'uploadDesainFinal'])
            ->name('moodboard.uploadDesainFinal');
    });
    
    Route::middleware(['permission:moodboard.revise'])->group(function () {
        Route::post('moodboard/revise/{moodboardId}', [MoodboardController::class, 'reviseMoodboard'])
            ->name('moodboard.revise');
    });
    
    Route::middleware(['permission:moodboard.accept'])->group(function () {
        Route::post('moodboard/accept/{moodboardId}', [MoodboardController::class, 'acceptDesain'])
            ->name('moodboard.accept');
    });
    
    Route::delete('moodboard/{moodboardId}', [MoodboardController::class, 'destroy'])
        ->middleware('permission:moodboard.delete')->name('moodboard.delete');

    // ESTIMASI ROUTES
    Route::middleware(['permission:estimasi.index'])->group(function () {
        Route::get('estimasi', [EstimasiController::class, 'index'])->name('estimasi.index');
        Route::post('estimasi/response/{moodboardId}', [EstimasiController::class, 'responseEstimasi'])
            ->middleware('permission:estimasi.create')->name('estimasi.response');
        Route::post('estimasi/store', [EstimasiController::class, 'store'])
            ->middleware('permission:estimasi.create')->name('estimasi.store');
        Route::post('estimasi/accept/{moodboardId}', [MoodboardController::class, 'acceptDesain'])
            ->middleware('permission:estimasi.edit')->name('estimasi.accept');
        Route::post('estimasi/revise/{moodboardId}', [MoodboardController::class, 'reviseMoodboard'])
            ->middleware('permission:estimasi.edit')->name('estimasi.revise');
    });

    // COMMITMENT FEE ROUTES
    Route::middleware(['permission:commitment-fee.index'])->group(function () {
        Route::get('commitment-fee', [CommitmentFeeController::class, 'index'])->name('commitment-fee.index');
        Route::post('commitment-fee/response/{moodboardId}', [CommitmentFeeController::class, 'responseFee'])
            ->middleware('permission:commitment-fee.create')->name('commitment-fee.response');
        Route::post('commitment-fee/update-fee/{commitmentFeeId}', [CommitmentFeeController::class, 'updateFee'])
            ->middleware('permission:commitment-fee.edit')->name('commitment-fee.update-fee');
        Route::post('commitment-fee/upload-payment/{commitmentFeeId}', [CommitmentFeeController::class, 'uploadPayment'])
            ->middleware('permission:commitment-fee.edit')->name('commitment-fee.upload-payment');
    });

    // DESAIN FINAL ROUTES
    Route::middleware(['permission:desain-final.index'])->group(function () {
        Route::get('desain-final', [DesainFinalController::class, 'index'])->name('desain-final.index');
        Route::post('desain-final/upload', [DesainFinalController::class, 'uploadDesainFinal'])
            ->middleware('permission:desain-final.create')->name('desain-final.upload');
        Route::post('desain-final/accept/{moodboardId}', [DesainFinalController::class, 'acceptDesainFinal'])
            ->middleware('permission:desain-final.edit')->name('desain-final.accept');
        Route::post('desain-final/revise/{moodboardId}', [DesainFinalController::class, 'reviseDesainFinal'])
            ->middleware('permission:desain-final.edit')->name('desain-final.revise');
        Route::delete('desain-final/file/{fileId}', [DesainFinalController::class, 'deleteDesainFinalFile'])
            ->middleware('permission:desain-final.delete')->name('desain-final.file.delete');
        Route::post('desain-final/file/{fileId}/replace', [DesainFinalController::class, 'replaceDesainFinalFile'])
            ->middleware('permission:desain-final.edit')->name('desain-final.file.replace');
    });

    // INPUT ITEM ROUTES ITEM PEKERJAAN ROUTES
    Route::middleware(['permission:item-pekerjaan.index'])->group(function () {
        Route::get('item-pekerjaan', [ItemPekerjaanController::class, 'index'])->name('item-pekerjaan.index');
        Route::get('item-pekerjaan/{itemPekerjaanId}/show', [ItemPekerjaanController::class, 'show'])
            ->name('item-pekerjaan.show');
        
        Route::middleware(['permission:item-pekerjaan.create'])->group(function () {
            Route::post('item-pekerjaan/response/{moodboardId}', [ItemPekerjaanController::class, 'responseItemPekerjaan'])
                ->name('item-pekerjaan.response');
            Route::get('item-pekerjaan/{itemPekerjaanId}/create', [ItemPekerjaanController::class, 'create'])
                ->name('item-pekerjaan.create');
            Route::post('item-pekerjaan/store', [ItemPekerjaanController::class, 'store'])
                ->name('item-pekerjaan.store');
        });
        
        Route::middleware(['permission:item-pekerjaan.edit'])->group(function () {
            Route::get('item-pekerjaan/{itemPekerjaanId}/edit', [ItemPekerjaanController::class, 'edit'])
                ->name('item-pekerjaan.edit');
            Route::put('item-pekerjaan/{itemPekerjaanId}/update', [ItemPekerjaanController::class, 'update'])
                ->name('item-pekerjaan.update');
        });
    });

    // RAB INTERNAL ROUTES
    Route::middleware(['permission:rab-internal.index'])->group(function () {
        Route::get('rab-internal', [RabInternalController::class, 'index'])->name('rab-internal.index');
        Route::get('rab-internal/{rabInternalId}/show', [RabInternalController::class, 'show'])
            ->middleware('permission:rab-internal.show')->name('rab-internal.show');
        
        Route::middleware(['permission:rab-internal.create'])->group(function () {
            Route::post('rab-internal/response/{itemPekerjaanId}', [RabInternalController::class, 'responseRabInternal'])
                ->name('rab-internal.response');
            Route::get('rab-internal/{rabInternalId}/create', [RabInternalController::class, 'create'])
                ->name('rab-internal.create');
            Route::post('rab-internal/store', [RabInternalController::class, 'store'])
                ->name('rab-internal.store');
            Route::post('rab-internal/{rabInternalId}/submit', [RabInternalController::class, 'submit'])
                ->name('rab-internal.submit');
        });
        
        Route::middleware(['permission:rab-internal.edit'])->group(function () {
            Route::get('rab-internal/{rabInternalId}/edit', [RabInternalController::class, 'edit'])
                ->name('rab-internal.edit');
            Route::put('rab-internal/{rabInternalId}/update', [RabInternalController::class, 'update'])
                ->name('rab-internal.update');
        });
    });

    // RAB KONTRAK ROUTES
    Route::middleware(['permission:rab-kontrak.index'])->group(function () {
        Route::get('rab-kontrak', [RabKontrakController::class, 'index'])->name('rab-kontrak.index');
        Route::get('rab-kontrak/{rabKontrakId}/show', [RabKontrakController::class, 'show'])
            ->middleware('permission:rab-kontrak.show')->name('rab-kontrak.show');
        Route::post('rab-kontrak/{itemPekerjaanId}/generate', [RabKontrakController::class, 'generate'])
            ->middleware('permission:rab-kontrak.create')->name('rab-kontrak.generate');
        Route::post('rab-kontrak/{rabKontrakId}/regenerate', [RabKontrakController::class, 'regenerate'])
            ->middleware('permission:rab-kontrak.edit')->name('rab-kontrak.regenerate');
        Route::delete('rab-kontrak/{rabKontrakId}', [RabKontrakController::class, 'destroy'])
            ->middleware('permission:rab-kontrak.delete')->name('rab-kontrak.destroy');
    });

    // RAB VENDOR ROUTES
    Route::middleware(['permission:rab-vendor.index'])->group(function () {
        Route::get('rab-vendor', [RabVendorController::class, 'index'])->name('rab-vendor.index');
        Route::get('rab-vendor/{rabVendorId}/show', [RabVendorController::class, 'show'])
            ->middleware('permission:rab-vendor.show')->name('rab-vendor.show');
        Route::post('rab-vendor/{itemPekerjaanId}/generate', [RabVendorController::class, 'generate'])
            ->middleware('permission:rab-vendor.create')->name('rab-vendor.generate');
        Route::post('rab-vendor/{rabVendorId}/regenerate', [RabVendorController::class, 'regenerate'])
            ->middleware('permission:rab-vendor.edit')->name('rab-vendor.regenerate');
        Route::delete('rab-vendor/{rabVendorId}', [RabVendorController::class, 'destroy'])
            ->middleware('permission:rab-vendor.delete')->name('rab-vendor.destroy');
    });

    // RAB JASA ROUTES
    Route::middleware(['permission:rab-jasa.index'])->group(function () {
        Route::get('rab-jasa', [RabJasaController::class, 'index'])->name('rab-jasa.index');
        Route::get('rab-jasa/{rabJasaId}/show', [RabJasaController::class, 'show'])
            ->middleware('permission:rab-jasa.show')->name('rab-jasa.show');
        Route::post('rab-jasa/{itemPekerjaanId}/generate', [RabJasaController::class, 'generate'])
            ->middleware('permission:rab-jasa.create')->name('rab-jasa.generate');
        Route::post('rab-jasa/{rabJasaId}/regenerate', [RabJasaController::class, 'regenerate'])
            ->middleware('permission:rab-jasa.edit')->name('rab-jasa.regenerate');
        Route::delete('rab-jasa/{rabJasaId}', [RabJasaController::class, 'destroy'])
            ->middleware('permission:rab-jasa.delete')->name('rab-jasa.destroy');
    });

    // KONTRAK ROUTES
    Route::middleware('permission:kontrak.index')->get('kontrak', [KontrakController::class, 'index'])->name('kontrak.index');
    Route::middleware('permission:kontrak.create')->post('kontrak', [KontrakController::class, 'store'])->name('kontrak.store');
    Route::middleware('permission:kontrak.show')->get('kontrak/{kontrak}', [KontrakController::class, 'show'])->name('kontrak.show');
    Route::middleware('permission:kontrak.edit')->get('kontrak/{kontrak}/edit', [KontrakController::class, 'edit'])->name('kontrak.edit');
    Route::middleware('permission:kontrak.edit')->put('kontrak/{kontrak}', [KontrakController::class, 'update'])->name('kontrak.update');
    Route::middleware('permission:kontrak.delete')->delete('kontrak/{kontrak}', [KontrakController::class, 'destroy'])->name('kontrak.destroy');

    // INVOICE ROUTES
    Route::middleware(['permission:invoice.index'])->group(function () {
        Route::get('invoice', [InvoiceController::class, 'index'])->name('invoice.index');
        Route::get('invoice/{invoiceId}/show', [InvoiceController::class, 'show'])
            ->middleware('permission:invoice.show')->name('invoice.show');
        Route::post('invoice/{itemPekerjaanId}/generate', [InvoiceController::class, 'generate'])
            ->middleware('permission:invoice.create')->name('invoice.generate');
        Route::post('invoice/{invoiceId}/upload-bukti', [InvoiceController::class, 'uploadBuktiBayar'])
            ->middleware('permission:invoice.edit')->name('invoice.upload-bukti');
        Route::delete('invoice/{invoiceId}', [InvoiceController::class, 'destroy'])
            ->middleware('permission:invoice.delete')->name('invoice.destroy');
    });

    // PROJECT MANAGEMENT ROUTES
    Route::middleware(['permission:project-management.index'])->group(function () {
        Route::get('/project-management', [ProjectManagementController::class, 'index']);
        Route::get('/project-management/{id}', [ProjectManagementController::class, 'show'])
            ->middleware('permission:project-management.show');
        Route::post('/produk/{id}/update-stage', [ProjectManagementController::class, 'updateStage'])
            ->middleware('permission:project-management.update-stage');
        Route::post('/produk/{id}/generate-bast', [ProjectManagementController::class, 'generateBast'])
            ->middleware('permission:project-management.bast');
        Route::get('/produk/{id}/download-bast', [ProjectManagementController::class, 'downloadBast'])
            ->middleware('permission:project-management.bast');
    });

    // DEFECT ROUTES
    Route::middleware(['permission:defect.index'])->group(function () {
        Route::get('/defect-management', [DefectController::class, 'index'])->name('defect.index');
        Route::get('/defect-management/{id}', [DefectController::class, 'show'])
            ->middleware('permission:defect.show')->name('defect.show');
        Route::post('/defects', [DefectController::class, 'store'])
            ->middleware('permission:defect.create')->name('defect.store');
        Route::post('/defect-items/{id}/repair', [DefectController::class, 'storeRepair'])
            ->middleware('permission:defect.edit')->name('defect.repair.store');
        Route::delete('/defect-repairs/{id}', [DefectController::class, 'deleteRepair'])
            ->middleware('permission:defect.delete')->name('defect.repair.delete');
        Route::patch('/defects/{id}/status', [DefectController::class, 'updateStatus'])
            ->middleware('permission:defect.edit')->name('defect.status.update');
        
        // Approve & Reject Repair Routes
        Route::post('/defect-repairs/{id}/approve', [DefectController::class, 'approveRepair'])
            ->middleware('permission:defect.approve')->name('defect.repair.approve');
        Route::post('/defect-repairs/{id}/reject', [DefectController::class, 'rejectRepair'])
            ->middleware('permission:defect.approve')->name('defect.repair.reject');
    });

    // PDF ROUTES
    Route::middleware(['permission:pdf.export'])->group(function () {
        Route::get('/rab-jasa/{id}/pdf', [RabJasaController::class, 'exportPdf'])->name('rab-jasa.pdf');
        Route::get('/rab-kontrak/{id}/pdf', [RabKontrakController::class, 'exportPdf'])->name('rab-kontrak.pdf');
        Route::get('/rab-vendor/{id}/pdf', [RabVendorController::class, 'exportPdf'])->name('rab-vendor.pdf');
        Route::get('/invoice/{id}/export-pdf', [InvoiceController::class, 'exportPdf'])->name('invoice.pdf');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';