<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InspectionTemplateController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\InspectionDashboardController;
use App\Http\Controllers\InspectionReportController;
use App\Http\Controllers\InspectionRtoDetailController;
use App\Http\Controllers\InspectionReportLayoutController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\ExpenseTemplateController;
use App\Http\Controllers\Api\GatePassApprovalController;
use App\Http\Controllers\Api\ExpenseApprovalController;
use App\Http\Controllers\Api\VisitorGatePassController;
use App\Http\Controllers\Api\VehicleEntryPassController;
use App\Http\Controllers\Api\VehicleExitPassController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\OverdueFlagController;

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
    
    // Projects (for expense linking)
    Route::get('projects', [ProjectController::class, 'index']);
    Route::get('projects/{id}', [ProjectController::class, 'show']);
    
    // Assets (for expense linking - vehicles/equipment)
    Route::get('assets', [AssetController::class, 'index']);
    Route::get('assets/{id}', [AssetController::class, 'show']);
    
    // Expense Templates
    Route::get('expense-templates', [ExpenseTemplateController::class, 'index']);
    Route::get('expense-templates/{id}', [ExpenseTemplateController::class, 'show']);
    
    // Expenses (CRUD + special endpoints)
    Route::apiResource('expenses', \App\Http\Controllers\ExpenseController::class);
    Route::get('expenses/{id}/audit', [\App\Http\Controllers\ExpenseController::class, 'getAudit']);
    Route::patch('expenses/{id}/reassign', [\App\Http\Controllers\ExpenseController::class, 'reassign']);
    Route::get('expenses/vehicle-kpis', [\App\Http\Controllers\ExpenseController::class, 'getVehicleKPIs']);
    
    // User Management (with capability matrix)
    Route::get('users', [\App\Http\Controllers\UserController::class, 'index']);
    Route::get('users/{id}', [\App\Http\Controllers\UserController::class, 'show']);
    Route::get('users/{id}/permissions', [\App\Http\Controllers\UserController::class, 'permissions']);
    Route::post('users', [\App\Http\Controllers\UserController::class, 'store']);
    Route::put('users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
    Route::delete('users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
    
    // User Activity
    Route::get('users/activity', [\App\Http\Controllers\UserController::class, 'activityLogs']);
    Route::get('users/activity/statistics', [\App\Http\Controllers\UserController::class, 'activityStatistics']);
    Route::get('users/permission-changes', [\App\Http\Controllers\UserController::class, 'permissionChanges']);
    
    // Bulk User Operations
    Route::post('users/bulk-assign-capabilities', [\App\Http\Controllers\UserController::class, 'bulkAssignCapabilities']);
    Route::post('users/bulk-activate', [\App\Http\Controllers\UserController::class, 'bulkActivate']);
    Route::post('users/bulk-deactivate', [\App\Http\Controllers\UserController::class, 'bulkDeactivate']);
    Route::post('users/bulk-assign-role', [\App\Http\Controllers\UserController::class, 'bulkAssignRole']);
    
    // Dashboard
    Route::get('inspection-dashboard', [InspectionDashboardController::class, 'index']);
    Route::get('dashboard', [InspectionDashboardController::class, 'index']); // Alias for compatibility
    
    // Alerts
    Route::get('alerts/statistics', [AlertController::class, 'statistics']);
    Route::post('alerts/detect-anomalies', [AlertController::class, 'detectAnomalies']);
    Route::apiResource('alerts', AlertController::class);
    Route::patch('alerts/{id}/acknowledge', [AlertController::class, 'acknowledge']);
    Route::patch('alerts/{id}/resolve', [AlertController::class, 'resolve']);
    Route::patch('alerts/{id}/dismiss', [AlertController::class, 'dismiss']);
    Route::post('alerts/bulk-acknowledge', [AlertController::class, 'bulkAcknowledge']);
    Route::post('alerts/bulk-resolve', [AlertController::class, 'bulkResolve']);
    Route::post('alerts/bulk-dismiss', [AlertController::class, 'bulkDismiss']);
    
    // Overdue Flags
    Route::get('overdue-flags', [OverdueFlagController::class, 'index']);
    Route::get('overdue-flags/{itemType}/{itemId}', [OverdueFlagController::class, 'getItemFlags']);
    Route::patch('overdue-flags/{id}/resolve', [OverdueFlagController::class, 'resolve']);
    
    // Components (Batteries, Tyres, Spare Parts)
    Route::get('components', [\App\Http\Controllers\ComponentController::class, 'index']);
    Route::post('components', [\App\Http\Controllers\ComponentController::class, 'store']);
    Route::get('components/{type}/{id}', [\App\Http\Controllers\ComponentController::class, 'show']);
    Route::patch('components/{type}/{id}', [\App\Http\Controllers\ComponentController::class, 'update']);
    Route::delete('components/{type}/{id}', [\App\Http\Controllers\ComponentController::class, 'destroy']);
    Route::post('components/{type}/{id}/transfer', [\App\Http\Controllers\ComponentController::class, 'transfer']);
    Route::post('components/{type}/{id}/remove', [\App\Http\Controllers\ComponentController::class, 'remove']);
    Route::post('components/{type}/{id}/install', [\App\Http\Controllers\ComponentController::class, 'install']);
    Route::get('components/transfers/pending', [\App\Http\Controllers\ComponentController::class, 'pendingTransfers']);
    Route::post('components/transfers/{transferId}/approve', [\App\Http\Controllers\ComponentController::class, 'approveTransfer']);
    Route::post('components/transfers/{transferId}/reject', [\App\Http\Controllers\ComponentController::class, 'rejectTransfer']);
    Route::get('components/{type}/{id}/maintenance', [\App\Http\Controllers\ComponentController::class, 'getMaintenance']);
    Route::post('components/{type}/{id}/maintenance', [\App\Http\Controllers\ComponentController::class, 'createMaintenance']);
    Route::patch('components/maintenance/{maintenanceId}', [\App\Http\Controllers\ComponentController::class, 'updateMaintenance']);
    Route::delete('components/maintenance/{maintenanceId}', [\App\Http\Controllers\ComponentController::class, 'deleteMaintenance']);
    Route::get('components/cost-analysis', [\App\Http\Controllers\ComponentController::class, 'costAnalysis']);
    Route::get('components/health-dashboard', [\App\Http\Controllers\ComponentController::class, 'healthDashboard']);
    
    // Notifications
    Route::get('notifications/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
    Route::patch('notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::apiResource('notifications', \App\Http\Controllers\NotificationController::class)->only(['index', 'destroy']);
    Route::patch('notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    
    // Reports
    Route::get('inspections/{id}/report', [InspectionReportController::class, 'generate']);
    Route::post('inspections/{id}/email', [InspectionReportController::class, 'email']);
    Route::post('inspections/{id}/share', [InspectionReportController::class, 'share']);
    
    // RTO Details
    Route::get('inspections/{inspectionId}/rto-details', [InspectionRtoDetailController::class, 'show']);
    Route::post('inspections/{inspectionId}/rto-details', [InspectionRtoDetailController::class, 'store']);
    Route::post('inspections/{inspectionId}/rto-details/verify', [InspectionRtoDetailController::class, 'verify']);
    
    // Report Layouts
    Route::get('inspections/{inspectionId}/report-layout', [InspectionReportLayoutController::class, 'show']);
    Route::get('inspections/{inspectionId}/report-layout/{layoutId}', [InspectionReportLayoutController::class, 'show']);
    Route::post('inspections/{inspectionId}/report-layout', [InspectionReportLayoutController::class, 'store']);
    
    
});

// Gate Pass Record Sync Route (unified endpoint for QR payload generation)
Route::prefix('gate-pass-records')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\GatePassRecordController::class, 'index']);
    Route::get('stats', [\App\Http\Controllers\Api\GatePassRecordController::class, 'stats']);
    Route::post('sync', [\App\Http\Controllers\Api\GatePassRecordController::class, 'sync']);
});

// Gate Pass Routes (outside v1 prefix as frontend calls them directly)
Route::prefix('visitor-gate-passes')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [VisitorGatePassController::class, 'index']);
    Route::post('/', [VisitorGatePassController::class, 'store']);
    Route::get('{id}', [VisitorGatePassController::class, 'show']);
    Route::post('{id}/entry', [VisitorGatePassController::class, 'entry']);
    Route::post('{id}/exit', [VisitorGatePassController::class, 'exit']);
});

Route::prefix('vehicle-entry-passes')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [VehicleEntryPassController::class, 'index']);
    Route::post('/', [VehicleEntryPassController::class, 'store']);
});

Route::prefix('vehicle-exit-passes')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/', [VehicleExitPassController::class, 'index']);
    Route::post('/', [VehicleExitPassController::class, 'store']);
    Route::get('{id}', [VehicleExitPassController::class, 'show']);
    Route::put('{id}', [VehicleExitPassController::class, 'update']);
    Route::post('{id}/entry', [VehicleExitPassController::class, 'entry']);
    Route::post('{id}/exit', [VehicleExitPassController::class, 'exit']);
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

// Gate Pass Validation Routes (for guards to validate QR codes)
Route::prefix('gate-pass-validation')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::post('validate', [\App\Http\Controllers\Api\GatePassValidationController::class, 'validate']);
    Route::get('verify', [\App\Http\Controllers\Api\GatePassValidationController::class, 'verify']);
    Route::post('entry', [\App\Http\Controllers\Api\GatePassValidationController::class, 'entry']);
    Route::post('exit', [\App\Http\Controllers\Api\GatePassValidationController::class, 'exit']);
});

