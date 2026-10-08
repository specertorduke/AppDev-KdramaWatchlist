<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:255'],
            'username'               => ['nullable', 'string', 'max:30', 'unique:users,username'],
            'email'                  => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'               => ['required', 'string', Password::defaults(), 'confirmed'],
            'terms_privacy_accepted' => ['required', 'accepted'],
            'device_name'            => ['nullable', 'string', 'max:255'],
            'otp'                    => ['nullable', 'string', 'regex:/^[0-9]{6}$/'],
        ];
    }
}