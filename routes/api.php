<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationApiController;

// Auth routes - prefixed with /auth to avoid conflict with Fortify
Route::prefix('auth')->group(function () {
    // Public routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationApiController::class, 'index']);
        Route::get('/unread-count', [NotificationApiController::class, 'unreadCount']);
        Route::post('/{id}/mark-as-read', [NotificationApiController::class, 'markAsRead']);
        Route::post('/mark-all-as-read', [NotificationApiController::class, 'markAllAsRead']);
    });
});