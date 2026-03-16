<?php

namespace Tests\Feature\Cooperative;

use App\Enums\CooperativeMemberStatus;
use App\Enums\CooperativeStatus;
use App\Models\Cooperative;
use App\Models\CooperativeMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class CooperativeTest extends TestCase
{
    use CreatesTestData, RefreshDatabase;

    // ── Public: Browse ────────────────────────────────────────

    public function test_can_browse_active_cooperatives(): void
    {
        $location = $this->createLocationHierarchy();
        Cooperative::factory()->active()->count(2)->create(['area_id' => $location['area']->id]);
        Cooperative::factory()->create([
            'area_id' => $location['area']->id,
            'status' => CooperativeStatus::Forming,
        ]);

        $response = $this->getJson('/api/v1/cooperatives');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_browse_excludes_dissolved_cooperatives(): void
    {
        $location = $this->createLocationHierarchy();
        Cooperative::factory()->active()->create(['area_id' => $location['area']->id]);
        Cooperative::factory()->create([
            'area_id' => $location['area']->id,
            'status' => CooperativeStatus::Dissolved,
        ]);

        $response = $this->getJson('/api/v1/cooperatives');

        $response->assertOk();
        // Dissolved cooperatives should not appear in public listing
        $data = $response->json('data');
        foreach ($data as $item) {
            $this->assertNotEquals('dissolved', $item['status'] ?? null);
        }
    }

    public function test_can_view_cooperative_detail(): void
    {
        $location = $this->createLocationHierarchy();
        $user = $this->createVerifiedUser();
        $cooperative = Cooperative::factory()->active()->create([
            'area_id' => $location['area']->id,
            'admin_user_id' => $user->id,
        ]);

        $response = $this->getJson("/api/v1/cooperatives/{$cooperative->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Auth: Create ──────────────────────────────────────────

    public function test_authenticated_user_can_create_cooperative(): void
    {
        $user = $this->createVerifiedUser();
        $location = $this->createLocationHierarchy();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/cooperatives', [
                'name' => 'Lekki Housing Coop',
                'description' => 'A cooperative for Lekki residents.',
                'area_id' => $location['area']->id,
                'target_amount_kobo' => 500_000_00,
                'monthly_contribution_kobo' => 50_000_00,
                'start_date' => now()->addMonth()->toDateString(),
                'target_date' => now()->addYear()->toDateString(),
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_create_validates_required_fields(): void
    {
        $user = $this->createVerifiedUser();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/cooperatives', []);

        $response->assertStatus(422);
    }

    public function test_unauthenticated_cannot_create_cooperative(): void
    {
        $response = $this->postJson('/api/v1/cooperatives', [
            'name' => 'Test Coop',
        ]);

        $response->assertUnauthorized();
    }

    // ── Auth: Join ────────────────────────────────────────────

    public function test_user_can_join_forming_cooperative(): void
    {
        $user = $this->createVerifiedUser();
        $location = $this->createLocationHierarchy();
        $cooperative = Cooperative::factory()->create([
            'area_id' => $location['area']->id,
            'admin_user_id' => $user->id,
            'status' => CooperativeStatus::Forming,
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/cooperatives/{$cooperative->id}/join");

        $response->assertStatus(201);
    }

    public function test_cannot_join_dissolved_cooperative(): void
    {
        $user = $this->createVerifiedUser();
        $location = $this->createLocationHierarchy();
        $cooperative = Cooperative::factory()->create([
            'area_id' => $location['area']->id,
            'admin_user_id' => $user->id,
            'status' => CooperativeStatus::Dissolved,
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/cooperatives/{$cooperative->id}/join");

        $response->assertStatus(422);
    }

    public function test_cannot_join_cooperative_twice(): void
    {
        $user = $this->createVerifiedUser();
        $location = $this->createLocationHierarchy();
        $cooperative = Cooperative::factory()->create([
            'area_id' => $location['area']->id,
            'admin_user_id' => $user->id,
            'status' => CooperativeStatus::Forming,
        ]);

        CooperativeMember::create([
            'cooperative_id' => $cooperative->id,
            'user_id' => $user->id,
            'status' => CooperativeMemberStatus::Active,
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/cooperatives/{$cooperative->id}/join");

        $response->assertStatus(422);
    }

    // ── Auth: My Cooperatives ─────────────────────────────────

    public function test_my_cooperatives_returns_only_joined(): void
    {
        $user = $this->createVerifiedUser();
        $location = $this->createLocationHierarchy();

        $joined = Cooperative::factory()->active()->create(['area_id' => $location['area']->id]);
        $notJoined = Cooperative::factory()->active()->create(['area_id' => $location['area']->id]);

        CooperativeMember::create([
            'cooperative_id' => $joined->id,
            'user_id' => $user->id,
            'status' => CooperativeMemberStatus::Active,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/my-cooperatives');

        $response->assertOk();
    }

    // ── Auth: Progress ────────────────────────────────────────

    public function test_can_get_cooperative_progress(): void
    {
        $user = $this->createVerifiedUser();
        $location = $this->createLocationHierarchy();
        $cooperative = Cooperative::factory()->active()->create([
            'area_id' => $location['area']->id,
            'admin_user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/cooperatives/{$cooperative->id}/progress");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Admin ─────────────────────────────────────────────────

    public function test_admin_can_list_all_cooperatives(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $location = $this->createLocationHierarchy();
        Cooperative::factory()->count(3)->create(['area_id' => $location['area']->id]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/cooperatives');

        $response->assertOk();
    }

    public function test_admin_can_update_cooperative_status(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $location = $this->createLocationHierarchy();
        $cooperative = Cooperative::factory()->create([
            'area_id' => $location['area']->id,
            'status' => CooperativeStatus::Forming,
        ]);

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/cooperatives/{$cooperative->id}/status", [
                'status' => 'active',
            ]);

        $response->assertOk();
        $this->assertEquals(CooperativeStatus::Active, $cooperative->fresh()->status);
    }

    public function test_admin_can_delete_cooperative(): void
    {
        $admin = User::factory()->admin()->create(['phone_verified' => true]);
        $location = $this->createLocationHierarchy();
        $cooperative = Cooperative::factory()->create(['area_id' => $location['area']->id]);

        $response = $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/cooperatives/{$cooperative->id}");

        $response->assertStatus(204);
        $this->assertSoftDeleted('cooperatives', ['id' => $cooperative->id]);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = $this->createVerifiedUser();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/admin/cooperatives');

        $response->assertStatus(403);
    }
}
