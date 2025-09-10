<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request as RequestFacade;

class AuditLogService
{
    /**
     * Persist an audit log entry.
     */
    public function log(?User $user, string $action, string $description, array $metadata = [], array $changes = []): void
    {
        $request = RequestFacade::instance();

        AuditLog::create([
            'user_id'     => $user?->id,
            'action'      => $action,
            'description' => $description,
            'model_type'  => $metadata['model_type'] ?? null,
            'model_id'    => $metadata['model_id'] ?? null,
            'old_values'  => $changes['old'] ?? null,
            'new_values'  => $changes['new'] ?? null,
            'metadata'    => $metadata,
            'ip_address'  => $metadata['ip_address'] ?? ($request?->ip() ?? '0.0.0.0'),
            'user_agent'  => $metadata['user_agent'] ?? ($request?->userAgent() ?? null),
            'severity'    => $metadata['severity'] ?? 'info',
            'created_at'  => now(),
        ]);
    }
}