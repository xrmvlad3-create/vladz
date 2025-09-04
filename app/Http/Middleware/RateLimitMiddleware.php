<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitMiddleware
{
    public function handle(Request $request, Closure $next, string $key = 'api', int $maxAttempts = 60, int $decayMinutes = 1)
    {
        $identifier = $this->resolveRequestSignature($request, $key);

        if (RateLimiter::tooManyAttempts($identifier, $maxAttempts)) {
            return $this->buildResponse($identifier, $maxAttempts);
        }

        RateLimiter::hit($identifier, $decayMinutes * 60);

        $response = $next($request);

        return $this->addHeaders($response, $identifier, $maxAttempts);
    }

    protected function resolveRequestSignature(Request $request, string $key): string
    {
        $user = $request->user();

        if ($user) {
            return $key . ':user:' . $user->id;
        }

        return $key . ':ip:' . $request->ip();
    }

    protected function buildResponse(string $identifier, int $maxAttempts)
    {
        $availableAt = RateLimiter::availableAt($identifier);

        return response()->json([
            'message' => 'Prea multe cereri. Încercați din nou mai târziu.',
            'retry_after' => $availableAt - time(),
            'limit' => $maxAttempts
        ], 429);
    }

    protected function addHeaders($response, string $identifier, int $maxAttempts)
    {
        $remaining = RateLimiter::remaining($identifier, $maxAttempts);
        $retryAfter = RateLimiter::availableAt($identifier);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $remaining),
            'X-RateLimit-Reset' => $retryAfter,
        ]);
    }
}
