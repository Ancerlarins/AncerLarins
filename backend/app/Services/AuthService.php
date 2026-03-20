<?php

namespace App\Services;

use App\Enums\OtpPurpose;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\OtpCode;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        protected TermiiService $termiiService,
    ) {}

    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $phone = $this->normalizePhone($data['phone']);

            $user = new User([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $phone,
                'email' => $data['email'] ?? null,
                'password_hash' => $data['password'] ?? null,
            ]);
            $user->forceFill([
                'role' => UserRole::from($data['role'] ?? 'user'),
                'status' => UserStatus::Active,
            ])->save();

            if ($user->role === UserRole::Agent) {
                $user->agentProfile()->create([
                    'company_name' => $user->full_name,
                ]);
            }

            $otpResult = $this->sendOtp($phone, OtpPurpose::Registration);

            return ['user' => $user, 'otp_delivered' => $otpResult['sent'], 'otp_reason' => $otpResult['reason'] ?? null];
        });
    }

    public function login(array $data): ?array
    {
        if (! empty($data['email'])) {
            $user = User::where('email', $data['email'])->first();
        } else {
            $phone = $this->normalizePhone($data['phone']);
            $user = User::where('phone', $phone)->first();
        }

        $phone = $user?->phone;

        if (! $user || ! $user->isActive()) {
            // Simulate OTP send delay to prevent user enumeration via timing
            usleep(random_int(200_000, 500_000));

            return null;
        }

        $otpResult = $this->sendOtp($phone, OtpPurpose::Login);

        return ['otp_sent' => true, 'otp_delivered' => $otpResult['sent'], 'otp_reason' => $otpResult['reason'] ?? null];
    }

    public function verifyOtp(string $phone, string $code, string $purpose): ?array
    {
        $phone = $this->normalizePhone($phone);
        $purpose = OtpPurpose::from($purpose);

        $codeHash = hash_hmac('sha256', $code, config('app.key'));

        $otp = OtpCode::where('phone', $phone)
            ->where('purpose', $purpose)
            ->where('code_hash', $codeHash)
            ->valid()
            ->latest('created_at')
            ->first();

        if (! $otp) {
            // Increment attempts on the latest valid OTP for this phone+purpose (brute-force protection)
            $latestOtp = OtpCode::where('phone', $phone)
                ->where('purpose', $purpose)
                ->valid()
                ->latest('created_at')
                ->first();

            if ($latestOtp) {
                $latestOtp->incrementAttempts();

                // Lock OTP after 5 failed attempts
                if ($latestOtp->attempts >= 5) {
                    $latestOtp->markVerified(); // Consume it so it can't be tried again
                }
            }

            return null;
        }

        // Reject if too many failed attempts on this OTP
        if ($otp->attempts >= 5) {
            return null;
        }

        $otp->markVerified();

        $user = User::where('phone', $phone)->first();

        if (! $user) {
            return null;
        }

        if ($purpose === OtpPurpose::Registration || $purpose === OtpPurpose::Login) {
            $user->forceFill([
                'phone_verified' => true,
                'last_login_at' => now(),
                'last_login_ip' => request()->ip(),
            ])->save();

            $tokens = $this->generateTokens($user);

            return [
                'user' => $user,
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'],
            ];
        }

        return ['user' => $user];
    }

    public function refreshToken(string $refreshToken): ?array
    {
        $token = RefreshToken::where('token_hash', hash('sha256', $refreshToken))
            ->active()
            ->first();

        if (! $token || ! $token->isValid()) {
            return null;
        }

        $token->revoke();

        $user = $token->user;
        $tokens = $this->generateTokens($user);

        return [
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
        $user->refreshTokens()->active()->update(['revoked_at' => now()]);
    }

    public function forgotPassword(string $phone): array
    {
        $phone = $this->normalizePhone($phone);
        $user = User::where('phone', $phone)->first();

        if (! $user) {
            return ['otp_delivered' => false, 'otp_reason' => 'no_user'];
        }

        $otpResult = $this->sendOtp($phone, OtpPurpose::PasswordReset);

        return ['otp_delivered' => $otpResult['sent'], 'otp_reason' => $otpResult['reason'] ?? null];
    }

    /**
     * @return array{sent: bool, reason?: string}
     */
    public function sendOtp(string $phone, OtpPurpose $purpose): array
    {
        $recentCount = OtpCode::where('phone', $phone)
            ->where('purpose', $purpose)
            ->where('created_at', '>=', now()->subHour())
            ->count();

        if ($recentCount >= 3) {
            Log::warning('OTP rate-limited', [
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
                'count_last_hour' => $recentCount,
            ]);

            return ['sent' => false, 'reason' => 'rate_limited'];
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        if (app()->environment('local')) {
            Log::info('DEV OTP', ['phone_suffix' => substr($phone, -4), 'code' => $code]);
        }

        $codeHash = hash_hmac('sha256', $code, config('app.key'));

        OtpCode::create([
            'phone' => $phone,
            'code_hash' => $codeHash,
            'purpose' => $purpose,
            'expires_at' => now()->addMinutes(10),
        ]);

        $termiiKey = config('services.termii.api_key');
        if (empty($termiiKey) || str_starts_with($termiiKey, 'your_')) {
            Log::warning('OTP delivery skipped — Termii not configured', [
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
            ]);

            return ['sent' => false, 'reason' => 'not_configured'];
        }

        try {
            $message = "Your AncerLarins verification code is {$code}. Valid for 10 minutes.";
            $response = $this->termiiService->sendSms($phone, $message);

            if (isset($response['code']) && $response['code'] === 'ok') {
                Log::info('OTP sent via SMS', [
                    'phone_suffix' => substr($phone, -4),
                    'purpose' => $purpose->value,
                ]);

                return ['sent' => true];
            }

            Log::error('OTP delivery rejected by Termii', [
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
                'response' => $response,
            ]);

            return ['sent' => false, 'reason' => 'delivery_failed'];
        } catch (\Throwable $e) {
            Log::error('OTP delivery failed', [
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
                'error' => $e->getMessage(),
            ]);

            return ['sent' => false, 'reason' => 'delivery_failed'];
        }
    }

    public function recordLogin(User $user): void
    {
        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ])->save();
    }

    public function generateTokens(User $user): array
    {
        // Revoke existing access tokens to prevent token accumulation
        $user->tokens()->delete();

        $tokenName = request()->userAgent() ?: 'api';
        $accessToken = $user->createToken($tokenName)->plainTextToken;

        $rawRefreshToken = Str::random(64);
        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawRefreshToken),
            'expires_at' => now()->addDays(30),
            'ip_address' => request()->ip(),
            'device_info' => mb_substr(request()->userAgent() ?? '', 0, 500),
        ]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $rawRefreshToken,
        ];
    }

    public function normalizePhone(string $phone): string
    {
        // Remove spaces, dashes, parens
        $phone = preg_replace('/[\s\-\(\)]+/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '+234'.substr($phone, 1);
        }

        if (str_starts_with($phone, '234') && ! str_starts_with($phone, '+')) {
            return '+'.$phone;
        }

        return $phone;
    }
}
