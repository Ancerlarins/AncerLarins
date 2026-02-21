<?php

namespace Tests\Feature\Admin;

use App\Enums\PropertyStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\AgentProfile;
use App\Models\Property;
use App\Models\Report;
use App\Models\User;
use App\Services\AdminService;
use App\Services\NotificationService;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class AdminModerationTest extends TestCase
{
    use RefreshDatabase, CreatesTestData;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create(['phone_verified' => true]);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('send')->andReturn(new \App\Models\Notification());
        });
    }

    // ── Dashboard ────────────────────────────────────────────

    public function test_admin_can_view_dashboard(): void
    {
        $this->mock(AdminService::class, function ($mock) {
            $mock->shouldReceive('getDashboardStats')->once()->andReturn([
                'total_users' => 10,
                'total_agents' => 5,
                'total_properties' => 20,
                'pending_properties' => 3,
                'pending_agents' => 2,
                'total_leads' => 15,
                'open_reports' => 1,
                'properties_this_month' => 8,
                'users_this_month' => 4,
            ]);
        });

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Property Moderation ─────────────────────────────────

    public function test_admin_can_list_pending_properties(): void
    {
        $agent = $this->createVerifiedAgent();
        $location = $this->createLocationHierarchy();
        $propertyType = \App\Models\PropertyType::factory()->create();

        Property::factory()->create([
            'agent_id'         => $agent['profile']->id,
            'status'           => PropertyStatus::Pending,
            'property_type_id' => $propertyType->id,
            'state_id'         => $location['state']->id,
            'city_id'          => $location['city']->id,
            'area_id'          => $location['area']->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/properties/pending');

        $response->assertOk();
    }

    public function test_admin_can_approve_property(): void
    {
        $agent = $this->createVerifiedAgent();
        $location = $this->createLocationHierarchy();
        $propertyType = \App\Models\PropertyType::factory()->create();

        $property = Property::factory()->create([
            'agent_id'         => $agent['profile']->id,
            'status'           => PropertyStatus::Pending,
            'property_type_id' => $propertyType->id,
            'state_id'         => $location['state']->id,
            'city_id'          => $location['city']->id,
            'area_id'          => $location['area']->id,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/properties/approve', [
            'property_id' => $property->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(PropertyStatus::Approved, $property->fresh()->status);
    }

    public function test_admin_can_reject_property(): void
    {
        $agent = $this->createVerifiedAgent();
        $location = $this->createLocationHierarchy();
        $propertyType = \App\Models\PropertyType::factory()->create();

        $property = Property::factory()->create([
            'agent_id'         => $agent['profile']->id,
            'status'           => PropertyStatus::Pending,
            'property_type_id' => $propertyType->id,
            'state_id'         => $location['state']->id,
            'city_id'          => $location['city']->id,
            'area_id'          => $location['area']->id,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/properties/reject', [
            'property_id'      => $property->id,
            'rejection_reason' => 'Incomplete listing info.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(PropertyStatus::Rejected, $property->fresh()->status);
    }

    public function test_admin_can_feature_property(): void
    {
        $agent = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agent['profile']);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/properties/feature', [
            'property_id' => $property->id,
            'days'         => 14,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Agent Moderation ────────────────────────────────────

    public function test_admin_can_list_pending_agents(): void
    {
        $user = User::factory()->agent()->create(['phone_verified' => true]);
        AgentProfile::factory()->create([
            'user_id'             => $user->id,
            'verification_status' => VerificationStatus::Pending,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/agents/pending');

        $response->assertOk();
    }

    public function test_admin_can_verify_agent(): void
    {
        $user = User::factory()->agent()->create(['phone_verified' => true]);
        $agent = AgentProfile::factory()->create([
            'user_id'             => $user->id,
            'verification_status' => VerificationStatus::Pending,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/agents/verify', [
            'agent_profile_id' => $agent->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(VerificationStatus::Verified, $agent->fresh()->verification_status);
    }

    public function test_admin_can_reject_agent(): void
    {
        $user = User::factory()->agent()->create(['phone_verified' => true]);
        $agent = AgentProfile::factory()->create([
            'user_id'             => $user->id,
            'verification_status' => VerificationStatus::Pending,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/agents/reject', [
            'agent_profile_id'  => $agent->id,
            'rejection_reason'  => 'Invalid documents.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(VerificationStatus::Rejected, $agent->fresh()->verification_status);
    }

    // ── User Management ─────────────────────────────────────

    public function test_admin_can_ban_user(): void
    {
        $user = $this->createVerifiedUser();

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/users/ban', [
            'user_id'    => $user->id,
            'ban_reason' => 'Spamming the platform.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(UserStatus::Banned, $user->fresh()->status);
    }

    // ── Reports ─────────────────────────────────────────────

    public function test_admin_can_view_reports(): void
    {
        $agent = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agent['profile']);

        Report::factory()->create([
            'reporter_id'     => $this->admin->id,
            'reportable_type' => Property::class,
            'reportable_id'   => $property->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reports');

        $response->assertOk();
    }

    public function test_admin_can_resolve_report(): void
    {
        $agent = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agent['profile']);

        $report = Report::factory()->create([
            'reporter_id'     => $this->admin->id,
            'reportable_type' => Property::class,
            'reportable_id'   => $property->id,
        ]);

        $this->mock(ReportService::class, function ($mock) {
            $mock->shouldReceive('resolve')->once();
        });

        $response = $this->actingAs($this->admin)->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
            'resolution_note' => 'Investigated and resolved.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Authorization ───────────────────────────────────────

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $agent = $this->createVerifiedAgent();

        $this->actingAs($agent['user'])->getJson('/api/v1/admin/dashboard')->assertStatus(403);
        $this->actingAs($agent['user'])->getJson('/api/v1/admin/properties/pending')->assertStatus(403);
        $this->actingAs($agent['user'])->getJson('/api/v1/admin/agents/pending')->assertStatus(403);
        $this->actingAs($agent['user'])->getJson('/api/v1/admin/reports')->assertStatus(403);
    }
}
