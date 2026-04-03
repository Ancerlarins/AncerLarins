<?php

namespace App\Services;

use App\Enums\OtpChannel;
use App\Enums\OtpPurpose;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Mail\OtpMail;
use App\Models\OtpCode;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        protected \App\Contracts\SmsService $smsService,
    ) {}

    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $phone = $this->normalizePhone($data['phone']);
            $email = $data['email'] ?? null;

            $user = new User([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $phone,
                'email' => $email,
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

            $channel = $this->resolveChannel($data['channel'] ?? null, $email);

            $otpResult = $this->sendOtp(
                phone: $phone,
                purpose: OtpPurpose::Registration,
                email: $email,
                channel: $channel,
            );

            return [
                'user' => $user,
                'otp_delivered' => $otpResult['sent'],
                'otp_reason' => $otpResult['reason'] ?? null,
                'otp_channel' => $otpResult['channel']->value,
            ];
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

        if (! $user || ! $user->isActive()) {
            usleep(random_int(200_000, 500_000));

            return null;
        }

        $channel = $this->resolveChannel($data['channel'] ?? null, $user->email);

        $otpResult = $this->sendOtp(
            phone: $user->phone,
            purpose: OtpPurpose::Login,
            email: $user->email,
            channel: $channel,
        );

        return [
            'otp_sent' => true,
            'otp_delivered' => $otpResult['sent'],
            'otp_reason' => $otpResult['reason'] ?? null,
            'channel' => $otpResult['channel']->value,
        ];
    }

    public function verifyOtp(?string $phone, string $code, string $purpose, ?string $email = null): ?array
    {
        $phone = $phone ? $this->normalizePhone($phone) : null;
        $purpose = OtpPurpose::from($purpose);

        $codeHash = hash_hmac('sha256', $code, config('app.key'));

        $query = OtpCode::where('purpose', $purpose)
            ->where('code_hash', $codeHash)
            ->valid()
            ->latest('created_at');

        if ($email) {
            $query->where('email', $email);
        } else {
            $query->where('phone', $phone);
        }

        $otp = $query->first();

        if (! $otp) {
            $latestQuery = OtpCode::where('purpose', $purpose)
                ->valid()
                ->latest('created_at');

            if ($email) {
                $latestQuery->where('email', $email);
            } else {
                $latestQuery->where('phone', $phone);
            }

            $latestOtp = $latestQuery->first();

            if ($latestOtp) {
                $latestOtp->incrementAttempts();

                if ($latestOtp->attempts >= 5) {
                    $latestOtp->markVerified();
                }
            }

            return null;
        }

        if ($otp->attempts >= 5) {
            return null;
        }

        $otp->markVerified();

        $user = $email
            ? User::where('email', $email)->first()
            : User::where('phone', $phone)->first();

        if (! $user) {
            return null;
        }

        if ($purpose === OtpPurpose::Registration || $purpose === OtpPurpose::Login) {
            $updates = [
                'last_login_at' => now(),
                'last_login_ip' => request()->ip(),
            ];

            if ($phone) {
                $updates['phone_verified'] = true;
            }

            $user->forceFill($updates)->save();

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

    public function forgotPassword(?string $phone, ?string $email = null, ?string $channel = null): array
    {
        if ($email) {
            $user = User::where('email', $email)->first();
        } else {
            $phone = $this->normalizePhone($phone);
            $user = User::where('phone', $phone)->first();
        }

        if (! $user) {
            return ['otp_delivered' => false, 'otp_reason' => 'no_user'];
        }

        $resolvedChannel = $this->resolveChannel($channel, $user->email);

        $otpResult = $this->sendOtp(
            phone: $user->phone,
            purpose: OtpPurpose::PasswordReset,
            email: $user->email,
            channel: $resolvedChannel,
        );

        return [
            'otp_delivered' => $otpResult['sent'],
            'otp_reason' => $otpResult['reason'] ?? null,
            'channel' => $otpResult['channel']->value,
        ];
    }

    public function sendOtp(?string $phone, OtpPurpose $purpose, ?string $email = null, ?OtpChannel $channel = null): array
    {
        $channel = $channel ?? ($email ? OtpChannel::Email : OtpChannel::Sms);
        $identifier = $channel === OtpChannel::Email ? $email : $phone;

        $identifierColumn = $channel === OtpChannel::Email ? 'email' : 'phone';
        $recentCount = OtpCode::where($identifierColumn, $identifier)
            ->where('purpose', $purpose)
            ->where('created_at', '>=', now()->subHour())
            ->count();

        if ($recentCount >= 3) {
            Log::warning('OTP rate-limited', [
                'identifier' => $channel === OtpChannel::Email ? $email : substr($phone, -4),
                'channel' => $channel->value,
                'purpose' => $purpose->value,
                'count_last_hour' => $recentCount,
            ]);

            return ['sent' => false, 'reason' => 'rate_limited', 'channel' => $channel];
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        if (app()->environment('local')) {
            Log::info('DEV OTP', [
                'identifier' => $channel === OtpChannel::Email ? $email : substr($phone, -4),
                'code' => $code,
            ]);
        }

        $codeHash = hash_hmac('sha256', $code, config('app.key'));

        OtpCode::create([
            'phone' => $phone,
            'email' => $email,
            'code_hash' => $codeHash,
            'purpose' => $purpose,
            'channel' => $channel,
            'expires_at' => now()->addMinutes(10),
        ]);

        if ($channel === OtpChannel::Email) {
            $result = $this->sendOtpViaEmail($code, $email, $purpose);

            if (! $result['sent'] && $phone) {
                Log::warning('Email OTP failed, falling back to SMS', [
                    'email' => $email,
                    'purpose' => $purpose->value,
                ]);

                return $this->sendOtpViaSms($code, $phone, $purpose);
            }

            return $result;
        }

        return $this->sendOtpViaSms($code, $phone, $purpose);
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
        $phone = preg_replace('/[\s\-\(\)]+/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '+234'.substr($phone, 1);
        }

        if (str_starts_with($phone, '234') && ! str_starts_with($phone, '+')) {
            return '+'.$phone;
        }

        return $phone;
    }

    private function resolveChannel(?string $channel, ?string $email): OtpChannel
    {
        if ($channel) {
            return OtpChannel::from($channel);
        }

        if ($email && $this->isMailConfigured()) {
            return OtpChannel::Email;
        }

        return OtpChannel::Sms;
    }

    private function sendOtpViaEmail(string $code, string $email, OtpPurpose $purpose): array
    {
        if (! $this->isMailConfigured()) {
            Log::warning('OTP email delivery skipped — mail not configured');

            return ['sent' => false, 'reason' => 'not_configured', 'channel' => OtpChannel::Email];
        }

        try {
            Mail::to($email)->send(new OtpMail($code, $purpose));

            Log::info('OTP sent via email', [
                'email' => $email,
                'purpose' => $purpose->value,
            ]);

            return ['sent' => true, 'channel' => OtpChannel::Email];
        } catch (\Throwable $e) {
            Log::error('OTP email delivery failed', [
                'email' => $email,
                'purpose' => $purpose->value,
                'error' => $e->getMessage(),
            ]);

            return ['sent' => false, 'reason' => 'delivery_failed', 'channel' => OtpChannel::Email];
        }
    }

    private function sendOtpViaSms(string $code, ?string $phone, OtpPurpose $purpose): array
    {
        if (! $phone) {
            return ['sent' => false, 'reason' => 'no_phone', 'channel' => OtpChannel::Sms];
        }

        $provider = config('services.sms.provider', 'termii');
        $fallback = config('services.sms.fallback');

        $primaryConfigured = match ($provider) {
            '80kobo' => ! empty(config('services.80kobo.email')) && ! empty(config('services.80kobo.password')),
            default => ! empty(config('services.termii.api_key')) && ! str_starts_with(config('services.termii.api_key'), 'your_'),
        };

        $fallbackConfigured = match ($fallback) {
            '80kobo' => ! empty(config('services.80kobo.email')) && ! empty(config('services.80kobo.password')),
            'termii' => ! empty(config('services.termii.api_key')) && ! str_starts_with(config('services.termii.api_key'), 'your_'),
            default => false,
        };

        if (! $primaryConfigured && ! $fallbackConfigured) {
            Log::warning('OTP delivery skipped — no SMS provider configured', [
                'provider' => $provider,
                'fallback' => $fallback,
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
            ]);

            return ['sent' => false, 'reason' => 'not_configured', 'channel' => OtpChannel::Sms];
        }

        try {
            $message = "Your AncerLarins verification code is {$code}. Valid for 10 minutes.";
            $response = $this->smsService->sendSms($phone, $message);

            if (isset($response['code']) && $response['code'] === 'ok') {
                Log::info('OTP sent via SMS', [
                    'provider' => $provider,
                    'phone_suffix' => substr($phone, -4),
                    'purpose' => $purpose->value,
                ]);

                return ['sent' => true, 'channel' => OtpChannel::Sms];
            }

            Log::error('OTP delivery rejected by SMS provider', [
                'provider' => $provider,
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
                'response' => $response,
            ]);

            return ['sent' => false, 'reason' => 'delivery_failed', 'channel' => OtpChannel::Sms];
        } catch (\Throwable $e) {
            Log::error('OTP delivery failed', [
                'phone_suffix' => substr($phone, -4),
                'purpose' => $purpose->value,
                'error' => $e->getMessage(),
            ]);

            return ['sent' => false, 'reason' => 'delivery_failed', 'channel' => OtpChannel::Sms];
        }
    }

    private function isMailConfigured(): bool
    {
        $mailer = config('mail.default');

        if ($mailer === 'log' || $mailer === 'array') {
            return true;
        }

        $host = config('mail.mailers.smtp.host');

        return $host && ! str_contains($host, 'example.com');
    }
}
