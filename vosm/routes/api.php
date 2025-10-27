<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InspectionTemplateController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\InspectionDashboardController;
use App\Http\Controllers\InspectionReportController;

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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Inspection Module Routes
Route::prefix('v1')->middleware(['web', 'auth:sanctum'])->group(function () {
    
    // Inspection Templates
    Route::apiResource('inspection-templates', InspectionTemplateController::class);
    Route::post('inspection-templates/{id}/duplicate', [InspectionTemplateController::class, 'duplicate']);
    
    // Inspections
    Route::apiResource('inspections', InspectionController::class);
    Route::post('inspections/{id}/submit', [InspectionController::class, 'submit']);
    Route::post('inspections/{id}/approve', [InspectionController::class, 'approve']);
    Route::post('inspections/{id}/reject', [InspectionController::class, 'reject']);
    
    // Vehicles
    Route::apiResource('vehicles', VehicleController::class);
    Route::get('vehicles/search', [VehicleController::class, 'search']);
    
    // Dashboard
    Route::get('inspection-dashboard', [InspectionDashboardController::class, 'index']);
    
    // Reports
    Route::get('inspections/{id}/report', [InspectionReportController::class, 'generate']);
    Route::post('inspections/{id}/email', [InspectionReportController::class, 'email']);
    Route::post('inspections/{id}/share', [InspectionReportController::class, 'share']);
});

