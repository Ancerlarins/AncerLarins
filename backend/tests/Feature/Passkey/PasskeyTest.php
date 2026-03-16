<?php

namespace Tests\Feature\Passkey;

use App\Models\WebauthnCredential;
use App\Services\WebauthnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class PasskeyTest extends TestCase
{
    use CreatesTestData, RefreshDatabase;

    // ── Registration Options ────────────────────────────

    public function test_authenticated_user_can_get_registration_options(): void
    {
        $user = $this->createVerifiedUser();

        $this->mock(WebauthnService::class, function ($mock) use ($user) {
            $mock->shouldReceive('beginRegistration')
                ->once()
                ->with(\Mockery::on(fn ($u) => $u->id === $user->id))
                ->andReturn([
                    'challenge_id' => 'test-uuid',
                    'options' => ['rp' => ['name' => 'AncerLarins']],
                ]);
        });

        $response = $this->actingAs($user)->postJson('/api/v1/passkeys/register/options');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.challenge_id', 'test-uuid');
    }

    public function test_unauthenticated_user_cannot_get_registration_options(): void
    {
        $response = $this->postJson('/api/v1/passkeys/register/options');

        $response->assertUnauthorized();
    }

    // ── Authentication Options ──────────────────────────

    public function test_anyone_can_get_authentication_options(): void
    {
        $this->mock(WebauthnService::class, function ($mock) {
            $mock->shouldReceive('beginAuthentication')
                ->once()
                ->andReturn([
                    'challenge_id' => 'test-uuid',
                    'options' => ['rpId' => 'localhost'],
                ]);
        });

        $response = $this->postJson('/api/v1/passkeys/authenticate/options');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.challenge_id', 'test-uuid');
    }

    // ── Credential Listing ──────────────────────────────

    public function test_authenticated_user_can_list_passkeys(): void
    {
        $user = $this->createVerifiedUser();

        WebauthnCredential::create([
            'user_id' => $user->id,
            'credential_id' => 'test-cred-id',
            'public_key' => 'test-public-key',
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'device_name' => 'Test Device',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/passkeys');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_unauthenticated_user_cannot_list_passkeys(): void
    {
        $response = $this->getJson('/api/v1/passkeys');

        $response->assertUnauthorized();
    }

    // ── Credential Deletion ─────────────────────────────

    public function test_user_can_delete_own_passkey(): void
    {
        $user = $this->createVerifiedUser();

        $credential = WebauthnCredential::create([
            'user_id' => $user->id,
            'credential_id' => 'test-cred-id',
            'public_key' => 'test-public-key',
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'device_name' => 'Test Device',
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/v1/passkeys/{$credential->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('webauthn_credentials', ['id' => $credential->id]);
    }

    public function test_user_cannot_delete_other_users_passkey(): void
    {
        $user = $this->createVerifiedUser();
        $otherUser = $this->createVerifiedUser();

        $credential = WebauthnCredential::create([
            'user_id' => $otherUser->id,
            'credential_id' => 'other-cred-id',
            'public_key' => 'test-public-key',
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'device_name' => 'Other Device',
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/v1/passkeys/{$credential->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('webauthn_credentials', ['id' => $credential->id]);
    }

    public function test_unauthenticated_user_cannot_delete_passkey(): void
    {
        $response = $this->deleteJson('/api/v1/passkeys/some-uuid');

        $response->assertUnauthorized();
    }

    // ── Registration ────────────────────────────────────

    public function test_unauthenticated_user_cannot_register_passkey(): void
    {
        $response = $this->postJson('/api/v1/passkeys/register', [
            'challenge_id' => 'test-uuid',
            'credential' => [
                'id' => 'test',
                'rawId' => 'test',
                'type' => 'public-key',
                'response' => [
                    'attestationObject' => 'test',
                    'clientDataJSON' => 'test',
                ],
            ],
        ]);

        $response->assertUnauthorized();
    }
}
