<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->enum('department', ['academic', 'finance', 'hr', 'operations', 'procurement']);
            $table->enum('type', ['file', 'note', 'link']);
            $table->string('title');
            $table->text('note')->nullable();
            $table->string('file_path')->nullable();
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->enum('extraction_status', ['pending', 'extracted', 'failed', 'not_applicable'])->default('pending');
            $table->enum('index_status', ['pending', 'indexed', 'failed', 'not_applicable'])->default('pending');
            $table->enum('evidence_state', ['verified', 'planned', 'missing', 'expired'])->default('planned');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('workspace_id');
            $table->index('department');
            $table->index('uploaded_by');
        });

        Schema::create('evidence_task', function (Blueprint $table) {
            $table->foreignId('evidence_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('linked_by')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['evidence_id', 'task_id']);
            $table->primary(['evidence_id', 'task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evidence_task');
        Schema::dropIfExists('evidences');
    }
};
