<?php

namespace App\Enums;

enum EvidenceState: string
{
    case Verified = 'verified';
    case Planned = 'planned';
    case Missing = 'missing';
    case Expired = 'expired';
}
