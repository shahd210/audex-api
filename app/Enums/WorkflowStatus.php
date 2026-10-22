<?php

namespace App\Enums;

enum WorkflowStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case InReview = 'in_review';
    case EvidenceRequested = 'evidence_requested';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function isTerminal(): bool
    {
        return in_array($this, [self::Rejected, self::Completed, self::Cancelled]);
    }

    public function allowedTransitions(): array
    {
        return match($this) {
            self::Draft => [self::Submitted, self::Cancelled],
            self::Submitted => [self::InReview, self::Cancelled],
            self::InReview => [self::Approved, self::Rejected, self::EvidenceRequested],
            self::EvidenceRequested => [self::InReview, self::Cancelled],
            self::Approved => [self::InProgress, self::Cancelled],
            self::InProgress => [self::Completed, self::Cancelled],
            self::Rejected, self::Completed, self::Cancelled => [],
        };
    }

    public function canTransitionTo(WorkflowStatus $to): bool
    {
        return in_array($to, $this->allowedTransitions());
    }
}
