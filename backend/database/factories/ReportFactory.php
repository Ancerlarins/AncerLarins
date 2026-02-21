<?php

namespace Database\Factories;

use App\Enums\ReportReason;
use App\Enums\ReportStatus;
use App\Models\Property;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Report> */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        return [
            'reporter_id'     => User::factory(),
            'reportable_type' => Property::class,
            'reportable_id'   => Property::factory(),
            'reason'          => fake()->randomElement(ReportReason::cases()),
            'description'     => fake()->sentence(10),
            'status'          => ReportStatus::Open,
        ];
    }
}
