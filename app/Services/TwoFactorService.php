<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class TwoFactorService
{
    /**
     * Generate and persist a new secret for the given user.
     */
    public function generateSecret(User $user): string
    {
        $secret = $this->randomBase32(32);
        $user->update(['two_factor_secret' => $secret]);

        return $secret;
    }

    /**
     * Build a QR code URL for authenticator apps using the otpauth URI format.
     */
    public function getQRCodeUrl(User $user, string $secret): string
    {
        $issuer = urlencode(config('app.name', 'IzaManagement'));
        $label = urlencode($user->email);

        $otpauth = "otpauth://totp/{$issuer}:{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";

        // Consumers can convert this URI into an actual QR code on the client side.
        return $otpauth;
    }

    /**
     * Generate and persist recovery codes for the user.
     */
    public function generateRecoveryCodes(User $user, int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(Str::random(10));
        }

        $user->update(['two_factor_recovery_codes' => $codes]);

        return $codes;
    }

    /**
     * Verify a 6-digit TOTP code for a user.
     */
    public function verify(User $user, string $code): bool
    {
        $secret = $user->two_factor_secret;
        if (!$secret || strlen($code) !== 6 || !ctype_digit($code)) {
            return false;
        }

        // Allow small time drift: -1, 0, +1 time steps
        $timestamp = time();
        foreach ([-30, 0, 30] as $offset) {
            if ($this->generateTotpCode($secret, $timestamp + $offset) === $code) {
                return true;
            }
        }

        // Fallback to recovery codes (one-time use)
        $codes = is_array($user->two_factor_recovery_codes) ? $user->two_factor_recovery_codes : [];
        if (in_array(strtoupper($code), $codes, true)) {
            $remaining = array_values(array_diff($codes, [strtoupper($code)]));
            $user->update(['two_factor_recovery_codes' => $remaining]);
            return true;
        }

        return false;
    }

    private function generateTotpCode(string $base32Secret, int $timestamp): string
    {
        $secret = $this->base32Decode($base32Secret);
        $timeSlice = floor($timestamp / 30);
        $binaryTime = pack('N*', 0) . pack('N*', $timeSlice);

        $hash = hash_hmac('sha1', $binaryTime, $secret, true);
        $offset = ord(substr($hash, -1)) & 0x0F;

        $truncatedHash = substr($hash, $offset, 4);
        $value = unpack('N', $truncatedHash)[1] & 0x7FFFFFFF;

        $modulo = 10 ** 6;
        return str_pad((string) ($value % $modulo), 6, '0', STR_PAD_LEFT);
        }

    private function randomBase32(int $length = 32): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        return $secret;
    }

    private function base32Decode(string $base32): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $base32 = strtoupper($base32);
        $buffer = 0;
        $bitsLeft = 0;
        $result = '';

        for ($i = 0, $len = strlen($base32); $i < $len; $i++) {
            $val = strpos($alphabet, $base32[$i]);
            if ($val === false) {
                continue;
            }
            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $result .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $result;
    }
}