<?php

namespace Database\Factories;

use App\Enums\ContactType;
use App\Models\AgentProfile;
use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'agent_id' => AgentProfile::factory(),
            'user_id' => null,
            'contact_type' => fake()->randomElement(ContactType::cases()),
            'source' => fake()->randomElement(['organic', 'referral', 'facebook', 'google', 'direct']),
            'utm_campaign' => null,
            // PII fields — stored encrypted at rest via 'encrypted' cast on the model
            'full_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => '+234'.fake()->numerify('80########'),
            'budget_range' => fake()->randomElement(['5m-10m', '10m-30m', '30m-50m', '50m-100m', null]),
            'timeline' => fake()->randomElement(['immediately', '1_3months', '3_6months', '6months_plus', null]),
            'financing_type' => fake()->randomElement(['cash', 'mortgage', 'installment', null]),
            'message' => fake()->optional(0.7)->sentence(12),
            'status' => 'new',
        ];
    }

    /**
     * Associate the lead with a registered user.
     */
    public function withUser(): static
    {
        return $this->state(fn () => [
            'user_id' => User::factory(),
        ]);
    }

    /**
     * Mark the lead as qualified.
     */
    public function qualified(): static
    {
        return $this->state(fn () => [
            'status' => 'qualified',
            'qualification' => 'hot',
            'qualified_at' => now(),
        ]);
    }

    /**
     * Mark the lead as closed/won.
     */
    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => 'closed_won',
            'closed_at' => now(),
        ]);
    }

    /**
     * Set the contact type to WhatsApp.
     */
    public function viaWhatsapp(): static
    {
        return $this->state(fn () => [
            'contact_type' => ContactType::Whatsapp,
        ]);
    }

    /**
     * Set the contact type to a form submission.
     */
    public function viaForm(): static
    {
        return $this->state(fn () => [
            'contact_type' => ContactType::Form,
        ]);
    }
}
