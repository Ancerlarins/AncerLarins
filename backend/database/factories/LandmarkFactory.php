<?php

namespace Database\Factories;

use App\Models\Area;
use App\Models\Landmark;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Landmark>
 */
class LandmarkFactory extends Factory
{
    protected $model = Landmark::class;

    /** Common landmark categories found in Nigerian urban areas. */
    private const TYPES = [
        'school',
        'hospital',
        'market',
        'bus_stop',
        'shopping_mall',
        'bank',
        'police_station',
        'place_of_worship',
        'government_office',
        'park',
        'filling_station',
    ];

    public function definition(): array
    {
        return [
            'area_id' => Area::factory(),
            'name' => fake()->company().' '.ucfirst(fake()->randomElement(['Plaza', 'Centre', 'Hub', 'Junction', 'Park', 'Mall'])),
            'type' => fake()->randomElement(self::TYPES),
        ];
    }

    /**
     * Set landmark type to school.
     */
    public function school(): static
    {
        return $this->state(fn () => [
            'type' => 'school',
            'name' => fake()->lastName().' '.fake()->randomElement(['Primary School', 'Secondary School', 'International Academy']),
        ]);
    }

    /**
     * Set landmark type to hospital.
     */
    public function hospital(): static
    {
        return $this->state(fn () => [
            'type' => 'hospital',
            'name' => fake()->lastName().' '.fake()->randomElement(['Hospital', 'Clinic', 'Medical Centre']),
        ]);
    }

    /**
     * Set landmark type to shopping_mall.
     */
    public function shoppingMall(): static
    {
        return $this->state(fn () => [
            'type' => 'shopping_mall',
            'name' => fake()->company().' Mall',
        ]);
    }
}
