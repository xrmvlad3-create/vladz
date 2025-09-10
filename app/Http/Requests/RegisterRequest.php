<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','string','min:8','confirmed'],
            'specialization' => ['nullable','string','max:255'],
            'institution' => ['nullable','string','max:255'],
            'license_number' => ['nullable','string','max:100'],
            'phone' => ['nullable','string','max:20'],
            'country' => ['nullable','string','max:100'],
            'city' => ['nullable','string','max:100'],
        ];
    }
}