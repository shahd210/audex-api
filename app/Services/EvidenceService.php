<?php

namespace App\Services;

use App\Enums\EvidenceType;
use App\Enums\ExtractionStatus;
use App\Enums\IndexStatus;
use App\Models\Evidence;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EvidenceService
{
    public function __construct(private readonly AuditService $audit) {}

    public function create(array $data, User $user): Evidence
    {
        return DB::transaction(function () use ($data, $user) {
            $type = EvidenceType::from($data['type']);

            $fileData = [];
            if ($type === EvidenceType::File && isset($data['file'])) {
                /** @var UploadedFile $file */
                $file = $data['file'];
                $path = Storage::disk('local')->putFile('evidences', $file);
                $fileData = [
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size_bytes' => $file->getSize(),
                    'extraction_status' => ExtractionStatus::Pending->value,
                    'index_status' => IndexStatus::Pending->value,
                ];
            } else {
                $fileData = [
                    'extraction_status' => ExtractionStatus::NotApplicable->value,
                    'index_status' => IndexStatus::NotApplicable->value,
                ];
            }

            $evidence = Evidence::create(array_merge(
                $data,
                $fileData,
                ['uploaded_by' => $user->id]
            ));

            $this->audit->logCreated($evidence);

            return $evidence->load(['uploader', 'workspace']);
        });
    }

    public function linkToTask(Evidence $evidence, Task $task, User $user): void
    {
        DB::transaction(function () use ($evidence, $task, $user) {
            if ($evidence->tasks()->where('task_id', $task->id)->exists()) {
                return; // already linked
            }

            $evidence->tasks()->attach($task->id, ['linked_by' => $user->id]);
            $this->audit->logEvidenceLinked($evidence->id, $task->id);
        });
    }

    public function unlinkFromTask(Evidence $evidence, Task $task): void
    {
        $evidence->tasks()->detach($task->id);
    }
}
