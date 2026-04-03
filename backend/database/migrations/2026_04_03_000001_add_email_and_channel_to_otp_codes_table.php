<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('email')->nullable()->after('phone');
            $table->string('channel', 10)->default('sms')->after('purpose');
        });

        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('phone')->nullable()->change();
        });

        Schema::table('otp_codes', function (Blueprint $table) {
            $table->index(['email', 'purpose', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropIndex(['email', 'purpose', 'expires_at']);
            $table->dropColumn(['email', 'channel']);
            $table->string('phone')->nullable(false)->change();
        });
    }
};
