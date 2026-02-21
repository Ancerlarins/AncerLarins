<?php

namespace Tests\Feature\Location;

use App\Models\Area;
use App\Models\City;
use App\Models\PropertyType;
use App\Models\State;
use App\Services\MarketTrendService;
use App\Services\NeighborhoodService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class LocationTest extends TestCase
{
    use RefreshDatabase, CreatesTestData;

    // ── States ───────────────────────────────────────────────

    public function test_list_active_states(): void
    {
        State::factory()->count(3)->create(['is_active' => true]);
        State::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/states');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(3, $response->json('data'));
    }

    // ── Cities ───────────────────────────────────────────────

    public function test_list_cities_by_state(): void
    {
        $location = $this->createLocationHierarchy();
        City::factory()->create(['state_id' => $location['state']->id]);

        $response = $this->getJson("/api/v1/locations/states/{$location['state']->id}/cities");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    public function test_cities_filter_by_state(): void
    {
        $loc1 = $this->createLocationHierarchy();
        $loc2 = $this->createLocationHierarchy();

        $response = $this->getJson("/api/v1/cities?state_id={$loc1['state']->id}");

        $response->assertOk();

        foreach ($response->json('data') as $city) {
            $this->assertEquals($loc1['state']->id, $city['state_id']);
        }
    }

    // ── Areas ────────────────────────────────────────────────

    public function test_list_areas_by_city(): void
    {
        $location = $this->createLocationHierarchy();

        $response = $this->getJson("/api/v1/locations/cities/{$location['city']->id}/areas");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_areas_filter_by_city(): void
    {
        $loc1 = $this->createLocationHierarchy();
        $this->createLocationHierarchy();

        $response = $this->getJson("/api/v1/areas?city_id={$loc1['city']->id}");

        $response->assertOk();
    }

    public function test_area_detail(): void
    {
        $location = $this->createLocationHierarchy();

        $response = $this->getJson("/api/v1/areas/{$location['area']->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_area_insights(): void
    {
        $location = $this->createLocationHierarchy();

        $this->mock(NeighborhoodService::class, function ($mock) {
            $mock->shouldReceive('getAreaInsights')->once()->andReturn([
                'safety_score' => 4.2,
                'transport_score' => 3.8,
                'amenities_score' => 4.0,
            ]);
        });

        $response = $this->getJson("/api/v1/areas/{$location['area']->id}/insights");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Property Types ───────────────────────────────────────

    public function test_list_property_types(): void
    {
        PropertyType::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/property-types');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(3, count($response->json('data')));
    }
}
