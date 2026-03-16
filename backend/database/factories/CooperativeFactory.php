<?php

namespace Database\Factories;

use App\Enums\CooperativeStatus;
use App\Models\Area;
use App\Models\Cooperative;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Cooperative>
 */
class CooperativeFactory extends Factory
{
    protected $model = Cooperative::class;

    public function definition(): array
    {
        $name = fake()->company().' Cooperative';

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(100, 99999),
            'description' => fake()->optional(0.8)->paragraph(),
            'admin_user_id' => User::factory(),
            'target_amount_kobo' => fake()->numberBetween(10_000_000_00, 500_000_000_00), // ₦1M – ₦5B
            'property_id' => null,
            'estate_id' => null,
            'area_id' => Area::factory(),
            'status' => CooperativeStatus::Forming,
            'member_count' => 0,
            'monthly_contribution_kobo' => fake()->numberBetween(50_000_00, 1_000_000_00), // ₦50k – ₦1M/month
            'start_date' => fake()->optional(0.7)->dateTimeBetween('now', '+1 month')?->format('Y-m-d'),
            'target_date' => fake()->optional(0.6)->dateTimeBetween('+6 months', '+5 years')?->format('Y-m-d'),
        ];
    }

    /**
     * Set status to active with a start date in the past.
     */
    public function active(): static
    {
        return $this->state(fn () => [
            'status' => CooperativeStatus::Active,
            'member_count' => fake()->numberBetween(2, 50),
            'start_date' => fake()->dateTimeBetween('-6 months', '-1 month')->format('Y-m-d'),
        ]);
    }

    /**
     * Set status to target reached.
     */
    public function targetReached(): static
    {
        return $this->state(fn () => [
            'status' => CooperativeStatus::TargetReached,
            'member_count' => fake()->numberBetween(10, 100),
        ]);
    }

    /**
     * Set status to completed.
     */
    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => CooperativeStatus::Completed,
            'member_count' => fake()->numberBetween(10, 100),
        ]);
    }
}
