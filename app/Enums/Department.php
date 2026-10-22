<?php

namespace App\Enums;

enum Department: string
{
    case Academic = 'academic';
    case Finance = 'finance';
    case Hr = 'hr';
    case Operations = 'operations';
    case Procurement = 'procurement';
}
