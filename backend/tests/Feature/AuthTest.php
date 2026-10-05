<?php

namespace Tests\Feature;

use App\Modules\Auth\Mail\VerifyEmailOtpMail;
use App\Modules\Auth\Models\EmailOtp;
use App\Modules\Auth\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'John Doe',
            'email'                  => 'john@example.com',
            'password'               => 'Kdrama@SecurePass2026!',
            'password_confirmation'  => 'Kdrama@SecurePass2026!',
            'terms_privacy_accepted' => true,
            'device_name'            => 'mobile-app',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                'requires_verification',
            ])
            ->assertJson([
                'requires_verification' => true,
            ]);

        $this->assertDatabaseHas('users', [
            'email'                  => 'john@example.com',
            'email_verified_at'      => null,
            'terms_privacy_accepted' => true,
        ]);

        $this->assertDatabaseHas('email_otps', [
            'email' => 'john@example.com',
        ]);

        Mail::assertSent(VerifyEmailOtpMail::class, function ($mail) {
            return $mail->hasTo('john@example.com') && strlen($mail->otp) === 6;
        });

        $user = User::where('email', 'john@example.com')->first();
        $this->assertCount(0, $user->tokens);
        $this->assertTrue($user->terms_privacy_accepted);
        $this->assertNotNull($user->terms_privacy_accepted_at);
    }

    public function test_user_cannot_register_without_accepting_terms_and_privacy(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'John Doe',
            'email'                 => 'john@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['terms_privacy_accepted']);
    }

    public function test_user_cannot_register_when_terms_and_privacy_is_false(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'John Doe',
            'email'                  => 'john@example.com',
            'password'               => 'password123',
            'password_confirmation'  => 'password123',
            'terms_privacy_accepted' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['terms_privacy_accepted']);
    }

    public function test_user_registration_stores_acceptance_and_timestamp(): void
    {
        Mail::fake();

        $beforeRegistration = now()->subSecond();

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'Jane Doe',
            'email'                  => 'jane.agreement@example.com',
            'password'               => 'Kdrama@SecurePass2026!',
            'password_confirmation'  => 'Kdrama@SecurePass2026!',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email'                  => 'jane.agreement@example.com',
            'terms_privacy_accepted' => true,
        ]);

        $user = User::where('email', 'jane.agreement@example.com')->first();
        $this->assertTrue($user->terms_privacy_accepted);
        $this->assertNotNull($user->terms_privacy_accepted_at);
        $this->assertTrue($user->terms_privacy_accepted_at->greaterThanOrEqualTo($beforeRegistration));
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'Another John',
            'email'                  => 'john@example.com',
            'password'               => 'password123',
            'password_confirmation'  => 'password123',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'       => 'jane@example.com',
            'password'    => 'password123',
            'device_name' => 'react-web',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                'token',
            ]);

        $this->assertEquals('react-web', $user->tokens()->latest()->first()->name);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email'    => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'jane@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'id'    => $user->id,
                'email' => $user->email,
            ]);
    }

    public function test_authenticated_user_can_logout_current_session(): void
    {
        $user = User::factory()->create();
        $token1 = $user->createToken('token1')->plainTextToken;
        $user->createToken('token2')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);

        $this->assertCount(1, $user->tokens()->get());
    }

    public function test_authenticated_user_can_logout_all_sessions(): void
    {
        $user = User::factory()->create();
        $token1 = $user->createToken('token1')->plainTextToken;
        $user->createToken('token2')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->postJson('/api/v1/auth/logout-all');

        $response->assertStatus(200)
            ->assertJson(['message' => 'All sessions logged out successfully']);

        $this->assertCount(0, $user->tokens()->get());
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => 'OldKdrama@Pass2026!',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'OldKdrama@Pass2026!',
                'password'              => 'NewKdrama@Pass2026#',
                'password_confirmation' => 'NewKdrama@Pass2026#',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password changed successfully']);

        // Verify login with new password
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'NewKdrama@Pass2026#',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_user_cannot_change_password_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'OldKdrama@Pass2026!',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'wrongpassword',
                'password'              => 'NewKdrama@Pass2026#',
                'password_confirmation' => 'NewKdrama@Pass2026#',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_user_can_request_forgot_password_link(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'forgot@example.com']);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'forgot@example.com',
        ]);

        $response->assertStatus(200);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email'    => 'reset@example.com',
            'password' => 'OldKdrama@Pass2026!',
        ]);
        $user->createToken('active_token');

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token'                 => $token,
            'email'                 => 'reset@example.com',
            'password'              => 'BrandNew@Pass2026#',
            'password_confirmation' => 'BrandNew@Pass2026#',
        ]);

        $response->assertStatus(200);

        // Verify that old tokens were invalidated
        $this->assertCount(0, $user->tokens()->get());

        // Verify login with new password
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => 'reset@example.com',
            'password' => 'BrandNew@Pass2026#',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_user_cannot_reset_password_with_invalid_token(): void
    {
        User::factory()->create([
            'email' => 'reset_fail@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token'                 => 'invalid-token',
            'email'                 => 'reset_fail@example.com',
            'password'              => 'BrandNew@Pass2026#',
            'password_confirmation' => 'BrandNew@Pass2026#',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_verify_email_with_valid_otp(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'otp_user@example.com',
        ]);

        EmailOtp::create([
            'email'      => 'otp_user@example.com',
            'code_hash'  => Hash::make('123456'),
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'email'       => 'otp_user@example.com',
            'otp'         => '123456',
            'device_name' => 'mobile_test',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
            ]);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseMissing('email_otps', [
            'email' => 'otp_user@example.com',
        ]);
        $this->assertCount(1, $user->tokens);
    }

    public function test_user_cannot_verify_with_invalid_otp(): void
    {
        User::factory()->unverified()->create([
            'email' => 'otp_fail@example.com',
        ]);

        $otpRecord = EmailOtp::create([
            'email'      => 'otp_fail@example.com',
            'code_hash'  => Hash::make('123456'),
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'email' => 'otp_fail@example.com',
            'otp'   => '999999',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $otpRecord->refresh();
        $this->assertEquals(1, $otpRecord->attempts);
    }

    public function test_user_cannot_verify_with_expired_otp(): void
    {
        User::factory()->unverified()->create([
            'email' => 'otp_expired@example.com',
        ]);

        EmailOtp::create([
            'email'      => 'otp_expired@example.com',
            'code_hash'  => Hash::make('123456'),
            'attempts'   => 0,
            'expires_at' => now()->subMinute(),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'email' => 'otp_expired@example.com',
            'otp'   => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    }

    public function test_otp_is_invalidated_after_max_attempts(): void
    {
        User::factory()->unverified()->create([
            'email' => 'otp_max@example.com',
        ]);

        EmailOtp::create([
            'email'      => 'otp_max@example.com',
            'code_hash'  => Hash::make('123456'),
            'attempts'   => 5,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'email' => 'otp_max@example.com',
            'otp'   => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $this->assertDatabaseMissing('email_otps', [
            'email' => 'otp_max@example.com',
        ]);
    }

    public function test_user_can_resend_otp(): void
    {
        Mail::fake();

        User::factory()->unverified()->create([
            'name'  => 'Resend User',
            'email' => 'resend@example.com',
        ]);

        $otpRecord = EmailOtp::create([
            'email'      => 'resend@example.com',
            'code_hash'  => Hash::make('111111'),
            'attempts'   => 2,
            'expires_at' => now()->addMinutes(10),
        ]);
        // Set updated_at to > 60 seconds ago
        $otpRecord->updated_at = now()->subSeconds(70);
        $otpRecord->save();

        $response = $this->postJson('/api/v1/auth/resend-otp', [
            'email' => 'resend@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        Mail::assertSent(VerifyEmailOtpMail::class);

        $otpRecord->refresh();
        $this->assertEquals(0, $otpRecord->attempts);
        $this->assertFalse(Hash::check('111111', $otpRecord->code_hash));
    }

    public function test_resend_otp_enforces_cooldown(): void
    {
        Mail::fake();

        User::factory()->unverified()->create([
            'email' => 'cooldown@example.com',
        ]);

        EmailOtp::create([
            'email'      => 'cooldown@example.com',
            'code_hash'  => Hash::make('111111'),
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/resend-otp', [
            'email' => 'cooldown@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_resend_otp_fails_if_already_verified(): void
    {
        User::factory()->create([
            'email'             => 'verified@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/resend-otp', [
            'email' => 'verified@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_unverified_user_cannot_login(): void
    {
        User::factory()->unverified()->create([
            'email'    => 'unverified@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'unverified@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_send_signup_otp_prior_to_registration(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/send-signup-otp', [
            'email' => 'newuser@example.com',
            'name'  => 'New User',
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Verification code sent to your email.']);

        $this->assertDatabaseHas('email_otps', [
            'email' => 'newuser@example.com',
        ]);

        // User must NOT be created yet in the database
        $this->assertDatabaseMissing('users', [
            'email' => 'newuser@example.com',
        ]);

        Mail::assertSent(VerifyEmailOtpMail::class, function ($mail) {
            return $mail->hasTo('newuser@example.com');
        });
    }

    public function test_user_cannot_send_signup_otp_if_email_already_registered(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/v1/auth/send-signup-otp', [
            'email' => 'existing@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_register_directly_with_valid_otp_in_form(): void
    {
        EmailOtp::create([
            'email'      => 'inform@example.com',
            'code_hash'  => Hash::make('654321'),
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'In Form User',
            'email'                  => 'inform@example.com',
            'password'               => 'Kdrama@SecurePass2026!',
            'password_confirmation'  => 'Kdrama@SecurePass2026!',
            'terms_privacy_accepted' => true,
            'otp'                    => '654321',
            'device_name'            => 'mobile-app',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
                'requires_verification',
            ])
            ->assertJson([
                'requires_verification' => false,
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'inform@example.com',
        ]);

        $user = User::where('email', 'inform@example.com')->first();
        $this->assertNotNull($user->email_verified_at);
        $this->assertCount(1, $user->tokens);

        // OTP should be deleted upon successful registration
        $this->assertDatabaseMissing('email_otps', [
            'email' => 'inform@example.com',
        ]);
    }

    public function test_user_cannot_register_with_incorrect_otp_in_form(): void
    {
        EmailOtp::create([
            'email'      => 'inform_fail@example.com',
            'code_hash'  => Hash::make('654321'),
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'Failed User',
            'email'                  => 'inform_fail@example.com',
            'password'               => 'Kdrama@SecurePass2026!',
            'password_confirmation'  => 'Kdrama@SecurePass2026!',
            'terms_privacy_accepted' => true,
            'otp'                    => '000000',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        // User must NOT be created
        $this->assertDatabaseMissing('users', [
            'email' => 'inform_fail@example.com',
        ]);
    }

    public function test_registration_requires_password_with_min_8_chars(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'Short Pass',
            'email'                  => 'short@example.com',
            'password'               => 'Ab1!',
            'password_confirmation'  => 'Ab1!',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_password_with_uppercase_and_lowercase(): void
    {
        // Missing uppercase
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'No Upper',
            'email'                  => 'noupper@example.com',
            'password'               => 'nouppercase123!',
            'password_confirmation'  => 'nouppercase123!',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // Missing lowercase
        $response2 = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'No Lower',
            'email'                  => 'nolower@example.com',
            'password'               => 'NOLOWERCASE123!',
            'password_confirmation'  => 'NOLOWERCASE123!',
            'terms_privacy_accepted' => true,
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_password_with_number(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'No Number',
            'email'                  => 'nonumber@example.com',
            'password'               => 'NoNumbersInPassword!',
            'password_confirmation'  => 'NoNumbersInPassword!',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_password_with_symbol(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'No Symbol',
            'email'                  => 'nosymbol@example.com',
            'password'               => 'NoSymbolsInPass123',
            'password_confirmation'  => 'NoSymbolsInPass123',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_matching_password_confirmation(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                   => 'Mismatch',
            'email'                  => 'mismatch@example.com',
            'password'               => 'Kdrama@SecurePass2026!',
            'password_confirmation'  => 'Different@SecurePass2026#',
            'terms_privacy_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_change_password_requires_different_new_password(): void
    {
        $user = User::factory()->create([
            'password' => 'OldKdrama@Pass2026!',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'OldKdrama@Pass2026!',
                'password'              => 'OldKdrama@Pass2026!',
                'password_confirmation' => 'OldKdrama@Pass2026!',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
