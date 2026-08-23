<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user and generate an access token.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
        ]);

        $deviceName = $data['device_name'] ?? 'auth_token';
        $token = $user->createToken($deviceName)->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate a user and generate an access token.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     */
    public function login(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $deviceName = $data['device_name'] ?? 'auth_token';
        $token = $user->createToken($deviceName)->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Revoke the current access token for the user.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Revoke all access tokens for the user.
     */
    public function logoutAll(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Send a password reset link to the given email.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function forgotPassword(array $data): string
    {
        $status = Password::sendResetLink($data);

        if ($status === Password::RESET_LINK_SENT) {
            return $status;
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Reset the user's password using the given credentials and token.
     *
     * @param  array<string, mixed>  $credentials
     *
     * @throws ValidationException
     */
    public function resetPassword(array $credentials): string
    {
        $status = Password::reset(
            $credentials,
            function (User $user, string $password) {
                $user->password = $password;
                $user->setRememberToken(Str::random(60));
                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            $user = User::where('email', $credentials['email'])->first();
            if ($user) {
                // Invalidate all existing tokens on password reset for security
                $user->tokens()->delete();
            }

            return $status;
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(User $user, string $newPassword): void
    {
        $user->update([
            'password' => $newPassword,
        ]);
    }
}
