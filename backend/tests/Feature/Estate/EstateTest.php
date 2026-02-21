<?php

namespace Tests\Feature\Estate;

use App\Enums\EstateType;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class EstateTest extends TestCase
{
    use RefreshDatabase, CreatesTestData;

    // ── Public: Browse ───────────────────────────────────────

    public function test_list_estates(): void
    {
        $location = $this->createLocationHierarchy();
        Estate::factory()->count(3)->create(['area_id' => $location['area']->id]);

        $response = $this->getJson('/api/v1/estates');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(3, count($response->json('data')));
    }

    public function test_show_estate_by_slug(): void
    {
        $location = $this->createLocationHierarchy();
        $estate = Estate::factory()->create(['area_id' => $location['area']->id]);

        $response = $this->getJson("/api/v1/estates/{$estate->slug}");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_show_returns_404_for_missing(): void
    {
        $response = $this->getJson('/api/v1/estates/nonexistent-estate-slug');

        $response->assertStatus(404);
    }

    // ── Admin: CRUD ──────────────────────────────────────────

    public function test_admin_can_create_estate(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $location = $this->createLocationHierarchy();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/estates', [
            'name'        => 'Lekki Gardens Phase 2',
            'area_id'     => $location['area']->id,
            'estate_type' => EstateType::GatedEstate->value,
            'description' => 'A premium gated estate in Lekki.',
            'developer'   => 'Lekki Gardens Ltd',
            'total_units' => 200,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('estates', ['name' => 'Lekki Gardens Phase 2']);
    }

    public function test_admin_can_update_estate(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $location = $this->createLocationHierarchy();
        $estate = Estate::factory()->create(['area_id' => $location['area']->id]);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/estates/{$estate->id}", [
            'description' => 'Updated description for this estate.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals('Updated description for this estate.', $estate->fresh()->description);
    }

    public function test_admin_can_delete_estate(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $location = $this->createLocationHierarchy();
        $estate = Estate::factory()->create(['area_id' => $location['area']->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/estates/{$estate->id}");

        $response->assertStatus(204);
        $this->assertSoftDeleted('estates', ['id' => $estate->id]);
    }
}
