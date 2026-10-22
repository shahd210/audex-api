<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EvidenceController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkflowController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {

        // Users
        Route::apiResource('users', UserController::class);

        // Recommendations
        Route::get('recommendations', [RecommendationController::class, 'index']);
        Route::post('recommendations', [RecommendationController::class, 'store']);
        Route::get('recommendations/{recommendation}', [RecommendationController::class, 'show']);
        Route::get('recommendations/{recommendation}/workflows', [RecommendationController::class, 'workflows']);

        // Workflows
        Route::apiResource('workflows', WorkflowController::class);
        Route::post('workflows/{workflow}/transition', [WorkflowController::class, 'transition']);

        // Tasks
        Route::get('workflows/{workflow}/tasks', [TaskController::class, 'indexForWorkflow']);
        Route::post('workflows/{workflow}/tasks', [TaskController::class, 'store']);
        Route::get('tasks/my', [TaskController::class, 'myTasks']);
        Route::get('tasks/{task}', [TaskController::class, 'show']);
        Route::patch('tasks/{task}', [TaskController::class, 'update']);
        Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
        Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);

        // Evidence
        Route::apiResource('evidences', EvidenceController::class)->except(['update']);
        Route::post('evidences/{evidence}/tasks/{task}/link', [EvidenceController::class, 'linkToTask']);
        Route::delete('evidences/{evidence}/tasks/{task}/unlink', [EvidenceController::class, 'unlinkFromTask']);
    });
});
