<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Ceo = 'ceo';
    case Academic = 'academic';
    case Finance = 'finance';
    case Hr = 'hr';
    case Operations = 'operations';
    case Procurement = 'procurement';

    public function label(): string
    {
        return match($this) {
            self::Admin => 'Administrator',
            self::Ceo => 'CEO',
            self::Academic => 'Academic',
            self::Finance => 'Finance',
            self::Hr => 'Human Resources',
            self::Operations => 'Operations',
            self::Procurement => 'Procurement',
        };
    }

    public static function departmentRoles(): array
    {
        return [
            self::Academic,
            self::Finance,
            self::Hr,
            self::Operations,
            self::Procurement,
        ];
    }

    public function isDepartmentRole(): bool
    {
        return in_array($this, self::departmentRoles());
    }
}
