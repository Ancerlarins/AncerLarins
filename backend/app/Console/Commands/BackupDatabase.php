<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

/**
 * Artisan wrapper around pg_dump for database backups.
 * Primarily used by the Laravel scheduler as a secondary backup mechanism.
 * The Docker backup container handles the primary backup schedule.
 */
class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--path= : Override backup directory}';

    protected $description = 'Create a compressed PostgreSQL backup';

    public function handle(): int
    {
        $dir = $this->option('path') ?: storage_path('backups');

        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }

        $timestamp = now()->format('Ymd_His');
        $filename = "ancerlarins_{$timestamp}.sql.gz";
        $filepath = "{$dir}/{$filename}";

        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');
        $database = config('database.connections.pgsql.database');
        $username = config('database.connections.pgsql.username');
        $password = config('database.connections.pgsql.password');

        $this->info("Starting backup: {$filename}");

        $result = Process::env(['PGPASSWORD' => $password])
            ->timeout(300)
            ->run("pg_dump -h {$host} -p {$port} -U {$username} -d {$database} --no-owner --no-privileges | gzip > {$filepath}");

        if (!$result->successful()) {
            $this->error('Backup failed: ' . $result->errorOutput());
            return self::FAILURE;
        }

        $size = round(filesize($filepath) / 1024 / 1024, 2);
        $this->info("Backup complete: {$filename} ({$size} MB)");

        // Prune backups older than 7 days
        $this->pruneOldBackups($dir, 7);

        return self::SUCCESS;
    }

    private function pruneOldBackups(string $dir, int $retentionDays): void
    {
        $cutoff = now()->subDays($retentionDays)->getTimestamp();
        $pruned = 0;

        foreach (glob("{$dir}/ancerlarins_*.sql.gz") as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $pruned++;
            }
        }

        if ($pruned > 0) {
            $this->info("Pruned {$pruned} old backup(s).");
        }
    }
}
