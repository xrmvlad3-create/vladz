<?php

namespace App\Http\Middleware;

use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogMiddleware
{
    public function __construct(private AuditLogService $auditLogService)
    {
    }

    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only log for authenticated users
        if (Auth::check()) {
            $this->logRequest($request, $response);
        }

        return $response;
    }

    private function logRequest(Request $request, $response): void
    {
        $user = Auth::user();
        $method = $request->method();
        $path = $request->path();
        $statusCode = $response->getStatusCode();

        // Determine action type based on HTTP method and path
        $action = $this->determineAction($method, $path);

        // Get sensitive data (excluding passwords)
        $requestData = $request->except([
            'password', 'password_confirmation', 'token', 'current_password',
            'two_factor_code', 'recovery_code'
        ]);

        $this->auditLogService->log(
            $user,
            $action,
            "HTTP {$method} request to {$path}",
            [
                'http_method' => $method,
                'path' => $path,
                'status_code' => $statusCode,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_data' => !empty($requestData) ? $requestData : null,
                'response_status' => $this->getResponseStatus($statusCode)
            ]
        );
    }

    private function determineAction(string $method, string $path): string
    {
        $path = strtolower($path);

        // API endpoints
        if (str_contains($path, 'api/')) {
            if (str_contains($path, 'medical-conditions')) {
                return match($method) {
                    'GET' => 'medical_condition_viewed',
                    'POST' => 'medical_condition_created',
                    'PUT', 'PATCH' => 'medical_condition_updated',
                    'DELETE' => 'medical_condition_deleted',
                    default => 'medical_condition_accessed'
                };
            }

            if (str_contains($path, 'courses')) {
                return match($method) {
                    'GET' => 'course_viewed',
                    'POST' => 'course_created',
                    'PUT', 'PATCH' => 'course_updated',
                    'DELETE' => 'course_deleted',
                    default => 'course_accessed'
                };
            }

            if (str_contains($path, 'ai-assistant')) {
                return 'ai_interaction';
            }

            if (str_contains($path, 'auth')) {
                return 'authentication_activity';
            }
        }

        return 'general_activity';
    }

    private function getResponseStatus(int $statusCode): string
    {
        return match(true) {
            $statusCode >= 200 && $statusCode < 300 => 'success',
            $statusCode >= 300 && $statusCode < 400 => 'redirect',
            $statusCode >= 400 && $statusCode < 500 => 'client_error',
            $statusCode >= 500 => 'server_error',
            default => 'unknown'
        };
    }
}
