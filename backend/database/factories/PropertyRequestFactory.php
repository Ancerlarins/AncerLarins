<?php

namespace Database\Factories;

use App\Enums\ListingType;
use App\Enums\PropertyRequestStatus;
use App\Models\Area;
use App\Models\City;
use App\Models\PropertyRequest;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PropertyRequest>
 */
class PropertyRequestFactory extends Factory
{
    protected $model = PropertyRequest::class;

    public function definition(): array
    {
        $minBedrooms = fake()->numberBetween(1, 3);
        $maxBedrooms = fake()->numberBetween($minBedrooms, 6);
        $minPriceKobo = fake()->numberBetween(5_000_000_00, 50_000_000_00);
        $maxPriceKobo = fake()->numberBetween($minPriceKobo, 500_000_000_00);

        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(5),
            'description' => fake()->optional(0.7)->paragraph(),
            'listing_type' => fake()->randomElement(ListingType::cases()),
            'property_type_id' => PropertyType::factory(),
            'area_id' => Area::factory(),
            'city_id' => City::factory(),
            'min_bedrooms' => $minBedrooms,
            'max_bedrooms' => $maxBedrooms,
            'min_price_kobo' => $minPriceKobo,
            'max_price_kobo' => $maxPriceKobo,
            'budget_kobo' => $maxPriceKobo,
            'move_in_date' => fake()->optional(0.5)->dateTimeBetween('now', '+6 months')?->format('Y-m-d'),
            'amenity_preferences' => null,
            'status' => PropertyRequestStatus::Active,
            'response_count' => 0,
            'expires_at' => now()->addDays(30),
        ];
    }

    /**
     * Set listing type to sale.
     */
    public function forSale(): static
    {
        return $this->state(fn () => [
            'listing_type' => ListingType::Sale,
        ]);
    }

    /**
     * Set listing type to rent.
     */
    public function forRent(): static
    {
        return $this->state(fn () => [
            'listing_type' => ListingType::Rent,
        ]);
    }

    /**
     * Mark the request as fulfilled.
     */
    public function fulfilled(): static
    {
        return $this->state(fn () => [
            'status' => PropertyRequestStatus::Fulfilled,
        ]);
    }

    /**
     * Mark the request as expired (past expires_at).
     */
    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => PropertyRequestStatus::Expired,
            'expires_at' => now()->subDay(),
        ]);
    }

    /**
     * Mark the request as cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => PropertyRequestStatus::Cancelled,
        ]);
    }
}
