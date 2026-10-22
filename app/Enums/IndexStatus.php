<?php

namespace App\Enums;

enum IndexStatus: string
{
    case Pending = 'pending';
    case Indexed = 'indexed';
    case Failed = 'failed';
    case NotApplicable = 'not_applicable';
}
