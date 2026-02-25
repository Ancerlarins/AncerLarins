<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class MetricsController extends Controller
{
    /**
     * Expose application metrics in Prometheus text format.
     * Restricted to internal Docker network via nginx config.
     */
    public function __invoke(): Response
    {
        $lines = [];

        // Application liveness
        $lines[] = '# HELP laravel_up Whether the Laravel application is up.';
        $lines[] = '# TYPE laravel_up gauge';
        $lines[] = 'laravel_up 1';

        // Queue depth
        try {
            $queueSize = Queue::size('default');
            $lines[] = '# HELP laravel_queue_size Number of jobs in the queue.';
            $lines[] = '# TYPE laravel_queue_size gauge';
            $lines[] = "laravel_queue_size{queue=\"default\"} {$queueSize}";
        } catch (\Throwable) {
            // Skip if Redis is unreachable
        }

        // Active DB connections
        try {
            $result = DB::select("SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'");
            $active = $result[0]->count ?? 0;
            $lines[] = '# HELP laravel_db_connections_active Number of active database connections.';
            $lines[] = '# TYPE laravel_db_connections_active gauge';
            $lines[] = "laravel_db_connections_active {$active}";
        } catch (\Throwable) {
            // Skip if DB is unreachable
        }

        // Redis memory usage (bytes)
        try {
            $info = Cache::store('redis')->getRedis()->info('memory');
            $usedMemory = $info['used_memory'] ?? $info['Memory']['used_memory'] ?? 0;
            $lines[] = '# HELP laravel_redis_memory_bytes Redis memory usage in bytes.';
            $lines[] = '# TYPE laravel_redis_memory_bytes gauge';
            $lines[] = "laravel_redis_memory_bytes {$usedMemory}";
        } catch (\Throwable) {
            // Skip if Redis is unreachable
        }

        return response(implode("\n", $lines) . "\n", 200)
            ->header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    }
}
