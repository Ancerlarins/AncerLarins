<?php

namespace Database\Factories;

use App\Enums\EstateType;
use App\Models\Area;
use App\Models\Estate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Estate> */
class EstateFactory extends Factory
{
    protected $model = Estate::class;

    public function definition(): array
    {
        $name = fake()->company() . ' Estate';

        return [
            'area_id'      => Area::factory(),
            'name'         => $name,
            'slug'         => Str::slug($name) . '-' . fake()->unique()->numberBetween(100, 99999),
            'description'  => fake()->paragraph(),
            'estate_type'  => fake()->randomElement(EstateType::cases()),
            'developer'    => fake()->company(),
            'year_built'   => fake()->numberBetween(2000, 2025),
            'total_units'  => fake()->numberBetween(20, 500),
            'amenities'    => ['swimming_pool', 'gym', 'security'],
        ];
    }
}
