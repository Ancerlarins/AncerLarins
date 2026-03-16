<?php

namespace App\Http\Requests\Auth;

use App\Enums\UserRole;
use App\Rules\Turnstile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->phone) {
            $phone = preg_replace('/[\s\-\(\)]+/', '', $this->phone);
            if (str_starts_with($phone, '0')) {
                $phone = '+234'.substr($phone, 1);
            } elseif (str_starts_with($phone, '234') && ! str_starts_with($phone, '+')) {
                $phone = '+'.$phone;
            }
            $this->merge(['phone' => $phone]);
        }
    }

    public function rules(): array
    {
        $rules = [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^(\+234|0)[789]\d{9}$/', 'unique:users,phone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', Password::min(10)->mixedCase()->numbers()->symbols()],
            'role' => ['sometimes', Rule::in([UserRole::User->value, UserRole::Agent->value])],
        ];

        if (config('services.turnstile.secret_key')) {
            $rules['turnstile_token'] = ['required', new Turnstile];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Phone must be a valid Nigerian number (e.g. +2347012345678 or 07012345678).',
            'phone.unique' => 'This phone number is already registered. Please sign in instead.',
            'turnstile_token.required' => 'Please complete the security check.',
        ];
    }
}
