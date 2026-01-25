<?php

/**
 * Task Management API Routes
 * 
 * Add these routes to your Laravel routes/api.php file
 * 
 * Required middleware:
 * - auth:sanctum (authentication)
 * - permission:workflow,read (for read operations)
 * - permission:workflow,create (for create operations)
 * - permission:workflow,update (for update operations)
 */

use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Task routes group
Route::middleware(['auth:sanctum'])->prefix('v1/tasks')->group(function () {
    
    // List tasks (with filters)
    Route::get('/', [TaskController::class, 'index'])
        ->middleware('permission:workflow,read');
    
    // Get single task
    Route::get('/{id}', [TaskController::class, 'show'])
        ->middleware('permission:workflow,read');
    
    // Create task
    Route::post('/', [TaskController::class, 'store'])
        ->middleware('permission:workflow,create');
    
    // Update task status
    Route::patch('/{id}/status', [TaskController::class, 'updateStatus'])
        ->middleware('permission:workflow,update');
    
    // Assign task
    Route::post('/{id}/assign', [TaskController::class, 'assign'])
        ->middleware('permission:workflow,update');
    
    // Add comment
    Route::post('/{id}/comments', [TaskController::class, 'addComment'])
        ->middleware('permission:workflow,read');
});




