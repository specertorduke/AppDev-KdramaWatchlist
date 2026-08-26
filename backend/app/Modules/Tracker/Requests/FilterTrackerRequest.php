<?php

namespace App\Modules\Tracker\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FilterTrackerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('favorite')) {
            $fav = $this->input('favorite');
            if (is_string($fav)) {
                $lower = strtolower(trim($fav));
                if (in_array($lower, ['true', '1'], true)) {
                    $this->merge(['favorite' => true]);
                } elseif (in_array($lower, ['false', '0'], true)) {
                    $this->merge(['favorite' => false]);
                }
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status'   => ['nullable', 'string', 'in:all,watching,completed,plan_to_watch,on_hold,dropped'],
            'favorite' => ['nullable', 'boolean'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
