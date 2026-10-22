<?php

namespace App\Enums;

enum RecommendationStatus: string
{
    case Open = 'open';
    case Linked = 'linked';
    case Dismissed = 'dismissed';
    case Expired = 'expired';
}
