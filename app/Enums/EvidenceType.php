<?php

namespace App\Enums;

enum EvidenceType: string
{
    case File = 'file';
    case Note = 'note';
    case Link = 'link';
}
