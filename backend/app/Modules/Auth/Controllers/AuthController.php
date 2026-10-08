<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Requests\ChangePasswordRequest;
use App\Modules\Auth\Requests\DeleteAccountRequest;
use App\Modules\Auth\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Auth\Requests\RegisterRequest;
use App\Modules\Auth\Requests\ResendOtpRequest;
use App\Modules\Auth\Requests\ResetPasswordRequest;
use App\Modules\Auth\Requests\SendSignupOtpRequest;
use App\Modules\Auth\Requests\UpdatePasswordRequest;
use App\Modules\Auth\Requests\VerifyOtpRequest;
use App\Modules\Auth\Resources\UserResource;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function sendSignupOtp(SendSignupOtpRequest $request): JsonResponse
    {
        $result = $this->authService->sendSignupOtp($request->validated());

        return response()->json($result);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        $requiresVerification = $result['requires_verification'] ?? false;
        $response = [
            'message'               => $requiresVerification
                ? 'Registration successful. A verification code has been sent to your email.'
                : 'Registration successful. Your email has been verified.',
            'user'                  => new UserResource($result['user']),
            'requires_verification' => $requiresVerification,
        ];

        if (! empty($result['token'])) {
            $response['token'] = $result['token'];
        }

        return response()->json($response, 201);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $result = $this->authService->verifyOtp($request->validated());

        return response()->json([
            'message' => 'Email verified successfully.',
            'user'    => new UserResource($result['user']),
            'token'   => $result['token'],
        ]);
    }

    public function resendOtp(ResendOtpRequest $request): JsonResponse
    {
        $result = $this->authService->resendOtp($request->validated());

        return response()->json($result);
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

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = $this->authService->getUserStats($user);

        return response()->json([
            'user'  => new UserResource($user),
            'stats' => $stats,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'nullable|string|max:50',
            'username'   => 'nullable|string|max:30|unique:users,username,' . $request->user()->id,
            'avatar_url' => 'nullable|string',
        ]);

        $user = $request->user();
        $user->update(array_filter($validated, fn ($val) => $val !== null));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => new UserResource($user),
        ]);
    }

    public function requestEmailChange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'new_email' => 'required|email|max:255',
            'password'  => 'required|string',
        ]);

        $result = $this->authService->requestEmailChange($request->user(), $validated);

        return response()->json($result);
    }

    public function verifyEmailChange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'new_email' => 'required|email|max:255',
            'otp'       => 'required|string|size:6',
        ]);

        $result = $this->authService->verifyEmailChange($request->user(), $validated);

        return response()->json([
            'message' => $result['message'],
            'user'    => new UserResource($result['user']),
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'favorite_genres'   => 'nullable|array',
            'favorite_genres.*' => 'string|max:50',
            'avatar_url'        => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        
        if (isset($validated['favorite_genres'])) {
            $genreIds = [];
            foreach ($validated['favorite_genres'] as $genreName) {
                $genre = \App\Modules\Discover\Models\Genre::firstOrCreate(
                    ['name' => $genreName],
                    ['slug' => \Illuminate\Support\Str::slug($genreName)]
                );
                $genreIds[] = $genre->id;
            }
            $user->favoriteGenres()->sync($genreIds);
            unset($validated['favorite_genres']);
        }
        
        if (!empty($validated)) {
            $user->update($validated);
        }

        return response()->json([
            'message' => 'Preferences updated successfully',
            'user'    => new UserResource($user),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = $this->authService->getUserStats($user);

        return response()->json([
            'user'  => new UserResource($user),
            'stats' => $stats,
        ]);
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

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $this->authService->updatePassword($request->user(), $request->password);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function deleteAccount(DeleteAccountRequest $request): JsonResponse
    {
        $this->authService->deleteAccount($request->user());

        return response()->json([
            'message' => 'Account deleted successfully.',
        ]);
    }
}