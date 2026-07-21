<?php

namespace App\Http\Middleware;

use App\Services\ActivityLogRecorder;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RecordReadActivity
{
    public function __construct(private ActivityLogRecorder $activityLogRecorder) {}

    /**
     * @param Closure(Request): Response $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (
            $request->isMethod('GET')
            && $response->isSuccessful()
            && ! $request->headers->has('X-Inertia-Partial-Data')
            && $request->header('Purpose') !== 'prefetch'
        ) {
            $this->activityLogRecorder->recordRead($request);
        }

        return $response;
    }
}
