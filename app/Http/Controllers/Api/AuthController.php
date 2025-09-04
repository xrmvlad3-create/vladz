<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private AuditLogService $auditLogService,
        private TwoFactorService $twoFactorService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            // Check rate limiting
            $key = 'register:' . $request->ip();
            if (RateLimiter::tooManyAttempts($key, 5)) {
                throw ValidationException::withMessages([
                    'email' => ['Prea multe încercări de înregistrare. Încercați din nou mai târziu.']
                ]);
            }

            RateLimiter::hit($key, 3600); // 1 hour

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'specialization' => $request->specialization,
                'institution' => $request->institution,
                'license_number' => $request->license_number,
                'phone' => $request->phone,
                'country' => $request->country ?? 'Romania',
                'city' => $request->city,
                'is_active' => true
            ]);

            // Assign default role
            $defaultRole = $request->specialization === 'Student' ? 'student' : 'doctor';
            $user->assignRole($defaultRole);

            // Send email verification
            $user->sendEmailVerificationNotification();

            $this->auditLogService->log(
                $user,
                'user_registered',
                'New user registered successfully',
                [
                    'email' => $user->email,
                    'specialization' => $user->specialization,
                    'institution' => $user->institution,
                    'ip_address' => $request->ip()
                ]
            );

            return response()->json([
                'message' => 'Înregistrarea a fost realizată cu succes. Vă rugăm să vă verificați email-ul.',
                'user' => $user->only(['id', 'name', 'email', 'specialization']),
                'requires_email_verification' => true
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la înregistrare',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            // Check rate limiting
            $key = 'login:' . $request->ip() . ':' . $request->email;
            if (RateLimiter::tooManyAttempts($key, 10)) {
                throw ValidationException::withMessages([
                    'email' => ['Prea multe încercări de autentificare. Încercați din nou în 15 minute.']
                ]);
            }

            if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
                RateLimiter::hit($key, 900); // 15 minutes

                throw ValidationException::withMessages([
                    'email' => ['Credențialele nu sunt corecte.']
                ]);
            }

            $user = Auth::user();

            // Check if user is active
            if (!$user->is_active) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'email' => ['Contul dumneavoastră a fost dezactivat.']
                ]);
            }

            // Clear rate limiting on successful login
            RateLimiter::clear($key);

            // Check if 2FA is enabled
            if ($user->two_factor_secret && $user->two_factor_confirmed_at) {
                if (!$request->two_factor_code) {
                    return response()->json([
                        'message' => 'Cod 2FA necesar',
                        'requires_2fa' => true,
                        'temp_token' => $user->createToken('2fa-temp', ['2fa-verify'], now()->addMinutes(5))->plainTextToken
                    ]);
                }

                if (!$this->twoFactorService->verify($user, $request->two_factor_code)) {
                    throw ValidationException::withMessages([
                        'two_factor_code' => ['Codul 2FA nu este valid.']
                    ]);
                }
            }

            // Create API token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Update last login
            $user->updateLastLogin();

            // Log successful login
            $this->auditLogService->log(
                $user,
                'user_login',
                'User logged in successfully',
                [
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    '2fa_used' => !empty($request->two_factor_code)
                ]
            );

            return response()->json([
                'message' => 'Autentificare reușită',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'specialization' => $user->specialization,
                    'institution' => $user->institution,
                    'avatar' => $user->avatar,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'has_completed_profile' => $user->hasCompletedProfile(),
                    'total_cme_credits' => $user->getTotalCmeCredits(),
                    'last_login_at' => $user->last_login_at
                ],
                'token' => $token,
                'expires_at' => now()->addDays(30)
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la autentificare',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function verify2FA(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();

        if (!$this->twoFactorService->verify($user, $request->code)) {
            throw ValidationException::withMessages([
                'code' => ['Codul 2FA nu este valid.']
            ]);
        }

        // Revoke temp token and create full access token
        $user->currentAccessToken()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Verificare 2FA reușită',
            'token' => $token
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Log logout
            $this->auditLogService->log(
                $user,
                'user_logout',
                'User logged out',
                ['ip_address' => $request->ip()]
            );

            // Revoke current token or all tokens
            if ($request->boolean('all_devices')) {
                $user->tokens()->delete();
                $message = 'Deconectare reușită de pe toate dispozitivele';
            } else {
                $request->user()->currentAccessToken()->delete();
                $message = 'Deconectare reușită';
            }

            return response()->json(['message' => $message]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la deconectare',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            // Rate limiting
            $key = 'forgot-password:' . $request->ip();
            if (RateLimiter::tooManyAttempts($key, 3)) {
                throw ValidationException::withMessages([
                    'email' => ['Prea multe cereri de resetare. Încercați din nou în 1 oră.']
                ]);
            }

            RateLimiter::hit($key, 3600); // 1 hour

            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Link-ul de resetare a fost trimis pe email.'
                ]);
            }

            return response()->json([
                'message' => 'Nu am putut trimite link-ul de resetare.',
                'error' => __($status)
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la trimiterea link-ului de resetare',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => Hash::make($password)
                    ])->save();

                    $user->tokens()->delete(); // Revoke all tokens
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'message' => 'Parola a fost resetată cu succes.'
                ]);
            }

            return response()->json([
                'message' => 'Eroare la resetarea parolei.',
                'error' => __($status)
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la resetarea parolei',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'permissions']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'specialization' => $user->specialization,
                'institution' => $user->institution,
                'license_number' => $user->license_number,
                'phone' => $user->phone,
                'country' => $user->country,
                'city' => $user->city,
                'bio' => $user->bio,
                'avatar' => $user->avatar,
                'is_active' => $user->is_active,
                'email_verified_at' => $user->email_verified_at,
                'last_login_at' => $user->last_login_at,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'has_completed_profile' => $user->hasCompletedProfile(),
                'completed_courses' => $user->getCompletedCoursesCount(),
                'total_cme_credits' => $user->getTotalCmeCredits(),
                'monthly_ai_usage' => $user->getMonthlyAiUsage(),
                'can_access_ai' => $user->canAccessAi(),
                'has_exceeded_ai_limits' => $user->hasExceededAiLimits(),
                'two_factor_enabled' => !empty($user->two_factor_secret)
            ]
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'specialization' => 'sometimes|string|max:255',
            'institution' => 'sometimes|string|max:255',
            'license_number' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:20',
            'city' => 'sometimes|string|max:100',
            'bio' => 'sometimes|string|max:1000',
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        try {
            $user = $request->user();
            $originalData = $user->toArray();

            $updateData = $request->only([
                'name', 'specialization', 'institution', 'license_number',
                'phone', 'city', 'bio'
            ]);

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $filename = 'avatars/' . $user->id . '.' . $avatar->getClientOriginalExtension();
                $avatar->storeAs('public', $filename);
                $updateData['avatar'] = $filename;
            }

            $user->update($updateData);

            // Log profile update
            $this->auditLogService->log(
                $user,
                'profile_updated',
                'User profile updated',
                [
                    'changes' => array_diff_assoc($updateData, $originalData),
                    'ip_address' => $request->ip()
                ]
            );

            return response()->json([
                'message' => 'Profilul a fost actualizat cu succes',
                'user' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la actualizarea profilului',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Parola curentă nu este corectă.']
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Revoke all tokens except current
        $currentTokenId = $request->user()->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        // Log password change
        $this->auditLogService->log(
            $user,
            'password_changed',
            'User changed password',
            ['ip_address' => $request->ip()]
        );

        return response()->json([
            'message' => 'Parola a fost schimbată cu succes'
        ]);
    }

    public function enable2FA(Request $request): JsonResponse
    {
        $user = $request->user();

        $secret = $this->twoFactorService->generateSecret($user);
        $qrCodeUrl = $this->twoFactorService->getQRCodeUrl($user, $secret);

        return response()->json([
            'secret' => $secret,
            'qr_code' => $qrCodeUrl,
            'recovery_codes' => $this->twoFactorService->generateRecoveryCodes($user)
        ]);
    }

    public function confirm2FA(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();

        if (!$this->twoFactorService->verify($user, $request->code)) {
            throw ValidationException::withMessages([
                'code' => ['Codul 2FA nu este valid.']
            ]);
        }

        $user->update([
            'two_factor_confirmed_at' => now()
        ]);

        $this->auditLogService->log(
            $user,
            '2fa_enabled',
            'Two-factor authentication enabled',
            ['ip_address' => $request->ip()]
        );

        return response()->json([
            'message' => 'Autentificarea cu doi factori a fost activată cu succes'
        ]);
    }

    public function disable2FA(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string'
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Parola nu este corectă.']
            ]);
        }

        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null
        ]);

        $this->auditLogService->log(
            $user,
            '2fa_disabled',
            'Two-factor authentication disabled',
            ['ip_address' => $request->ip()]
        );

        return response()->json([
            'message' => 'Autentificarea cu doi factori a fost dezactivată'
        ]);
    }

    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Create new token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'expires_at' => now()->addDays(30)
        ]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer',
            'hash' => 'required|string'
        ]);

        $user = User::findOrFail($request->id);

        if (!hash_equals(sha1($user->getEmailForVerification()), $request->hash)) {
            throw ValidationException::withMessages([
                'email' => ['Link-ul de verificare nu este valid.']
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email-ul este deja verificat'
            ]);
        }

        $user->markEmailAsVerified();

        $this->auditLogService->log(
            $user,
            'email_verified',
            'User verified email address',
            ['ip_address' => $request->ip()]
        );

        return response()->json([
            'message' => 'Email-ul a fost verificat cu succes'
        ]);
    }
}
