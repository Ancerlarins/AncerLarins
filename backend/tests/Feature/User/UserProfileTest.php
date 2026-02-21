<?php

namespace Tests\Feature\User;

use App\Models\Notification;
use App\Models\Property;
use App\Models\SavedSearch;
use App\Models\User;
use App\Services\FraudDetectionService;
use App\Services\NotificationService;
use App\Services\SavedSearchService;
use App\Services\ValuationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class UserProfileTest extends TestCase
{
    use RefreshDatabase, CreatesTestData;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = $this->createVerifiedUser();

        $this->mock(FraudDetectionService::class, function ($mock) {
            $mock->shouldReceive('analyze')->andReturn(['score' => 0, 'flags' => []]);
        });

        $this->mock(ValuationService::class, function ($mock) {
            $mock->shouldReceive('estimate')->andReturn(null);
        });
    }

    // ── Profile ──────────────────────────────────────────────

    public function test_user_can_get_profile(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/me');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_user_can_update_profile(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/me', [
            'first_name' => 'Updated',
            'last_name'  => 'Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals('Updated', $this->user->fresh()->first_name);
    }

    // ── Saved Properties ─────────────────────────────────────

    public function test_user_can_save_property(): void
    {
        $agent = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agent['profile']);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('send')->andReturn(new Notification());
        });

        $response = $this->actingAs($this->user)->postJson("/api/v1/properties/{$property->id}/save");

        $response->assertStatus(201)
            ->assertJsonPath('data.saved', true);
    }

    public function test_user_can_unsave_property(): void
    {
        $agent = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agent['profile']);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('send')->andReturn(new Notification());
        });

        // Save first
        $this->user->savedProperties()->create(['property_id' => $property->id]);

        // Toggle (unsave)
        $response = $this->actingAs($this->user)->postJson("/api/v1/properties/{$property->id}/save");

        $response->assertOk()
            ->assertJsonPath('data.saved', false);
    }

    public function test_user_can_list_saved_properties(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/me/saved-properties');

        $response->assertOk();
    }

    // ── Notifications ────────────────────────────────────────

    public function test_user_can_list_notifications(): void
    {
        Notification::factory()->count(3)->create(['user_id' => $this->user->id]);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('send')->andReturn(new Notification());
        });

        $response = $this->actingAs($this->user)->getJson('/api/v1/me/notifications');

        $response->assertOk();
    }

    public function test_user_can_get_unread_count(): void
    {
        Notification::factory()->count(2)->create(['user_id' => $this->user->id]);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('getUnreadCount')->once()->andReturn(2);
        });

        $response = $this->actingAs($this->user)->getJson('/api/v1/me/notifications/unread-count');

        $response->assertOk()
            ->assertJsonPath('data.count', 2);
    }

    public function test_user_can_mark_notification_read(): void
    {
        $notification = Notification::factory()->create(['user_id' => $this->user->id]);

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('markAsRead')->once();
        });

        $response = $this->actingAs($this->user)->patchJson("/api/v1/me/notifications/{$notification->id}/read");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Saved Searches ───────────────────────────────────────

    public function test_user_can_create_saved_search(): void
    {
        $this->mock(SavedSearchService::class, function ($mock) {
            $mock->shouldReceive('create')->once()->andReturn(
                SavedSearch::factory()->make(['user_id' => $this->user->id])
            );
        });

        $response = $this->actingAs($this->user)->postJson('/api/v1/me/saved-searches', [
            'name'         => '3 bed in Lagos',
            'listing_type' => 'sale',
            'min_bedrooms' => 3,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_user_can_delete_saved_search(): void
    {
        $search = SavedSearch::factory()->create(['user_id' => $this->user->id]);

        $this->mock(SavedSearchService::class, function ($mock) {
            $mock->shouldReceive('delete')->once();
        });

        $response = $this->actingAs($this->user)->deleteJson("/api/v1/me/saved-searches/{$search->id}");

        $response->assertStatus(204);
    }
}
