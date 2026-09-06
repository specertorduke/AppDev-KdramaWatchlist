<?php

namespace App\Modules\Discover\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DiscoverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'page'     => ['nullable', 'integer', 'min:1', 'max:500'],
            'genre_id' => ['nullable', 'integer'],
            'search'   => ['nullable', 'string', 'max:255'],
            'query'    => ['nullable', 'string', 'max:255'],
        ];
    }
}
