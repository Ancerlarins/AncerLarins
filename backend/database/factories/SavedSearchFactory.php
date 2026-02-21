<?php

namespace Database\Factories;

use App\Enums\NotificationFrequency;
use App\Models\SavedSearch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SavedSearch> */
class SavedSearchFactory extends Factory
{
    protected $model = SavedSearch::class;

    public function definition(): array
    {
        return [
            'user_id'       => User::factory(),
            'name'          => fake()->words(3, true),
            'listing_type'  => 'sale',
            'notify_push'   => true,
            'notify_email'  => false,
            'frequency'     => NotificationFrequency::Daily,
            'is_active'     => true,
            'match_count'   => 0,
        ];
    }
}
