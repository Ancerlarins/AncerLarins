<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * One-time command to encrypt existing plaintext PII in the leads table
 * and backfill the email_hash blind index.
 *
 * Run ONCE after deploying the encrypted casts migration:
 *   php artisan leads:encrypt-pii
 *
 * Safe to re-run — skips rows that are already encrypted.
 */
class EncryptLeadPii extends Command
{
    protected $signature = 'leads:encrypt-pii {--dry-run : Show what would be changed without writing}';

    protected $description = 'Encrypt existing plaintext phone, email, full_name in leads and backfill email_hash';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $appKey = config('app.key');

        if (!$appKey) {
            $this->error('APP_KEY is not set. Cannot proceed.');
            return self::FAILURE;
        }

        $this->info($dryRun ? 'DRY RUN — no changes will be written.' : 'Encrypting lead PII...');

        $total = DB::table('leads')->count();
        $encrypted = 0;
        $skipped = 0;

        DB::table('leads')
            ->orderBy('created_at')
            ->chunk(200, function ($leads) use ($dryRun, $appKey, &$encrypted, &$skipped) {
                foreach ($leads as $lead) {
                    // Detect if already encrypted: Laravel's encrypted values start with "eyJ"
                    $emailAlreadyEncrypted = $lead->email && str_starts_with($lead->email, 'eyJ');

                    if ($emailAlreadyEncrypted) {
                        // Already encrypted — just backfill email_hash if missing
                        if (!$lead->email_hash) {
                            try {
                                $decryptedEmail = Crypt::decryptString($lead->email);
                                $hash = hash_hmac('sha256', strtolower(trim($decryptedEmail)), $appKey);

                                if (!$dryRun) {
                                    DB::table('leads')->where('id', $lead->id)->update(['email_hash' => $hash]);
                                }
                                $encrypted++;
                            } catch (\Exception $e) {
                                $this->warn("  Could not decrypt email for lead {$lead->id}: {$e->getMessage()}");
                                $skipped++;
                            }
                        } else {
                            $skipped++;
                        }
                        continue;
                    }

                    // Plaintext row — encrypt all PII fields
                    $updates = [];

                    if ($lead->email) {
                        $updates['email'] = Crypt::encryptString($lead->email);
                        $updates['email_hash'] = hash_hmac('sha256', strtolower(trim($lead->email)), $appKey);
                    }

                    if ($lead->phone) {
                        $updates['phone'] = Crypt::encryptString($lead->phone);
                    }

                    if ($lead->full_name) {
                        $updates['full_name'] = Crypt::encryptString($lead->full_name);
                    }

                    if (!empty($updates) && !$dryRun) {
                        DB::table('leads')->where('id', $lead->id)->update($updates);
                    }

                    $encrypted++;
                }
            });

        $this->info("Done. Encrypted: {$encrypted}, Skipped (already done): {$skipped}, Total: {$total}");

        if ($dryRun) {
            $this->warn('This was a dry run. Re-run without --dry-run to apply changes.');
        }

        return self::SUCCESS;
    }
}
