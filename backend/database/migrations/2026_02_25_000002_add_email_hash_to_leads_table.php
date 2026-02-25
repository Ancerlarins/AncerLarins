<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds an email_hash blind index for looking up leads after the email
 * column is encrypted at rest. The hash is a HMAC-SHA256 of the
 * normalised (lowercased, trimmed) email using APP_KEY, so it is
 * consistent across writes but cannot be reversed without the key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('email_hash', 64)->nullable()->after('email');
            $table->index('email_hash');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['email_hash']);
            $table->dropColumn('email_hash');
        });
    }
};
