<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commissions')) {
            return;
        }

        Schema::create('commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('sale_price_kobo'); // actual transaction price
            $table->decimal('commission_rate', 5, 2)->default(2.50); // percentage (e.g. 2.50%)
            $table->bigInteger('commission_amount_kobo'); // calculated commission
            $table->string('status', 30)->default('pending'); // pending, invoiced, paid, cancelled
            $table->string('payment_method', 50)->nullable(); // bank_transfer, cash, cheque
            $table->string('payment_reference', 200)->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestampsTz();

            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
