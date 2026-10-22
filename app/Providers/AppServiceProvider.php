<?php

namespace App\Providers;

use App\Models\Evidence;
use App\Models\Recommendation;
use App\Models\Task;
use App\Models\User;
use App\Models\Workflow;
use App\Policies\EvidencePolicy;
use App\Policies\RecommendationPolicy;
use App\Policies\TaskPolicy;
use App\Policies\UserPolicy;
use App\Policies\WorkflowPolicy;
use App\Services\AuditService;
use App\Services\EvidenceService;
use App\Services\TaskService;
use App\Services\WorkflowService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AuditService::class);
        $this->app->singleton(WorkflowService::class);
        $this->app->singleton(TaskService::class);
        $this->app->singleton(EvidenceService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Workflow::class, WorkflowPolicy::class);
        Gate::policy(Recommendation::class, RecommendationPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(Evidence::class, EvidencePolicy::class);
    }
}
