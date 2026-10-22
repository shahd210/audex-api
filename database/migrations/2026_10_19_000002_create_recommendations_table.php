<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->enum('department', ['academic', 'finance', 'hr', 'operations', 'procurement']);
            $table->string('title');
            $table->string('summary');
            $table->text('details');
            $table->enum('priority', ['low', 'medium', 'high', 'critical']);
            $table->enum('status', ['open', 'linked', 'dismissed', 'expired'])->default('open');
            $table->enum('source', ['rule_engine', 'ai', 'manual']);
            $table->decimal('confidence_score', 5, 2)->nullable();
            $table->string('source_reference')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('workspace_id');
            $table->index('department');
            $table->index('status');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendations');
    }
};
