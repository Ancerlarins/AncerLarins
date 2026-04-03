<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required_without:email', 'nullable', 'string', 'regex:/^(\+234|0)[789]\d{9}$/'],
            'email' => ['required_without:phone', 'nullable', 'email'],
            'password' => ['nullable', 'string'],
            'channel' => ['nullable', 'string', 'in:email,sms'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Phone must be a valid Nigerian number.',
            'phone.required_without' => 'Phone or email is required.',
            'email.required_without' => 'Email or phone is required.',
        ];
    }
}
