<?php

namespace App\Enums;

enum RecommendationSource: string
{
    case RuleEngine = 'rule_engine';
    case Ai = 'ai';
    case Manual = 'manual';
}
