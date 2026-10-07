<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class SendSignupOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'name'     => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email address already exists. Please log in instead.',
        ];
    }
}
