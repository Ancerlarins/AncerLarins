<?php

namespace Tests\Feature\Auth;

use App\Enums\OtpPurpose;
use App\Enums\UserRole;
use App\Models\OtpCode;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\TermiiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class AuthFlowTest extends TestCase
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

    // ── Registration ────────────────────────────────────────

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+2348012345678',
            'password' => 'Secure@Pass1',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'phone' => '+2348012345678',
            'role' => UserRole::User->value,
        ]);

        $this->assertDatabaseHas('otp_codes', [
            'phone' => '+2348012345678',
        ]);
    }

    public function test_agent_registration_creates_profile(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Jane',
            'last_name' => 'Agent',
            'phone' => '+2348099999999',
            'password' => 'Secure@Pass1',
            'role' => 'agent',
        ]);

        $response->assertStatus(201);

        $user = User::where('phone', '+2348099999999')->first();
        $this->assertNotNull($user);
        $this->assertEquals(UserRole::Agent, $user->role);
        $this->assertNotNull($user->agentProfile);
    }

    public function test_register_fails_duplicate_phone(): void
    {
        User::factory()->create(['phone' => '+2348011111111']);

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Dup',
            'last_name' => 'User',
            'phone' => '+2348011111111',
            'password' => 'Secure@Pass1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_register_fails_invalid_data(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'phone', 'password']);
    }

    // ── Login ───────────────────────────────────────────────

    public function test_login_sends_otp(): void
    {
        $user = $this->createVerifiedUser(['phone' => '+2348022222222']);

        $response = $this->postJson('/api/v1/auth/login', [
            'phone' => '+2348022222222',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('otp_codes', [
            'phone' => '+2348022222222',
        ]);
    }

    public function test_login_fails_banned_user(): void
    {
        User::factory()->banned()->create(['phone' => '+2348033333333']);

        $response = $this->postJson('/api/v1/auth/login', [
            'phone' => '+2348033333333',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_wrong_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'phone' => '+2348099000000',
        ]);

        $response->assertStatus(401);
    }

    // ── OTP Verification ────────────────────────────────────

    public function test_verify_otp_returns_tokens(): void
    {
        $user = $this->createVerifiedUser(['phone' => '+2348044444444']);

        OtpCode::factory()->withCode('123456')->create([
            'phone' => '+2348044444444',
            'purpose' => OtpPurpose::Login,
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '+2348044444444',
            'code' => '123456',
            'purpose' => 'login',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['access_token', 'refresh_token', 'user'],
            ]);
    }

    public function test_verify_otp_marks_phone_verified(): void
    {
        $user = User::factory()->unverified()->create(['phone' => '+2348055555555']);

        OtpCode::factory()->withCode('654321')->create([
            'phone' => '+2348055555555',
            'purpose' => OtpPurpose::Registration,
        ]);

        $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '+2348055555555',
            'code' => '654321',
            'purpose' => 'registration',
        ]);

        $this->assertTrue($user->fresh()->phone_verified);
    }

    public function test_verify_otp_fails_wrong_code(): void
    {
        $this->createVerifiedUser(['phone' => '+2348066666666']);

        OtpCode::factory()->withCode('111111')->create([
            'phone' => '+2348066666666',
            'purpose' => OtpPurpose::Login,
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '+2348066666666',
            'code' => '999999',
            'purpose' => 'login',
        ]);

        $response->assertStatus(422);
    }

    public function test_verify_otp_fails_expired(): void
    {
        $this->createVerifiedUser(['phone' => '+2348077777777']);

        OtpCode::factory()->withCode('222222')->expired()->create([
            'phone' => '+2348077777777',
            'purpose' => OtpPurpose::Login,
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '+2348077777777',
            'code' => '222222',
            'purpose' => 'login',
        ]);

        $response->assertStatus(422);
    }

    // ── Token Refresh ───────────────────────────────────────

    public function test_refresh_token_works(): void
    {
        $user = $this->createVerifiedUser();
        $rawToken = 'test-refresh-token-string-64-chars-long-enough-for-testing-now!';

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $rawToken,
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['access_token', 'refresh_token'],
            ]);

        // Old token should be revoked
        $this->assertNotNull(
            RefreshToken::where('token_hash', hash('sha256', $rawToken))->first()->revoked_at
        );
    }

    public function test_refresh_fails_invalid_token(): void
    {
        $response = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => 'completely-invalid-token',
        ]);

        $response->assertStatus(401);
    }

    // ── Logout ──────────────────────────────────────────────

    public function test_logout_revokes_tokens(): void
    {
        $user = $this->createVerifiedUser();
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
