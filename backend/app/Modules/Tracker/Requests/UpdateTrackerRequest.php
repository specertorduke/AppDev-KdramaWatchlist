<?php

namespace App\Modules\Tracker\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTrackerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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
            'status'          => ['sometimes', 'string', 'in:watching,completed,plan_to_watch,on_hold,dropped'],
            'current_episode' => ['sometimes', 'integer', 'min:0'],
            'total_episodes'  => ['nullable', 'integer', 'min:1'],
            'rating'          => ['nullable', 'integer', 'min:1', 'max:10'],
            'review_notes'    => ['nullable', 'string', 'max:5000'],
            'rewatch_count'   => ['sometimes', 'integer', 'min:0', 'max:1000'],
            'is_favorite'     => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $current = $this->input('current_episode');
            $total = $this->input('total_episodes');

            if ($current !== null && $total !== null && (int) $current > (int) $total) {
                $v->errors()->add('current_episode', 'The current episode cannot exceed the total episodes.');
            }
        });
    }
}
