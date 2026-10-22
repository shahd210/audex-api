<?php

namespace App\Enums;

enum ExtractionStatus: string
{
    case Pending = 'pending';
    case Extracted = 'extracted';
    case Failed = 'failed';
    case NotApplicable = 'not_applicable';
}
