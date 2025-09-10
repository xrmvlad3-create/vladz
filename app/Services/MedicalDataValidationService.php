<?php

namespace App\Services;

class MedicalDataValidationService
{
    /**
     * Validate medical codes with simple pattern checks.
     * Returns ['valid' => bool, 'errors' => array].
     */
    public function validateCodes(array $codes): array
    {
        $errors = [];

        // ICD-10: e.g., A00, B15.1, C50.12
        if (!empty($codes['icd_10'])) {
            if (!preg_match('/^[A-TV-Z][0-9]{2}(?:\.[0-9A-Z]{1,4})?$/', (string) $codes['icd_10'])) {
                $errors['icd_10'] = 'Format ICD-10 invalid (ex: A00, B15.1).';
            }
        }

        // ICD-11: less strict, alphanumeric with optional dot segments
        if (!empty($codes['icd_11'])) {
            if (!preg_match('/^[A-Z0-9]{1,4}(?:\.[A-Z0-9]{1,4})*$/i', (string) $codes['icd_11'])) {
                $errors['icd_11'] = 'Format ICD-11 invalid.';
            }
        }

        // SNOMED CT: numeric only
        if (!empty($codes['snomed_ct'])) {
            if (!preg_match('/^[0-9]{3,20}$/', (string) $codes['snomed_ct'])) {
                $errors['snomed_ct'] = 'SNOMED CT trebuie să conțină doar cifre.';
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}