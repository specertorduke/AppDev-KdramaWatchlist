<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
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
            'name'                       => $data['name'],
            'email'                      => $data['email'],
            'password'                   => $data['password'],
            'terms_privacy_accepted'    => true,
            'terms_privacy_accepted_at' => now(),
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

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(User $user, string $newPassword): void
    {
        $user->update([
            'password' => $newPassword,
        ]);
    }

    /**
     * Delete the authenticated user's account and revoke tokens.
     */
    public function deleteAccount(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();
    }

    /**
     * Get aggregated tracker stats for the authenticated user.
     *
     * @return array<string, mixed>
     */
    public function getUserStats(User $user): array
    {
        $totalDramas = Tracker::where('user_id', $user->id)->count();
        $episodesWatched = (int) Tracker::where('user_id', $user->id)->sum('current_episode');
        $hoursWatched = round((float) $episodesWatched, 1);

        $avgRating = Tracker::where('user_id', $user->id)
            ->whereNotNull('rating')
            ->avg('rating');

        $averageRating = $avgRating !== null ? round((float) $avgRating, 1) : null;

        $statuses = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'];
        $statusCounts = Tracker::where('user_id', $user->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statusBreakdown = [];
        foreach ($statuses as $status) {
            $statusBreakdown[$status] = (int) ($statusCounts[$status] ?? 0);
        }

        return [
            'total_dramas'     => $totalDramas,
            'episodes_watched' => $episodesWatched,
            'hours_watched'    => $hoursWatched,
            'average_rating'   => $averageRating,
            'status_breakdown' => $statusBreakdown,
        ];
    }
}
