<?php

namespace Database\Factories;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Commission>
 */
class CommissionFactory extends Factory
{
    protected $model = Commission::class;

    public function definition(): array
    {
        $salePriceKobo = fake()->numberBetween(5_000_000_00, 500_000_000_00); // kobo
        $commissionRate = fake()->randomElement([2.50, 3.00, 5.00]);
        $commissionAmountKobo = (int) round($salePriceKobo * ($commissionRate / 100));

        return [
            'lead_id' => Lead::factory(),
            'property_id' => Property::factory(),
            'sale_price_kobo' => $salePriceKobo,
            'commission_rate' => $commissionRate,
            'commission_amount_kobo' => $commissionAmountKobo,
            'status' => 'pending',
            'payment_method' => null,
            'payment_reference' => null,
            'paid_at' => null,
            'notes' => fake()->optional(0.4)->sentence(8),
            'created_by' => User::factory()->admin(),
        ];
    }

    /**
     * Mark the commission as paid.
     */
    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'paid',
            'payment_method' => fake()->randomElement(['bank_transfer', 'cash', 'cheque']),
            'payment_reference' => strtoupper(fake()->bothify('PAY-########')),
            'paid_at' => now(),
        ]);
    }

    /**
     * Mark the commission as invoiced (awaiting payment).
     */
    public function invoiced(): static
    {
        return $this->state(fn () => [
            'status' => 'invoiced',
        ]);
    }

    /**
     * Mark the commission as cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => 'cancelled',
        ]);
    }
}
