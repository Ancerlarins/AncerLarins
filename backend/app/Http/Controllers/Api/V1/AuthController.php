<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use App\Traits\AttachesAuthCookies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse, AttachesAuthCookies;

    public function __construct(
        protected AuthService $authService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        $channel = $result['otp_channel'] ?? 'sms';
        $message = ($result['otp_delivered'] ?? false)
            ? "Registration successful. A verification code has been sent to your {$channel}."
            : 'Registration successful but we could not send the verification code. Please request a new one.';

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'otp_channel' => $channel,
        ], $message, 201);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = $this->authService->verifyOtp(
            $data['phone'] ?? null,
            $data['code'],
            $data['purpose'],
            $data['email'] ?? null,
        );

        if (! $result) {
            return $this->errorResponse('Invalid or expired OTP.', 422);
        }

        $response = ['user' => new UserResource($result['user'])];

        if (isset($result['access_token'])) {
            $response['access_token'] = $result['access_token'];
            $response['refresh_token'] = $result['refresh_token'];
        }

        $jsonResponse = $this->successResponse($response, 'OTP verified successfully.');

        if (isset($result['access_token'])) {
            $this->attachAuthCookies($jsonResponse, $result['access_token'], $result['refresh_token']);
        }

        return $jsonResponse;
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        if (! $result) {
            return $this->errorResponse('Invalid credentials.', 401);
        }

        if (! ($result['otp_delivered'] ?? false)) {
            $reason = $result['otp_reason'] ?? 'unknown';
            if ($reason === 'rate_limited') {
                return $this->errorResponse('Too many OTP requests. Please wait before trying again.', 429);
            }

            return $this->errorResponse('Unable to send OTP. Please try again later.', 503);
        }

        $channel = $result['channel'] ?? 'sms';
        $target = $channel === 'email' ? 'email' : 'phone';

        return $this->successResponse([
            'channel' => $channel,
        ], "OTP sent to your {$target}.");
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required_without:email', 'nullable', 'string', 'regex:/^(\+234|0)[789]\d{9}$/'],
            'email' => ['required_without:phone', 'nullable', 'email'],
            'channel' => ['nullable', 'string', 'in:email,sms'],
        ]);

        $result = $this->authService->forgotPassword(
            $request->phone,
            $request->email,
            $request->channel,
        );

        if (($result['otp_reason'] ?? null) === 'rate_limited') {
            return $this->errorResponse('Too many OTP requests. Please wait before trying again.', 429);
        }

        return $this->successResponse(null, 'If an account exists, an OTP has been sent.');
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required_without:email', 'nullable', 'string', 'regex:/^(\+234|0)[789]\d{9}$/'],
            'email' => ['required_without:phone', 'nullable', 'email'],
            'purpose' => ['required', 'string', 'in:registration,login,password_reset,phone_change'],
            'channel' => ['required', 'string', 'in:email,sms'],
        ]);

        $phone = $request->phone;
        $email = $request->email;

        if ($email && ! $phone) {
            $user = User::where('email', $email)->first();
            $phone = $user?->phone;
        } elseif ($phone && ! $email) {
            $normalizedPhone = $this->authService->normalizePhone($phone);
            $user = User::where('phone', $normalizedPhone)->first();
            $email = $user?->email;
        }

        $otpResult = $this->authService->sendOtp(
            phone: $phone ? $this->authService->normalizePhone($phone) : null,
            purpose: \App\Enums\OtpPurpose::from($request->purpose),
            email: $email,
            channel: \App\Enums\OtpChannel::from($request->channel),
        );

        if (! $otpResult['sent']) {
            $reason = $otpResult['reason'] ?? 'unknown';
            if ($reason === 'rate_limited') {
                return $this->errorResponse('Too many OTP requests. Please wait before trying again.', 429);
            }

            return $this->errorResponse('Unable to send OTP. Please try again later.', 503);
        }

        $channel = $otpResult['channel']->value;
        $target = $channel === 'email' ? 'email' : 'phone';

        return $this->successResponse([
            'channel' => $channel,
        ], "OTP sent to your {$target}.");
    }

    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token') ?? $request->input('refresh_token');

        if (! $refreshToken) {
            return $this->errorResponse('Refresh token is required.', 422);
        }

        $result = $this->authService->refreshToken($refreshToken);

        if (! $result) {
            $jsonResponse = $this->errorResponse('Invalid refresh token.', 401);
            $this->clearAuthCookies($jsonResponse);

            return $jsonResponse;
        }

        $jsonResponse = $this->successResponse([
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
        ], 'Token refreshed.');

        $this->attachAuthCookies($jsonResponse, $result['access_token'], $result['refresh_token']);

        return $jsonResponse;
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        $jsonResponse = $this->successResponse(null, 'Logged out.');
        $this->clearAuthCookies($jsonResponse);

        return $jsonResponse;
    }
}
