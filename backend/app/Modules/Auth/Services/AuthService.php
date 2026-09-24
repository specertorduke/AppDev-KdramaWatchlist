<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\Mail\VerifyEmailOtpMail;
use App\Modules\Auth\Models\EmailOtp;
use App\Modules\Auth\Models\User;
use App\Modules\Tracker\Models\Tracker;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user as unverified and dispatch an email OTP.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, requires_verification: bool}
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name'                       => $data['name'],
            'email'                      => $data['email'],
            'password'                   => $data['password'],
            'email_verified_at'          => null,
            'terms_privacy_accepted'    => true,
            'terms_privacy_accepted_at' => now(),
        ]);

        $this->sendEmailOtp($user);

        return [
            'user'                  => $user,
            'requires_verification' => true,
        ];
    }

    /**
     * Generate, store, and email a 6-digit OTP code to the user.
     */
    public function sendEmailOtp(User $user): void
    {
        $otp = (string) random_int(100000, 999999);

        EmailOtp::updateOrCreate(
            ['email' => $user->email],
            [
                'code_hash'  => Hash::make($otp),
                'attempts'   => 0,
                'expires_at' => now()->addMinutes(10),
            ]
        );

        Mail::to($user->email)->send(new VerifyEmailOtpMail($otp, $user->name));
    }

    /**
     * Verify the 6-digit OTP code and activate the user's account.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     */
    public function verifyOtp(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account associated with this email.'],
            ]);
        }

        $otpRecord = EmailOtp::where('email', $data['email'])->first();

        if (! $otpRecord || $otpRecord->isExpired()) {
            throw ValidationException::withMessages([
                'otp' => ['The verification code has expired or does not exist. Please request a new one.'],
            ]);
        }

        if ($otpRecord->hasExceededMaxAttempts()) {
            $otpRecord->delete();

            throw ValidationException::withMessages([
                'otp' => ['Too many invalid attempts. This code has been invalidated. Please request a new one.'],
            ]);
        }

        $otpRecord->increment('attempts');

        if (! Hash::check($data['otp'], $otpRecord->code_hash)) {
            throw ValidationException::withMessages([
                'otp' => ['The verification code is incorrect.'],
            ]);
        }

        // Successfully verified
        $otpRecord->delete();
        $user->update(['email_verified_at' => now()]);

        $deviceName = $data['device_name'] ?? 'auth_token';
        $token = $user->createToken($deviceName)->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Resend a fresh 6-digit OTP code if the user is unverified.
     *
     * @param  array<string, mixed>  $data
     * @return array{message: string}
     *
     * @throws ValidationException
     */
    public function resendOtp(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account associated with this email.'],
            ]);
        }

        if ($user->email_verified_at !== null) {
            throw ValidationException::withMessages([
                'email' => ['This email address is already verified.'],
            ]);
        }

        $latestOtp = EmailOtp::where('email', $data['email'])->first();
        if ($latestOtp && $latestOtp->updated_at && $latestOtp->updated_at->gt(now()->subSeconds(60))) {
            $secondsRemaining = 60 - (int) now()->diffInSeconds($latestOtp->updated_at);
            throw ValidationException::withMessages([
                'email' => ["Please wait {$secondsRemaining} seconds before requesting a new code."],
            ]);
        }

        $this->sendEmailOtp($user);

        return [
            'message' => 'A new verification code has been sent to your email.',
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

        if ($user->email_verified_at === null) {
            throw ValidationException::withMessages([
                'email' => ['Your email address has not been verified. Please verify your email using the OTP code sent to you.'],
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
