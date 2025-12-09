<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Include v2 routes
Route::prefix('v2')->group(base_path('routes/api/v2.php'));

// Authentication routes (no auth required)
Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout'])->middleware(['auth:sanctum']);

// User endpoint (auth required)
Route::middleware(['auth:sanctum'])->get('/user', [\App\Http\Controllers\Api\AuthController::class, 'user']);

// Analytics routes (no auth required for vitals)
Route::prefix('v1')->group(function () {
    Route::post('/analytics/vitals', [\App\Http\Controllers\Api\AnalyticsController::class, 'storeVitals']);
});

// V1 API routes (auth required)
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    // Inspections endpoints
    Route::get('/inspections', [\App\Http\Controllers\Api\InspectionController::class, 'index']);
    Route::post('/inspections', [\App\Http\Controllers\Api\InspectionController::class, 'store']);
    Route::get('/inspections/{id}', [\App\Http\Controllers\Api\InspectionController::class, 'show']);
    
    // Report Branding endpoints
    Route::get('/settings/report-branding', [\App\Http\Controllers\Api\ReportBrandingController::class, 'show']);
    Route::post('/settings/report-branding', [\App\Http\Controllers\Api\ReportBrandingController::class, 'store']);
    Route::post('/settings/report-branding/logo', [\App\Http\Controllers\Api\ReportBrandingController::class, 'uploadLogo']);
    Route::delete('/settings/report-branding/logo', [\App\Http\Controllers\Api\ReportBrandingController::class, 'deleteLogo']);
    
    // Users endpoints
    Route::get('/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
});

// Gate Pass Approval routes (legacy v1-style endpoints for compatibility)
Route::middleware(['auth:sanctum'])->prefix('gate-pass-approval')->group(function () {
    Route::get('/pending', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'pending']);
    Route::get('/pass-details/{passId}', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'passDetails']);
    Route::get('/history', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'history']);
    Route::get('/comments/{approvalId}', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'getComments']);
    Route::post('/comments/{approvalId}', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'addComment']);
    Route::post('/approve/{approvalId}', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'approve']);
    Route::post('/reject/{approvalId}', [\App\Http\Controllers\Api\GatePassApprovalController::class, 'reject']);
});
