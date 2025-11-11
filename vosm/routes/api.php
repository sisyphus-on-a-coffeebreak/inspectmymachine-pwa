<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InspectionTemplateController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\InspectionDashboardController;
use App\Http\Controllers\InspectionReportController;
use App\Http\Controllers\Api\GatePassApprovalController;
use App\Http\Controllers\Api\ExpenseApprovalController;
use App\Http\Controllers\Api\VisitorGatePassController;
use App\Http\Controllers\Api\VehicleEntryPassController;
use App\Http\Controllers\Api\VehicleExitPassController;

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

// Gate Pass Routes (outside v1 prefix as frontend calls them directly)
Route::prefix('visitor-gate-passes')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [VisitorGatePassController::class, 'index']);
    Route::post('/', [VisitorGatePassController::class, 'store']);
});

Route::prefix('vehicle-entry-passes')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [VehicleEntryPassController::class, 'index']);
    Route::post('/', [VehicleEntryPassController::class, 'store']);
});

Route::prefix('vehicle-exit-passes')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [VehicleExitPassController::class, 'index']);
    Route::post('/', [VehicleExitPassController::class, 'store']);
});

// Gate Pass Approval Routes (outside v1 prefix)
Route::prefix('gate-pass-approval')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('pending', [GatePassApprovalController::class, 'pending']);
    Route::get('pass-details/{passId}', [GatePassApprovalController::class, 'passDetails']);
    Route::get('history/{approvalRequestId}', [GatePassApprovalController::class, 'history']);
    Route::post('approve/{approvalRequestId}', [GatePassApprovalController::class, 'approve']);
    Route::post('reject/{approvalRequestId}', [GatePassApprovalController::class, 'reject']);
    Route::post('escalate/{approvalRequestId}', [GatePassApprovalController::class, 'escalate']);
});

// Expense Approval Routes (outside v1 prefix)
Route::prefix('expense-approval')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('pending', [ExpenseApprovalController::class, 'pending']);
    Route::get('stats', [ExpenseApprovalController::class, 'stats']);
    Route::post('approve/{expenseId}', [ExpenseApprovalController::class, 'approve']);
    Route::post('reject/{expenseId}', [ExpenseApprovalController::class, 'reject']);
    Route::post('bulk-approve', [ExpenseApprovalController::class, 'bulkApprove']);
    Route::post('bulk-reject', [ExpenseApprovalController::class, 'bulkReject']);
});

