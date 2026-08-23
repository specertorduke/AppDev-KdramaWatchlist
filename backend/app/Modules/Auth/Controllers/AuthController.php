<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Requests\ChangePasswordRequest;
use App\Modules\Auth\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Auth\Requests\RegisterRequest;
use App\Modules\Auth\Requests\ResetPasswordRequest;
use App\Modules\Auth\Resources\UserResource;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => new UserResource($result['user']),
            'token'   => $result['token'],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return response()->json([
            'message' => 'Login successful',
            'user'    => new UserResource($result['user']),
            'token'   => $result['token'],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(new UserResource($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $this->authService->logoutAll($request->user());

        return response()->json([
            'message' => 'All sessions logged out successfully',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->forgotPassword($request->validated());

        return response()->json([
            'message' => __($status),
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->resetPassword(
            $request->only('email', 'password', 'password_confirmation', 'token')
        );

        return response()->json([
            'message' => __($status),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->authService->changePassword($request->user(), $request->password);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}