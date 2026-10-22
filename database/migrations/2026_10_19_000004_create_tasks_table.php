<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assignee_id')->constrained('users');
            $table->date('due_date');
            $table->string('kpi_name')->nullable();
            $table->decimal('kpi_target', 10, 2)->nullable();
            $table->string('kpi_unit')->nullable();
            $table->decimal('kpi_actual', 10, 2)->nullable();
            $table->enum('status', ['todo', 'in_progress', 'blocked', 'done', 'cancelled'])->default('todo');
            $table->text('progress_note')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('workflow_id');
            $table->index('assignee_id');
            $table->index('status');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
