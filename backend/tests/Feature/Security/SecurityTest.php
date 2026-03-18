<?php

namespace Tests\Feature\Security;

use App\Enums\OtpPurpose;
use App\Enums\UserStatus;
use App\Models\AgentProfile;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\TermiiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class SecurityTest extends TestCase
{
    use CreatesTestData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(TermiiService::class, function ($mock) {
            $mock->shouldReceive('sendOtp')->andReturn(true);
            $mock->shouldReceive('sendSms')->andReturn(['code' => 'ok', 'message_id' => 'test']);
        });
    }

    // ── Account Status Enforcement ───────────────────────────

    public function test_suspended_user_cannot_login(): void
    {
        User::factory()->create([
            'phone' => '+2348011110001',
            'status' => UserStatus::Suspended,
            'phone_verified' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'phone' => '+2348011110001',
        ]);

        $response->assertStatus(401);
    }

    public function test_deactivated_user_cannot_login(): void
    {
        User::factory()->create([
            'phone' => '+2348011110002',
            'status' => UserStatus::Deactivated,
            'phone_verified' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'phone' => '+2348011110002',
        ]);

        $response->assertStatus(401);
    }

    // ── OTP Brute-Force Lockout ──────────────────────────────

    public function test_otp_locked_after_5_failed_attempts(): void
    {
        $phone = '+2348011110003';
        $this->createVerifiedUser(['phone' => $phone]);

        OtpCode::factory()->withCode('123456')->create([
            'phone' => $phone,
            'purpose' => OtpPurpose::Login,
        ]);

        // Attempt 5 times with the wrong code to trigger the lockout
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/verify-otp', [
                'phone' => $phone,
                'code' => '999999',
                'purpose' => 'login',
            ]);
        }

        // Now try with the correct code — should still fail because OTP is locked
        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => $phone,
            'code' => '123456',
            'purpose' => 'login',
        ]);

        $response->assertStatus(422);
    }

    // ── Route Authorization ──────────────────────────────────

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = $this->createVerifiedUser();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(401);
    }

    // ── Form Request Authorization ───────────────────────────

    public function test_admin_form_request_rejects_non_admin(): void
    {
        $user = $this->createVerifiedUser();
        $token = $user->createToken('api')->plainTextToken;

        // Create a valid agent profile so the payload passes validation rules
        $agentUser = User::factory()->agent()->create(['phone_verified' => true]);
        $agentProfile = AgentProfile::factory()->create(['user_id' => $agentUser->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/agents/verify', [
                'agent_profile_id' => $agentProfile->id,
            ]);

        $response->assertStatus(403);
    }

    // ── Input Validation ─────────────────────────────────────

    public function test_forgot_password_rejects_invalid_phone(): void
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => 'invalid',
        ]);

        $response->assertStatus(422);
    }

    public function test_forgot_password_accepts_valid_phone(): void
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '+2348012345678',
        ]);

        $response->assertStatus(200);
    }
}
