<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use App\Traits\AttachesAuthCookies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Authentication
 *
 * OTP-based authentication for the AncerLarins platform.
 */
class AuthController extends Controller
{
    use ApiResponse, AttachesAuthCookies;

    public function __construct(
        protected AuthService $authService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        $message = ($result['otp_delivered'] ?? false)
            ? 'Registration successful. Please verify your phone.'
            : 'Registration successful but we could not send the verification code. Please request a new one.';

        return $this->successResponse([
            'user' => new UserResource($result['user']),
        ], $message, 201);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = $this->authService->verifyOtp(
            $data['phone'],
            $data['code'],
            $data['purpose'],
        );

        if (! $result) {
            return $this->errorResponse('Invalid or expired OTP.', 422);
        }

        $response = ['user' => new UserResource($result['user'])];

        if (isset($result['access_token'])) {
            $response['access_token'] = $result['access_token'];
            $response['refresh_token'] = $result['refresh_token'];
        }

        $jsonResponse = $this->successResponse($response, 'Phone verified successfully.');

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

        return $this->successResponse(null, 'OTP sent to your phone.');
    }

    /**
     * Forgot Password
     *
     * Send a password reset OTP to the user's phone.
     *
     * @bodyParam phone string required The user's phone number. Example: +2348012345678
     *
     * @response 200 {"success": true, "message": "If an account exists, an OTP has been sent.", "data": null}
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^(\+234|0)[789]\d{9}$/'],
        ]);

        $result = $this->authService->forgotPassword($request->phone);

        if (($result['otp_reason'] ?? null) === 'rate_limited') {
            return $this->errorResponse('Too many OTP requests. Please wait before trying again.', 429);
        }

        return $this->successResponse(null, 'If an account exists, an OTP has been sent.');
    }

    /**
     * Refresh Token
     *
     * Exchange a refresh token for new access and refresh tokens.
     * Reads the refresh_token from the httpOnly cookie, or falls back
     * to the request body for backwards compatibility.
     */
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
