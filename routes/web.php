<?php

use Inertia\Inertia;
use GuzzleHttp\Middleware;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LogController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\KpiController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DefectController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\TerminController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\KontrakController;
use App\Http\Controllers\RabJasaController;
use App\Http\Controllers\EstimasiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JenisItemController;
use App\Http\Controllers\MoodboardController;
use App\Http\Controllers\RabVendorController;
use App\Http\Controllers\PmResponseController;
use App\Http\Controllers\RabKontrakController;
use App\Http\Controllers\ApprovalRabController;
use App\Http\Controllers\DesainFinalController;
use App\Http\Controllers\GambarKerjaController;
use App\Http\Controllers\RabInternalController;
use App\Http\Controllers\SurveyUlangController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TaskResponseController;
use App\Http\Controllers\WorkplanItemController;
use App\Http\Controllers\CommitmentFeeController;
use App\Http\Controllers\ItemPekerjaanController;
use App\Http\Controllers\JenisInteriorController;
use App\Http\Controllers\SurveyResultsController;
use App\Http\Controllers\SurveyScheduleController;
use App\Http\Controllers\JenisPengukuranController;
use App\Http\Controllers\ProjectManagementController;
use App\Http\Controllers\CashflowController;
use App\Http\Controllers\SupplierController;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // DASHBOARD = all role
    Route::get(
        'dashboard',
        [DashboardController::class, 'index']
    )->name('dashboard');

    Route::middleware(['auth'])->group(function () {
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
            Route::post('/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('mark-as-read');
            Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-as-read');
            Route::post('/{id}/response', [NotificationController::class, 'handleResponse'])->name('response');
            Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
        });
    });

    Route::middleware(['auth', 'permission:log.index'])->group(function () {
        Route::get('/log', [LogController::class, 'index'])->name('log.index');
        Route::get('/log/user/{userId}', [LogController::class, 'byUser'])
            ->middleware('permission:log.by-user')
            ->name('log.by-user');
        Route::get('/log/order/{orderId}', [LogController::class, 'byOrder'])
            ->middleware('permission:log.by-order')
            ->name('log.by-order');
        Route::get('/log/pm/{orderId}', [LogController::class, 'pmShow'])
            ->name('log.pm.show');
        Route::get('/log/task-response/{taskResponseId}/extend-log', [LogController::class, 'extendLog'])
            ->name('log.extend-log');
    });

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

    // KPI Routes
    Route::middleware(['permission:kpi.index'])->group(function () {
        Route::get('kpi', [KpiController::class, 'index'])->name('kpi.index');
        Route::get('kpi/{user}', [KpiController::class, 'show'])->name('kpi.show');
    });
    Route::post('kpi/settings', [KpiController::class, 'updateSettings'])
        ->middleware('permission:kpi.edit-settings')->name('kpi.update-settings');

    // Cashflow Routes
    Route::middleware(['permission:cashflow.index'])->group(function () {
        Route::get('cashflow', [CashflowController::class, 'index'])->name('cashflow.index');
        Route::get('cashflow/export-daily-payments', [CashflowController::class, 'exportDailyPayments'])
            ->name('cashflow.export-daily-payments');
        Route::get('cashflow/{order}/export-vendor-payments', [CashflowController::class, 'exportProjectVendorPayments'])
            ->name('cashflow.export-vendor-payments');
        Route::get('cashflow/{order}', [CashflowController::class, 'show'])->name('cashflow.show');
    });
    Route::post('cashflow/{order}/manual-entry', [CashflowController::class, 'storeManualEntry'])
        ->middleware('permission:cashflow.create')->name('cashflow.store-manual');
    Route::post('cashflow/{order}/vendor-entries', [CashflowController::class, 'storeVendorEntries'])
        ->middleware('permission:cashflow.create')->name('cashflow.store-vendor-entries');
    Route::put('cashflow/manual-entry/{entry}', [CashflowController::class, 'updateManualEntry'])
        ->middleware('permission:cashflow.edit')->name('cashflow.update-manual');
    Route::delete('cashflow/manual-entry/{entry}', [CashflowController::class, 'deleteManualEntry'])
        ->middleware('permission:cashflow.delete')->name('cashflow.delete-manual');
    Route::post('cashflow/vendor-entries/{entry}/toggle-flag', [CashflowController::class, 'toggleVendorFlag'])
        ->name('cashflow.vendor-entries.toggle-flag');

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
    });
    Route::get('/api/jenis-item', [ItemController::class, 'getJenisItems'])
        ->middleware('auth')->name('jenis-item.fetch');
    Route::get('jenis-item/create', [JenisItemController::class, 'index'])
        ->middleware('permission:jenis-item.create')->name('jenis-item.create');
    Route::post('jenis-item', [JenisItemController::class, 'store'])
        ->middleware('permission:jenis-item.create')->name('jenis-item.store');
    Route::put('jenis-item/{jenisItem}', [JenisItemController::class, 'update'])
        ->middleware('permission:jenis-item.edit')->name('jenis-item.update');
    Route::delete('jenis-item/{jenisItem}', [JenisItemController::class, 'destroy'])
        ->middleware('permission:jenis-item.delete')->name('jenis-item.destroy');

    // Jenis Pengukuran Routes
    Route::middleware(['permission:jenis-pengukuran.index'])->group(function () {
        Route::get('jenis-pengukuran', [JenisPengukuranController::class, 'index'])->name('jenis-pengukuran.index');
        Route::get('/api/jenis-pengukuran', [JenisPengukuranController::class, 'fetch'])->name('jenis-pengukuran.fetch');
    });
    // STORE
    Route::post('jenis-pengukuran', [JenisPengukuranController::class, 'store'])
        ->middleware('permission:jenis-pengukuran.create')
        ->name('jenis-pengukuran.store');
    // UPDATE
    Route::put('jenis-pengukuran/{jenisPengukuran}', [JenisPengukuranController::class, 'update'])
        ->middleware('permission:jenis-pengukuran.edit')
        ->name('jenis-pengukuran.update');
    // DELETE
    Route::delete('jenis-pengukuran/{jenisPengukuran}', [JenisPengukuranController::class, 'destroy'])
        ->middleware('permission:jenis-pengukuran.delete')
        ->name('jenis-pengukuran.destroy');

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
        ]);

    // Supplier Routes
    Route::resource('suppliers', SupplierController::class);

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
    Route::middleware('permission:order.index')->get('order-export-pdf', [OrderController::class, 'exportPdf'])->name('order.export-pdf');
    Route::middleware('permission:order.index')->get('order-export-excel', [OrderController::class, 'exportExcel'])->name('order.export-excel');

    // SURVEY RESULTS ROUTES
    Route::middleware(['permission:survey-results.index'])->group(function () {
        Route::get('survey-results', [SurveyResultsController::class, 'index'])->name('survey-results.index');
    });
    Route::middleware(['permission:survey-results.create'])->group(function () {
        Route::get('survey-results/order/{orderId}/create', [SurveyResultsController::class, 'create'])
            ->name('survey-results.create');
        Route::post('survey-results', [SurveyResultsController::class, 'store'])->name('survey-results.store');
        Route::post('survey-results/{orderId}/mark-response', [SurveyResultsController::class, 'markResponse'])
            ->name('survey-results.mark-response');
    });
    Route::get('survey-results/{surveyResult}/edit', [SurveyResultsController::class, 'edit'])
        ->middleware('permission:survey-results.edit')->name('survey-results.edit');
    Route::put('survey-results/{surveyResult}', [SurveyResultsController::class, 'update'])
        ->middleware('permission:survey-results.edit')->name('survey-results.update');
    Route::get('survey-results/{surveyResult}/download/{type}/{index}', [SurveyResultsController::class, 'downloadFile'])
        ->middleware('permission:survey-results.show')->name('survey-results.download');
    Route::delete('survey-results/{surveyResult}/file/{fileIndex}', [SurveyResultsController::class, 'deleteFile'])
        ->middleware('permission:survey-results.edit')->name('survey-results.delete-file');
    Route::get('survey-results/{surveyResult}', [SurveyResultsController::class, 'show'])
        ->middleware('permission:survey-results.show')->name('survey-results.show');
    Route::post('/survey-results/{id}/publish', [SurveyResultsController::class, 'publish'])
        ->middleware('permission:survey-results.edit')->name('survey-results.publish');

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
        Route::post('commitment-fee/revise-fee/{commitmentFeeId}', [CommitmentFeeController::class, 'reviseFee'])->middleware('permission:commitment-fee.edit')->name('commitment-fee.revise-fee');
        Route::post('commitment-fee/upload-payment/{commitmentFeeId}', [CommitmentFeeController::class, 'uploadPayment'])
            ->middleware('permission:commitment-fee.edit')->name('commitment-fee.upload-payment');
        Route::post('commitment-fee/reset-fee/{commitmentFee}', [CommitmentFeeController::class, 'resetFee'])
            ->middleware('permission:commitment-fee.edit')->name('commitment-fee.reset-fee');
        Route::get('commitment-fee/{id}/print', [CommitmentFeeController::class, 'print'])
            ->name('commitment-fee.print');
    });


    // DESAIN FINAL ROUTES
    Route::middleware(['permission:desain-final.index'])->group(function () {
        Route::get('desain-final', [DesainFinalController::class, 'index'])->name('desain-final.index');
        Route::post('desain-final/response/{moodboardId}', [DesainFinalController::class, 'responseDesainFinal'])
            ->middleware('permission:desain-final.create')->name('desain-final.response');
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
    Route::middleware('permission:kontrak.edit')->post('kontrak/response', [KontrakController::class, 'response'])->name('kontrak.response');
    Route::middleware('permission:kontrak.delete')->delete('kontrak/{kontrak}', [KontrakController::class, 'destroy'])->name('kontrak.destroy');
    Route::middleware('permission:kontrak.show')->get('kontrak/{kontrak}/print', [KontrakController::class, 'print'])->name('kontrak.print');

    // Signed Contract Routes
    Route::middleware('permission:kontrak.edit')->post('kontrak/{kontrak}/upload-signed', [KontrakController::class, 'uploadSignedContract'])->name('kontrak.upload-signed');
    Route::middleware('permission:kontrak.show')->get('kontrak/{kontrak}/download-signed', [KontrakController::class, 'downloadSignedContract'])->name('kontrak.download-signed');
    Route::middleware('permission:kontrak.edit')->delete('kontrak/{kontrak}/delete-signed', [KontrakController::class, 'deleteSignedContract'])->name('kontrak.delete-signed');

    // INVOICE ROUTES
    Route::middleware(['permission:invoice.index'])->group(function () {
        Route::get('invoice', [InvoiceController::class, 'index'])->name('invoice.index');
        Route::get('invoice/{invoiceId}/show', [InvoiceController::class, 'show'])
            ->middleware('permission:invoice.show')->name('invoice.show');
        Route::post('invoice/{itemPekerjaanId}/generate', [InvoiceController::class, 'generate'])
            ->middleware('permission:invoice.create')->name('invoice.generate');
        Route::post('invoice/{invoiceId}/upload-bukti', [InvoiceController::class, 'uploadBuktiBayar'])
            ->middleware('permission:invoice.edit')->name('invoice.upload-bukti');
        Route::post('invoice/{itemPekerjaanId}/upload-bast-foto-klien', [InvoiceController::class, 'uploadBastFotoKlien'])
            ->middleware('permission:invoice.edit')->name('invoice.upload-bast-foto-klien');
        Route::post('invoice/{invoiceId}/regenerate', [InvoiceController::class, 'regenerate'])
            ->middleware('permission:invoice.edit')->name('invoice.regenerate');
        
        Route::post('invoice/item-pekerjaan/{itemPekerjaanId}/response', [InvoiceController::class, 'response'])
            ->name('invoice.response');
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
        Route::post('/item-pekerjaan/{id}/generate-bast', [ProjectManagementController::class, 'generateBast'])
            ->middleware('permission:project-management.bast');
        Route::get('/item-pekerjaan/{id}/download-bast', [ProjectManagementController::class, 'downloadBast'])
            ->middleware('permission:project-management.bast');
        Route::post('/item-pekerjaan/{id}/unlock-next-step', [ProjectManagementController::class, 'unlockNextStep'])
            ->middleware('permission:project-management.unlock-payment');
        Route::put('/item-pekerjaan/{id}/request-perpanjangan', [ProjectManagementController::class, 'requestPerpanjanganTimeline'])
            ->middleware('permission:project-management.request-perpanjangan');
        Route::put('/item-pekerjaan/{pengajuanId}/acc-perpanjangan', [ProjectManagementController::class, 'acceptPerpanjanganTimeline'])
            ->middleware('permission:project-management.response-perpanjangan');
        Route::put('/item-pekerjaan/{pengajuanId}/reject-perpanjangan', [ProjectManagementController::class, 'rejectPerpanjanganTimeline'])
            ->middleware('permission:project-management.response-perpanjangan');
        Route::get('/project-management/{id}/export-pdf', [ProjectManagementController::class, 'exportPdf'])
            ->name('project-management.export-pdf');
        Route::get('/project-management/{id}/export-excel', [ProjectManagementController::class, 'exportExcel'])
            ->name('project-management.export-excel');
    });

    // WORKPLAN ROUTES
    Route::middleware(['permission:workplan.index'])->group(function () {
        Route::get('/workplan', [WorkplanItemController::class, 'index'])->name('workplan.index');
        Route::post('/workplan/{order}/response', [WorkplanItemController::class, 'response'])->name('workplan.response');
        Route::post('/workplan/{order}/response', [WorkplanItemController::class, 'response'])->name('workplan.response');
        Route::get('/workplan/{order}/create', [WorkplanItemController::class, 'create'])->name('workplan.create');
        Route::post('/workplan/{order}', [WorkplanItemController::class, 'store'])->name('workplan.store');
        Route::get('/workplan/{order}/edit', [WorkplanItemController::class, 'edit'])->name('workplan.edit');
        Route::put('/workplan/{order}', [WorkplanItemController::class, 'update'])->name('workplan.update');
        Route::post('/workplan/{workplan}/update-status', [WorkplanItemController::class, 'updateStatus'])->name('workplan.update.status');
        Route::get('/workplan/export/{orderId}', [WorkplanItemController::class, 'export'])->name('workplan.export');
    });

    // SUERVEY ULANG
    Route::middleware(['permission:survey-ulang.index'])
        ->prefix('survey-ulang')
        ->name('survey-ulang.')
        ->group(function () {

            // INDEX
            Route::get('/', [SurveyUlangController::class, 'index'])->name('index');

            // RESPONSE (Accept notification)
            Route::post('/{order}/response', [SurveyUlangController::class, 'response'])->name('response');

            // START
            Route::post('/{order}/start', [SurveyUlangController::class, 'start'])->name('start');

            // CREATE + STORE
            Route::get('/create/{order}', [SurveyUlangController::class, 'create'])->name('create');
            Route::post('/create/{order}', [SurveyUlangController::class, 'store'])->name('store');

            // SHOW
            Route::get('/show/{surveyUlang}', [SurveyUlangController::class, 'show'])->name('show');

            // EDIT + UPDATE
            Route::get('/edit/{surveyUlang}', [SurveyUlangController::class, 'edit'])->name('edit');
            Route::put('/edit/{surveyUlang}', [SurveyUlangController::class, 'update'])->name('update');

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
        Route::get('/rab-jasa/{id}/excel', [RabJasaController::class, 'exportExcel'])->name('rab-jasa.excel');
        Route::get('/rab-kontrak/{id}/pdf', [RabKontrakController::class, 'exportPdf'])->name('rab-kontrak.pdf');
        Route::get('/rab-kontrak/{id}/excel', [RabKontrakController::class, 'exportExcel'])->name('rab-kontrak.excel');
        Route::get('/rab-vendor/{id}/pdf', [RabVendorController::class, 'exportPdf'])->name('rab-vendor.pdf');
        Route::get('/rab-vendor/{id}/excel', [RabVendorController::class, 'exportExcel'])->name('rab-vendor.excel');
        Route::get('/rab-internal/{id}/pdf', [RabInternalController::class, 'exportPdf'])->name('rab-internal.pdf');
        Route::get('/rab-internal/{id}/excel', [RabInternalController::class, 'exportExcel'])->name('rab-internal.excel');
        Route::get('/invoice/{id}/export-pdf', [InvoiceController::class, 'exportPdf'])->name('invoice.pdf');
    });

    Route::prefix('survey-schedule')->name('survey-schedule.')->group(function () {

        Route::get('/', [SurveyScheduleController::class, 'index'])
            ->middleware('permission:survey-schedule.index')
            ->name('index');

        Route::post('/{order}', [SurveyScheduleController::class, 'store'])
            ->middleware('permission:survey-schedule.store')
            ->name('store');

        Route::post('/{order}/response', [SurveyScheduleController::class, 'response'])
            ->middleware('permission:survey-schedule.store')
            ->name('survey-schedule.response');

    });



    Route::prefix('gambar-kerja')->name('gambar-kerja.')->group(function () {
        Route::get('/', [GambarKerjaController::class, 'index'])
            ->middleware('permission:gambar-kerja.index')
            ->name('index');

        // RESPONSE - perlu menerima ID parameter
        Route::post('/response/{id}', [GambarKerjaController::class, 'response'])
            ->middleware('permission:gambar-kerja.response')
            ->name('response');

        Route::post('/upload', [GambarKerjaController::class, 'upload'])
            ->middleware('permission:gambar-kerja.upload')
            ->name('upload');

        Route::post('/approve/{id}', [GambarKerjaController::class, 'approve'])
            ->middleware('permission:gambar-kerja.approve')
            ->name('approve');

        Route::post('/revisi/{id}', [GambarKerjaController::class, 'revisi'])
            ->middleware('permission:gambar-kerja.revisi')
            ->name('revisi');

        Route::delete('/file/{id}', [GambarKerjaController::class, 'deleteFile'])
            ->middleware('permission:gambar-kerja.delete')
            ->name('delete');
    });

    Route::prefix('approval-material')->name('approval-material.')->group(function () {
        Route::get('/', [ApprovalRabController::class, 'index'])
            ->middleware('permission:approval-material.index')
            ->name('index');
        Route::get('/{itemPekerjaan}/edit', [ApprovalRabController::class, 'edit'])
            ->middleware('permission:approval-material.edit')
            ->name('edit');
        Route::put('/{itemPekerjaan}', [ApprovalRabController::class, 'update'])
            ->middleware('permission:approval-material.update')
            ->name('update');
        Route::post('/{itemPekerjaan}/responses', [ApprovalRabController::class, 'responses'])
            ->middleware('permission:approval-material.index')
            ->name('responses');
        Route::put('/approval-material/bulk-update', [ApprovalRabController::class, 'bulkUpdate'])
            ->middleware('permission:approval-material.update');
        Route::get('/{itemPekerjaan}/export-pdf', [ApprovalRabController::class, 'exportPdf'])
            ->middleware('permission:approval-material.index')
            ->name('export-pdf');
    });

    // PM Response Routes
    Route::prefix('pm-response')->name('pm.response.')->middleware('auth')->group(function () {
        Route::post('/moodboard/{orderId}', [PmResponseController::class, 'moodboard'])->name('moodboard');
        Route::post('/estimasi/{id}', [PmResponseController::class, 'estimasi'])->name('estimasi');
        Route::post('/commitment-fee/{id}', [PmResponseController::class, 'commitmentFee'])->name('commitment-fee');
        Route::post('/desain-final/{id}', [PmResponseController::class, 'desainFinal'])->name('desain-final');
        Route::post('/item-pekerjaan/{id}', [PmResponseController::class, 'itemPekerjaan'])->name('item-pekerjaan');
        Route::post('/item-pekerjaan-by-moodboard/{id}', [PmResponseController::class, 'itemPekerjaanByMoodboard'])->name('item-pekerjaan-by-moodboard');
        Route::post('/rab-internal/{id}', [PmResponseController::class, 'rabInternal'])->name('rab-internal');
        Route::post('/survey-ulang/{orderId}', [PmResponseController::class, 'surveyUlang'])->name('survey-ulang');
        Route::post('/survey-schedule/{orderId}', [PmResponseController::class, 'surveySchedule'])->name('pm-response.survey-schedule');
        Route::post('/gambar-kerja/{id}', [PmResponseController::class, 'gambarKerja'])->name('gambar-kerja');
        Route::post('/kontrak/{id}', [PmResponseController::class, 'kontrak'])->name('kontrak');
        Route::post('/survey-result/{orderId}', [PmResponseController::class, 'surveyResult'])->name('survey-result');
        Route::post('/approval-rab/{id}', [PmResponseController::class, 'approvalRab'])->name('approval-rab');
        Route::post('/workplan/{id}', [PmResponseController::class, 'workplan'])->name('workplan');
        Route::post('/invoice/{id}', [PmResponseController::class, 'invoice'])->name('invoice');
    });

    Route::post('/task-response/{orderId}/{tahap}/extend', [TaskResponseController::class, 'requestExtension'])
        ->name('task-response.extend');
    Route::get('/task-response/{orderId}/{tahap}', [TaskResponseController::class, 'getTaskResponse'])
        ->name('task-response.show');

    // Persetujuan Izin / Cuti Karyawan
    Route::get('/approve-cuti', [\App\Http\Controllers\CutiApprovalController::class, 'index'])->name('approve-cuti.index');
    Route::post('/approve-cuti', [\App\Http\Controllers\CutiApprovalController::class, 'approve'])->name('approve-cuti.approve');

    // Riwayat & Log Presensi Karyawan
    Route::get('/presensi-karyawan', [\App\Http\Controllers\PresensiKaryawanController::class, 'index'])->name('presensi-karyawan.index');
    Route::get('/presensi-karyawan/export', [\App\Http\Controllers\PresensiKaryawanController::class, 'exportExcel'])->name('presensi-karyawan.export');

    // Pengumuman Karyawan
    Route::get('/pengumuman-presensi', [\App\Http\Controllers\PengumumanController::class, 'index'])->name('pengumuman-presensi.index');
    Route::post('/pengumuman-presensi', [\App\Http\Controllers\PengumumanController::class, 'store'])->name('pengumuman-presensi.store');
    Route::post('/pengumuman-presensi/{id}', [\App\Http\Controllers\PengumumanController::class, 'update'])->name('pengumuman-presensi.update');
    Route::delete('/pengumuman-presensi/{id}', [\App\Http\Controllers\PengumumanController::class, 'destroy'])->name('pengumuman-presensi.destroy');

    // Pengaturan Presensi & Fitur Mobile
    Route::get('/pengaturan-presensi', [\App\Http\Controllers\PengaturanPresensiController::class, 'index'])->name('pengaturan-presensi.index');
    Route::post('/pengaturan-presensi', [\App\Http\Controllers\PengaturanPresensiController::class, 'update'])->name('pengaturan-presensi.update');

    // Karyawan Management & Face Recognition Master Data
    Route::middleware(['permission:karyawan.index'])->group(function () {
        Route::get('karyawan', [\App\Http\Controllers\KaryawanController::class, 'index'])->name('karyawan.index');
        Route::post('karyawan', [\App\Http\Controllers\KaryawanController::class, 'store'])->middleware('permission:karyawan.create')->name('karyawan.store');
        Route::post('karyawan/{nik}/upload-face', [\App\Http\Controllers\KaryawanController::class, 'uploadFace'])->middleware('permission:karyawan.edit')->name('karyawan.upload-face');
        Route::delete('karyawan/{nik}/delete-face/{id}', [\App\Http\Controllers\KaryawanController::class, 'deleteFace'])->middleware('permission:karyawan.edit')->name('karyawan.delete-face');
        Route::put('karyawan/{nik}', [\App\Http\Controllers\KaryawanController::class, 'update'])->middleware('permission:karyawan.edit')->name('karyawan.update');
        Route::delete('karyawan/{nik}', [\App\Http\Controllers\KaryawanController::class, 'destroy'])->middleware('permission:karyawan.delete')->name('karyawan.destroy');

        // Pelatihan routes
        Route::get('pelatihan', [\App\Http\Controllers\PelatihanController::class, 'index'])->name('pelatihan.index');
        Route::post('pelatihan', [\App\Http\Controllers\PelatihanController::class, 'store'])->name('pelatihan.store');
        Route::put('pelatihan/{kode_pelatihan}', [\App\Http\Controllers\PelatihanController::class, 'update'])->name('pelatihan.update');
        Route::delete('pelatihan/{kode_pelatihan}', [\App\Http\Controllers\PelatihanController::class, 'destroy'])->name('pelatihan.destroy');
        Route::get('pelatihan/{kode_pelatihan}/peserta', [\App\Http\Controllers\PelatihanController::class, 'manageParticipants'])->name('pelatihan.peserta');
        Route::post('pelatihan/{kode_pelatihan}/peserta', [\App\Http\Controllers\PelatihanController::class, 'addParticipants'])->name('pelatihan.peserta.add');
        Route::post('pelatihan/peserta/{id}/update', [\App\Http\Controllers\PelatihanController::class, 'updateParticipant'])->name('pelatihan.peserta.update');
        Route::delete('pelatihan/peserta/{id}', [\App\Http\Controllers\PelatihanController::class, 'removeParticipant'])->name('pelatihan.peserta.delete');

        // Resign routes
        Route::get('resign', [\App\Http\Controllers\ResignController::class, 'index'])->name('resign.index');
        Route::post('resign/{id}/approve', [\App\Http\Controllers\ResignController::class, 'approve'])->name('resign.approve');
        Route::post('resign/{id}/reject', [\App\Http\Controllers\ResignController::class, 'reject'])->name('resign.reject');
    });

    // Mesin Fingerprint Management
    Route::middleware(['permission:mesinfingerprint.index'])->group(function () {
        Route::get('mesin-fingerprint', [\App\Http\Controllers\MesinFingerprintController::class, 'index'])->name('mesin-fingerprint.index');
        Route::get('mesin-fingerprint/create', [\App\Http\Controllers\MesinFingerprintController::class, 'create'])->middleware('permission:mesinfingerprint.create')->name('mesin-fingerprint.create');
        Route::post('mesin-fingerprint', [\App\Http\Controllers\MesinFingerprintController::class, 'store'])->middleware('permission:mesinfingerprint.create')->name('mesin-fingerprint.store');
        Route::post('mesin-fingerprint/edit', [\App\Http\Controllers\MesinFingerprintController::class, 'edit'])->middleware('permission:mesinfingerprint.edit')->name('mesin-fingerprint.edit');
        Route::put('mesin-fingerprint/{id}', [\App\Http\Controllers\MesinFingerprintController::class, 'update'])->middleware('permission:mesinfingerprint.edit')->name('mesin-fingerprint.update');
        Route::delete('mesin-fingerprint/{id}', [\App\Http\Controllers\MesinFingerprintController::class, 'destroy'])->middleware('permission:mesinfingerprint.delete')->name('mesin-fingerprint.delete');
    });

    // Jam Kerja Management
    Route::middleware(['permission:jamkerja.index'])->group(function () {
        Route::get('jamkerja', [\App\Http\Controllers\JamkerjaController::class, 'index'])->name('jamkerja.index');
        Route::post('jamkerja', [\App\Http\Controllers\JamkerjaController::class, 'store'])->middleware('permission:jamkerja.create')->name('jamkerja.store');
        Route::put('jamkerja/{kode_jam_kerja}', [\App\Http\Controllers\JamkerjaController::class, 'update'])->middleware('permission:jamkerja.edit')->name('jamkerja.update');
        Route::delete('jamkerja/{kode_jam_kerja}', [\App\Http\Controllers\JamkerjaController::class, 'destroy'])->middleware('permission:jamkerja.delete')->name('jamkerja.destroy');
    });

    // Cabang Management
    Route::middleware(['permission:cabang.index'])->group(function () {
        Route::get('cabang', [\App\Http\Controllers\CabangController::class, 'index'])->name('cabang.index');
        Route::post('cabang', [\App\Http\Controllers\CabangController::class, 'store'])->middleware('permission:cabang.create')->name('cabang.store');
        Route::put('cabang/{kode_cabang}', [\App\Http\Controllers\CabangController::class, 'update'])->middleware('permission:cabang.edit')->name('cabang.update');
        Route::delete('cabang/{kode_cabang}', [\App\Http\Controllers\CabangController::class, 'destroy'])->middleware('permission:cabang.delete')->name('cabang.destroy');
    });

    // Payroll Denda
    Route::get('denda', [\App\Http\Controllers\DendaController::class, 'index'])->name('denda.index');
    Route::post('denda', [\App\Http\Controllers\DendaController::class, 'store'])->name('denda.store');
    Route::put('denda/{id}', [\App\Http\Controllers\DendaController::class, 'update'])->name('denda.update');
    Route::delete('denda/{id}', [\App\Http\Controllers\DendaController::class, 'destroy'])->name('denda.destroy');

    // Payroll Jenis Tunjangan
    Route::get('jenis-tunjangan', [\App\Http\Controllers\JenistunjanganController::class, 'index'])->name('jenis-tunjangan.index');
    Route::post('jenis-tunjangan', [\App\Http\Controllers\JenistunjanganController::class, 'store'])->name('jenis-tunjangan.store');
    Route::put('jenis-tunjangan/{kode}', [\App\Http\Controllers\JenistunjanganController::class, 'update'])->name('jenis-tunjangan.update');
    Route::delete('jenis-tunjangan/{kode}', [\App\Http\Controllers\JenistunjanganController::class, 'destroy'])->name('jenis-tunjangan.destroy');

    // Payroll Gaji Pokok
    Route::get('gaji-pokok', [\App\Http\Controllers\GajipokokController::class, 'index'])->name('gaji-pokok.index');
    Route::post('gaji-pokok', [\App\Http\Controllers\GajipokokController::class, 'store'])->name('gaji-pokok.store');
    Route::put('gaji-pokok/{kode}', [\App\Http\Controllers\GajipokokController::class, 'update'])->name('gaji-pokok.update');
    Route::delete('gaji-pokok/{kode}', [\App\Http\Controllers\GajipokokController::class, 'destroy'])->name('gaji-pokok.destroy');

    // Payroll BPJS Kesehatan
    Route::get('bpjs-kesehatan', [\App\Http\Controllers\BpjskesehatanController::class, 'index'])->name('bpjs-kesehatan.index');
    Route::post('bpjs-kesehatan', [\App\Http\Controllers\BpjskesehatanController::class, 'store'])->name('bpjs-kesehatan.store');
    Route::put('bpjs-kesehatan/{kode}', [\App\Http\Controllers\BpjskesehatanController::class, 'update'])->name('bpjs-kesehatan.update');
    Route::delete('bpjs-kesehatan/{kode}', [\App\Http\Controllers\BpjskesehatanController::class, 'destroy'])->name('bpjs-kesehatan.destroy');

    // Payroll BPJS Ketenagakerjaan
    Route::get('bpjs-ketenagakerjaan', [\App\Http\Controllers\BpjstenagakerjaController::class, 'index'])->name('bpjs-ketenagakerjaan.index');
    Route::post('bpjs-ketenagakerjaan', [\App\Http\Controllers\BpjstenagakerjaController::class, 'store'])->name('bpjs-ketenagakerjaan.store');
    Route::put('bpjs-ketenagakerjaan/{kode}', [\App\Http\Controllers\BpjstenagakerjaController::class, 'update'])->name('bpjs-ketenagakerjaan.update');
    Route::delete('bpjs-ketenagakerjaan/{kode}', [\App\Http\Controllers\BpjstenagakerjaController::class, 'destroy'])->name('bpjs-ketenagakerjaan.destroy');

    // Payroll Tunjangan
    Route::get('tunjangan', [\App\Http\Controllers\TunjanganController::class, 'index'])->name('tunjangan.index');
    Route::post('tunjangan', [\App\Http\Controllers\TunjanganController::class, 'store'])->name('tunjangan.store');
    Route::put('tunjangan/{kode}', [\App\Http\Controllers\TunjanganController::class, 'update'])->name('tunjangan.update');
    Route::delete('tunjangan/{kode}', [\App\Http\Controllers\TunjanganController::class, 'destroy'])->name('tunjangan.destroy');

    // Payroll Penyesuaian Gaji
    Route::get('penyesuaian-gaji', [\App\Http\Controllers\PenyesuaiangajiController::class, 'index'])->name('penyesuaian-gaji.index');
    Route::post('penyesuaian-gaji', [\App\Http\Controllers\PenyesuaiangajiController::class, 'store'])->name('penyesuaian-gaji.store');
    Route::put('penyesuaian-gaji/{kode}', [\App\Http\Controllers\PenyesuaiangajiController::class, 'update'])->name('penyesuaian-gaji.update');
    Route::delete('penyesuaian-gaji/{kode}', [\App\Http\Controllers\PenyesuaiangajiController::class, 'destroy'])->name('penyesuaian-gaji.destroy');
    Route::get('penyesuaian-gaji/set-karyawan/{kode}', [\App\Http\Controllers\PenyesuaiangajiController::class, 'setkaryawan'])->name('penyesuaian-gaji.setkaryawan');
    Route::post('penyesuaian-gaji/store-karyawan/{kode}', [\App\Http\Controllers\PenyesuaiangajiController::class, 'storekaryawan'])->name('penyesuaian-gaji.storekaryawan');
    Route::put('penyesuaian-gaji/update-karyawan/{kode}/{nik}', [\App\Http\Controllers\PenyesuaiangajiController::class, 'updatekaryawan'])->name('penyesuaian-gaji.updatekaryawan');
    Route::delete('penyesuaian-gaji/destroy-karyawan/{kode}/{nik}', [\App\Http\Controllers\PenyesuaiangajiController::class, 'destroykaryawan'])->name('penyesuaian-gaji.destroykaryawan');

    // Payroll Slip Gaji
    Route::get('slip-gaji', [\App\Http\Controllers\SlipgajiController::class, 'index'])->name('slip-gaji.index');
    Route::post('slip-gaji', [\App\Http\Controllers\SlipgajiController::class, 'store'])->name('slip-gaji.store');
    Route::put('slip-gaji/{kode}', [\App\Http\Controllers\SlipgajiController::class, 'update'])->name('slip-gaji.update');
    Route::delete('slip-gaji/{kode}', [\App\Http\Controllers\SlipgajiController::class, 'destroy'])->name('slip-gaji.destroy');

    // Payroll Slip Gaji Harian
    Route::post('slip-gaji-harian', [\App\Http\Controllers\SlipgajiHarianController::class, 'store'])->name('slip-gaji-harian.store');
    Route::get('slip-gaji-harian/{kode}', [\App\Http\Controllers\SlipgajiHarianController::class, 'show'])->name('slip-gaji-harian.show');
    Route::put('slip-gaji-harian/{kode}', [\App\Http\Controllers\SlipgajiHarianController::class, 'update'])->name('slip-gaji-harian.update');
    Route::delete('slip-gaji-harian/{kode}', [\App\Http\Controllers\SlipgajiHarianController::class, 'destroy'])->name('slip-gaji-harian.destroy');
    Route::get('slip-gaji-harian/cetak', [\App\Http\Controllers\SlipgajiHarianController::class, 'cetak'])->name('slip-gaji-harian.cetak');

    // Payroll PPh 21
    Route::get('pph21', [\App\Http\Controllers\Pph21Controller::class, 'index'])->name('pph21.index');
    Route::post('pph21/update-setting', [\App\Http\Controllers\Pph21Controller::class, 'updateSetting'])->name('pph21.update-setting');
    Route::get('pph21/formula', [\App\Http\Controllers\Pph21Controller::class, 'formula'])->name('pph21.formula');
    Route::post('pph21/formula/store', [\App\Http\Controllers\Pph21Controller::class, 'storeFormula'])->name('pph21.formula.store');
    Route::post('pph21/formula/toggle/{id}', [\App\Http\Controllers\Pph21Controller::class, 'toggleFormula'])->name('pph21.formula.toggle');
    Route::delete('pph21/formula/delete/{id}', [\App\Http\Controllers\Pph21Controller::class, 'destroyFormula'])->name('pph21.formula.delete');
    Route::post('pph21/formula/reorder', [\App\Http\Controllers\Pph21Controller::class, 'reorderFormula'])->name('pph21.formula.reorder');
    Route::get('pph21/ter', [\App\Http\Controllers\Pph21Controller::class, 'terRates'])->name('pph21.ter');
    Route::put('pph21/ter/update/{id}', [\App\Http\Controllers\Pph21Controller::class, 'updateTerRate'])->name('pph21.ter.update');
    Route::get('pph21/progresif', [\App\Http\Controllers\Pph21Controller::class, 'progresifRates'])->name('pph21.progresif');
    Route::put('pph21/progresif/update/{id}', [\App\Http\Controllers\Pph21Controller::class, 'updateProgresifRate'])->name('pph21.progresif.update');
    Route::get('pph21/simulasi', [\App\Http\Controllers\Pph21Controller::class, 'simulasi'])->name('pph21.simulasi');
    Route::post('pph21/simulasi/hitung', [\App\Http\Controllers\Pph21Controller::class, 'hitungSimulasi'])->name('pph21.simulasi.hitung');
    Route::post('pph21/generate', [\App\Http\Controllers\Pph21Controller::class, 'generateSlip'])->name('pph21.generate');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';