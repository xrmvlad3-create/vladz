<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'email' => ['required','email','max:255'],
            'password' => ['required','string','min:8'],
            'remember' => ['sometimes','boolean'],
            'two_factor_code' => ['nullable','string','size:6'],
        ];
    }
}