<?php

namespace App\Enums;

enum WorkflowType: string
{
    case Complaint = 'complaint';
    case Performance = 'performance';
    case BusDelay = 'bus_delay';
    case InventoryShortage = 'inventory_shortage';
    case FeeRisk = 'fee_risk';
    case Workload = 'workload';
    case SafetyIncident = 'safety_incident';
    case Other = 'other';
}
