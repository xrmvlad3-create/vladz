<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'email' => ['required','email','exists:users,email'],
            'token' => ['required','string'],
            'password' => ['required','string','min:8','confirmed']
        ];
    }
}