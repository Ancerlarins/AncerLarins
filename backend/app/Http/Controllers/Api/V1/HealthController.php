<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    /**
     * Liveness probe — proves PHP-FPM is responding.
     */
    public function liveness(): JsonResponse
    {
        return response()->json([
            'status'    => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Readiness probe — deep check of all dependencies.
     */
    public function readiness(): JsonResponse
    {
        $components = [];
        $healthy = true;

        // Database
        try {
            DB::connection()->getPdo();
            $components['database'] = 'ok';
        } catch (\Throwable) {
            $components['database'] = 'failed';
            $healthy = false;
        }

        // Redis
        try {
            Cache::store('redis')->put('health_check', true, 5);
            Cache::store('redis')->forget('health_check');
            $components['redis'] = 'ok';
        } catch (\Throwable) {
            $components['redis'] = 'failed';
            $healthy = false;
        }

        // Storage
        try {
            $testFile = 'health_check_' . uniqid() . '.tmp';
            Storage::disk('local')->put($testFile, 'ok');
            Storage::disk('local')->delete($testFile);
            $components['storage'] = 'ok';
        } catch (\Throwable) {
            $components['storage'] = 'failed';
            $healthy = false;
        }

        // Queue (Redis connectivity for queue)
        try {
            Queue::size('default');
            $components['queue'] = 'ok';
        } catch (\Throwable) {
            $components['queue'] = 'failed';
            $healthy = false;
        }

        // Redis direct ping
        try {
            $pong = Redis::ping();
            $components['redis_direct'] = $pong ? 'ok' : 'failed';
            if (!$pong) $healthy = false;
        } catch (\Throwable) {
            $components['redis_direct'] = 'failed';
            $healthy = false;
        }

        // Cloudinary connectivity (if configured)
        $cloudName = config('services.cloudinary.cloud_name');
        if ($cloudName) {
            try {
                $response = Http::timeout(5)->get("https://res.cloudinary.com/{$cloudName}/image/upload/sample.jpg");
                $components['cloudinary'] = $response->successful() ? 'ok' : 'degraded';
                if (!$response->successful()) $healthy = false;
            } catch (\Throwable) {
                $components['cloudinary'] = 'failed';
                $healthy = false;
            }
        }

        $status = $healthy ? 'healthy' : 'degraded';
        $code = $healthy ? 200 : 503;

        return response()->json([
            'status'     => $status,
            'components' => $components,
            'timestamp'  => now()->toIso8601String(),
        ], $code);
    }
}
