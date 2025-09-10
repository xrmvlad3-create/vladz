<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Groq AI service configuration (used by App\Services\GroqAiService)
    'groq' => [
        'api_key'      => env('GROQ_API_KEY'),
        'base_url'     => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
        'default_model'=> env('GROQ_DEFAULT_MODEL', 'llama-3.1-70b-versatile'),
        'timeout'      => (int) env('GROQ_TIMEOUT', 60),
        'max_tokens'   => (int) env('GROQ_MAX_TOKENS', 2000),
    ],

    // Ollama local AI service configuration (used by App\Services\OllamaService)
    'ollama' => [
        'base_url'     => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
        'default_model'=> env('OLLAMA_DEFAULT_MODEL', 'llama3.1:8b'),
        'timeout'      => (int) env('OLLAMA_TIMEOUT', 120),
    ],

];
