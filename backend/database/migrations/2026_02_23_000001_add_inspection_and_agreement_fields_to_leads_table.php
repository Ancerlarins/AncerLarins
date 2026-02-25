<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Inspection scheduling fields
            $table->date('inspection_date')->nullable()->after('inspection_at');
            $table->string('inspection_time', 10)->nullable()->after('inspection_date');
            $table->string('inspection_location', 500)->nullable()->after('inspection_time');
            $table->string('inspection_notes', 1000)->nullable()->after('inspection_location');

            // Digital buyer agreement fields
            $table->timestamp('agreement_accepted_at')->nullable()->after('closed_at');
            $table->string('agreement_ip', 45)->nullable()->after('agreement_accepted_at');
            $table->string('agreement_terms_version', 20)->nullable()->after('agreement_ip');

            // Tracking reference for buyer self-service
            $table->string('tracking_ref', 12)->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'inspection_date',
                'inspection_time',
                'inspection_location',
                'inspection_notes',
                'agreement_accepted_at',
                'agreement_ip',
                'agreement_terms_version',
                'tracking_ref',
            ]);
        });
    }
};
