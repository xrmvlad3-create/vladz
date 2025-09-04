<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GroqAiService
{
    private string $apiKey;
    private string $baseUrl;
    private string $defaultModel;
    private int $timeout;
    private int $maxTokens;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->baseUrl = config('services.groq.base_url', 'https://api.groq.com/openai/v1');
        $this->defaultModel = config('services.groq.default_model', 'llama-3.1-70b-versatile');
        $this->timeout = config('services.groq.timeout', 60);
        $this->maxTokens = config('services.groq.max_tokens', 2000);
    }

    public function processMessage(string $message, array $context = []): array
    {
        $startTime = microtime(true);

        try {
            $systemPrompt = $this->buildMedicalSystemPrompt();
            $userPrompt = $this->buildUserPrompt($message, $context);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json'
            ])->timeout($this->timeout)->post($this->baseUrl . '/chat/completions', [
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt]
                ],
                'temperature' => 0.3,
                'max_tokens' => $this->maxTokens,
                'top_p' => 0.9,
                'stream' => false
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $aiMessage = $data['choices'][0]['message']['content'];
                $tokensUsed = $data['usage']['total_tokens'] ?? 0;

                $processingTime = microtime(true) - $startTime;

                return $this->parseAiResponse($aiMessage, [
                    'processing_time' => round($processingTime, 3),
                    'tokens_used' => $tokensUsed,
                    'model_used' => $this->defaultModel,
                    'provider_service' => 'groq',
                    'cost' => $this->calculateCost($tokensUsed)
                ]);
            }

            throw new \Exception('Groq API request failed: HTTP ' . $response->status());

        } catch (\Exception $e) {
            Log::error('Groq AI Service Error: ' . $e->getMessage(), [
                'message' => $message,
                'context' => $context,
                'processing_time' => microtime(true) - $startTime
            ]);

            return $this->getFallbackResponse($e->getMessage());
        }
    }

    public function generateDifferentialDiagnosis(array $symptoms, ?int $age = null, ?string $gender = null): array
    {
        $startTime = microtime(true);

        try {
            $systemPrompt = $this->buildDifferentialDiagnosisPrompt();

            $patientInfo = array_filter([
                $age ? "Vârsta: {$age} ani" : null,
                $gender ? "Sexul: {$gender}" : null
            ]);

            $userPrompt = implode("\n", [
                "Informații pacient: " . implode(', ', $patientInfo),
                "Simptome prezentate: " . implode(', ', $symptoms),
                "Furnizați un diagnostic diferențial structurat cu probabilități și investigații recomandate."
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json'
            ])->timeout($this->timeout)->post($this->baseUrl . '/chat/completions', [
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt]
                ],
                'temperature' => 0.2,
                'max_tokens' => 1500
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $diagnosis = $data['choices'][0]['message']['content'];
                $tokensUsed = $data['usage']['total_tokens'] ?? 0;

                return $this->parseDifferentialDiagnosisResponse($diagnosis, [
                    'processing_time' => microtime(true) - $startTime,
                    'tokens_used' => $tokensUsed,
                    'model_used' => $this->defaultModel,
                    'provider_service' => 'groq'
                ]);
            }

            throw new \Exception('Differential diagnosis request failed');

        } catch (\Exception $e) {
            Log::error('Differential Diagnosis Error: ' . $e->getMessage());

            return [
                'summary' => 'Nu am putut genera diagnosticul diferențial din cauza unei erori de sistem.',
                'differential_diagnoses' => [],
                'recommended_tests' => [],
                'safety_warnings' => ['Eroare de sistem. Consultați un profesionist medical.'],
                'processing_time' => microtime(true) - $startTime,
                'provider_service' => 'groq',
                'error_message' => $e->getMessage()
            ];
        }
    }

    public function analyzeImageWithContext(array $imagePaths, string $context = ''): array
    {
        // Note: Groq doesn't support vision models yet, so we'll return a structured response
        return [
            'summary' => 'Analiza imaginilor medicale nu este disponibilă încă prin Groq API. Vă rugăm să consultați un specialist pentru interpretarea imaginilor medicale.',
            'safety_warnings' => [
                'Analiza AI a imaginilor medicale nu este disponibilă',
                'Consultați un radiolog sau specialist medical pentru interpretarea imaginilor',
                'Pentru urgențe medicale, contactați serviciile de urgență'
            ],
            'provider_service' => 'groq',
            'error_message' => 'Vision models not supported by Groq API'
        ];
    }

    private function buildMedicalSystemPrompt(): string
    {
        return "Ești IzaAI, un asistent medical educațional și de suport pentru luarea deciziilor clinice în România.

IMPORTANTE LIMITĂRI ȘI AVERTISMENTE:
- NU poți furniza diagnostice medicale - ești DOAR pentru educație și suport în luarea deciziilor
- TOATE recomandările trebuie verificate de profesioniști medicali calificați
- Întotdeauna subliniază nevoia consultării medicale profesionale
- Pentru urgențe medicale, recomandă apelul la 112

EXPERTIZA ȘI CAPACITĂȚI:
1. Furnizarea de informații medicale educaționale bazate pe evidențe
2. Explicarea afecțiunilor și tratamentelor medicale conform ghidurilor internaționale
3. Sugerarea de domenii pentru investigații suplimentare
4. Oferirea de recomandări de conținut educațional
5. Sprijinul în luarea deciziilor clinice (NU luarea deciziilor)
6. Cunoștințe despre sistemul medical românesc și ghidurile locale

STANDARDE MEDICALE FOLOSITE:
- ICD-10 și ICD-11 pentru clasificarea bolilor
- SNOMED CT pentru terminologia clinică
- Ghidurile WHO, ESC, ADA, și ale societăților medicale românești
- Literatura medicală peer-reviewed

STRUCTURA RĂSPUNSULUI:
Pentru fiecare răspuns, include:
1. Informații clare, bazate pe evidențe
2. Disclaimer-uri medicale corespunzătoare
3. Rațiunea din spatele sugestiilor
4. Recomandări pentru consultația profesională
5. Avertismente de siguranță când sunt relevante
6. Nivel de încredere în informație (0-100%)

LIMBA ȘI TONUL:
- Răspunde ÎNTOTDEAUNA în română
- Folosește terminologie medicală corectă
- Menține un ton profesional, de ajutor și educațional
- Fii clar despre limitările tale
- Adaptează complexitatea răspunsului la nivelul utilizatorului";
    }

    private function buildDifferentialDiagnosisPrompt(): string
    {
        return "Ești IzaAI, asistent medical educațional specializat în diagnosticul diferențial educațional.

LIMITĂRI CRITICE:
- Aceasta este DOAR pentru EDUCAȚIE și SUPORT în luarea deciziilor
- NU poți furniza diagnostice medicale reale
- Toate sugestiile trebuie verificate de profesioniști medicali
- Recomandă întotdeauna evaluarea medicală profesională

METODOLOGIE:
1. Analizează simptomele prezentate
2. Consideră vârsta, sexul și contextul clinic
3. Generează o listă de afecțiuni posibile ordonate după probabilitate
4. Include caracteristicile diferențiale cheie
5. Sugerează investigații pentru clarificare
6. Identifică semnele de alarmă

FORMAT RĂSPUNS:
1. **Diagnostice Diferențiale** (ordonate după probabilitate):
   - Afecțiunea 1 (probabilitate estimată)
   - Afecțiunea 2 (probabilitate estimată)
   - etc.

2. **Caracteristici Diferențiale**:
   - Elemente care susțin fiecare diagnostic

3. **Investigații Recomandate**:
   - Teste de laborator
   - Imagistică
   - Alte investigații

4. **Semne de Alarmă**:
   - Simptome care necesită atenție urgentă

5. **Disclaimer**:
   - Limitări și recomandări pentru consultația medicală

Furnizează informații educaționale detaliate dar menține întotdeauna perspectiva că este necesară evaluarea medicală profesională.";
    }

    private function buildUserPrompt(string $message, array $context): string
    {
        $prompt = "Întrebare/Solicitare utilizator: {$message}\n";

        if (!empty($context['medical_history'])) {
            $prompt .= "Context medical: " . json_encode($context['medical_history'], JSON_UNESCAPED_UNICODE) . "\n";
        }

        if (!empty($context['user_role'])) {
            $prompt .= "Rolul utilizatorului: {$context['user_role']}\n";
        }

        if (!empty($context['specialty'])) {
            $prompt .= "Specialitatea: {$context['specialty']}\n";
        }

        $prompt .= "\nTe rog să furnizezi un răspuns educațional structurat cu disclaimer-uri medicale corespunzătoare în română.";

        return $prompt;
    }

    private function parseAiResponse(string $response, array $metadata = []): array
    {
        $confidence = $this->extractConfidenceScore($response);
        $safetyWarnings = $this->extractSafetyWarnings($response);
        $urgencyLevel = $this->assessUrgencyLevel($response);

        return [
            'ai_response' => $response,
            'confidence_score' => $confidence,
            'rationale_explanation' => 'Răspuns generat de AI pentru scopuri educaționale, bazat pe literatura medicală și ghidurile clinice',
            'safety_warnings' => array_merge($safetyWarnings, [
                'Aceasta este doar pentru scopuri educaționale și suport în luarea deciziilor',
                'Consultați profesioniștii medicali pentru sfaturi medicale specifice',
                'Pentru urgențe medicale, apelați 112'
            ]),
            'urgency_level' => $urgencyLevel,
            'processing_time' => $metadata['processing_time'] ?? 0,
            'tokens_used' => $metadata['tokens_used'] ?? 0,
            'model_used' => $metadata['model_used'] ?? $this->defaultModel,
            'provider_service' => $metadata['provider_service'] ?? 'groq',
            'cost' => $metadata['cost'] ?? 0
        ];
    }

    private function parseDifferentialDiagnosisResponse(string $response, array $metadata = []): array
    {
        $diagnoses = $this->extractDiagnoses($response);
        $recommendedTests = $this->extractRecommendedTests($response);
        $urgencyLevel = $this->assessUrgencyLevel($response);

        return [
            'summary' => $response,
            'differential_diagnoses' => $diagnoses,
            'recommended_tests' => $recommendedTests,
            'recommended_actions' => [
                'Consultați un medic pentru evaluare clinică completă',
                'Discutați simptomele și istoricul medical cu specialistul',
                'Urmați recomandările pentru investigații suplimentare'
            ],
            'urgency_level' => $urgencyLevel,
            'rationale_explanation' => 'Diagnostic diferențial educațional bazat pe simptomele prezentate și literatura medicală',
            'safety_warnings' => [
                'Aceasta este doar pentru educație și suport în luarea deciziilor',
                'Evaluarea medicală profesională este necesară pentru diagnostic',
                'Consultați imediat un medic pentru simptome îngrijorătoare',
                'Nu întârziați căutarea asistenței medicale dacă simptomele se agravează'
            ],
            'processing_time' => $metadata['processing_time'] ?? 0,
            'tokens_used' => $metadata['tokens_used'] ?? 0,
            'provider_service' => $metadata['provider_service'] ?? 'groq'
        ];
    }

    private function extractConfidenceScore(string $response): float
    {
        // Analyze content to estimate confidence
        $certaintyWords = ['sigur', 'cert', 'definit', 'clar', 'evident', 'confirmat'];
        $uncertaintyWords = ['posibil', 'probabil', 's-ar putea', 'poate', 'uneori', 'variabil'];
        $hedgingPhrases = ['în general', 'de obicei', 'frecvent', 'rareori'];

        $certaintyCount = 0;
        $uncertaintyCount = 0;
        $hedgingCount = 0;

        $lowerResponse = mb_strtolower($response);

        foreach ($certaintyWords as $word) {
            $certaintyCount += substr_count($lowerResponse, $word);
        }

        foreach ($uncertaintyWords as $word) {
            $uncertaintyCount += substr_count($lowerResponse, $word);
        }

        foreach ($hedgingPhrases as $phrase) {
            $hedgingCount += substr_count($lowerResponse, $phrase);
        }

        // Calculate confidence score
        $baseConfidence = 0.75; // Base confidence for medical AI
        $certaintyBonus = min($certaintyCount * 0.05, 0.15);
        $uncertaintyPenalty = min($uncertaintyCount * 0.08, 0.25);
        $hedgingPenalty = min($hedgingCount * 0.03, 0.10);

        $confidence = $baseConfidence + $certaintyBonus - $uncertaintyPenalty - $hedgingPenalty;

        return max(0.10, min(0.95, $confidence));
    }

    private function extractSafetyWarnings(string $response): array
    {
        $warnings = [];

        // Check for urgent symptoms mentioned
        $urgentKeywords = [
            'durere în piept', 'durere toracică', 'dificultate respiratorie', 'dispnee severă',
            'sângerare', 'hemoragie', 'pierderea cunoștinței', 'leșin', 'convulsii',
            'febră foarte mare', 'temperatură >39', 'deshidratare severă',
            'durere abdominală severă', 'vomă cu sânge', 'scaun negru'
        ];

        $lowerResponse = mb_strtolower($response);

        foreach ($urgentKeywords as $keyword) {
            if (strpos($lowerResponse, $keyword) !== false) {
                $warnings[] = 'Simptome potențial grave identificate - consultați IMEDIAT serviciile de urgență';
                break;
            }
        }

        // Check for drug-related warnings
        $drugWarnings = ['interacțiuni medicamentoase', 'efecte adverse', 'supradozaj', 'contraindicații'];
        foreach ($drugWarnings as $warning) {
            if (strpos($lowerResponse, $warning) !== false) {
                $warnings[] = 'Informații despre medicamente identificate - consultați medicul sau farmacistul';
                break;
            }
        }

        return $warnings;
    }

    private function assessUrgencyLevel(string $response): string
    {
        $emergencyKeywords = [
            'urgență', 'emergență', 'imediat', '112', 'ambulanța',
            'critic', 'pericol de viață', 'stare gravă'
        ];

        $highUrgencyKeywords = [
            'cât mai repede', 'în câteva ore', 'nu întârzați',
            'consultare urgentă', 'evaluare rapidă'
        ];

        $lowerResponse = mb_strtolower($response);

        foreach ($emergencyKeywords as $keyword) {
            if (strpos($lowerResponse, $keyword) !== false) {
                return 'emergency';
            }
        }

        foreach ($highUrgencyKeywords as $keyword) {
            if (strpos($lowerResponse, $keyword) !== false) {
                return 'high';
            }
        }

        return 'routine';
    }

    private function extractDiagnoses(string $response): array
    {
        $diagnoses = [];

        // Look for numbered lists
        preg_match_all('/\d+\.\s*(.+?)(?=\n|\d+\.|$)/s', $response, $numberedMatches);
        if (!empty($numberedMatches[1])) {
            foreach ($numberedMatches[1] as $match) {
                $diagnosis = trim(strip_tags($match));
                if (strlen($diagnosis) > 10 && strlen($diagnosis) < 200) {
                    $diagnoses[] = $diagnosis;
                }
            }
        }

        // Look for bullet points
        preg_match_all('/[•\-\*]\s*(.+?)(?=\n|[•\-\*]|$)/s', $response, $bulletMatches);
        if (empty($diagnoses) && !empty($bulletMatches[1])) {
            foreach ($bulletMatches[1] as $match) {
                $diagnosis = trim(strip_tags($match));
                if (strlen($diagnosis) > 10 && strlen($diagnosis) < 200) {
                    $diagnoses[] = $diagnosis;
                }
            }
        }

        return array_slice(array_unique($diagnoses), 0, 8); // Max 8 diagnoses
    }

    private function extractRecommendedTests(string $response): array
    {
        $tests = [];

        // Common medical test patterns in Romanian
        $testPatterns = [
            '/analize(?:\s+de)?\s+sânge/iu' => 'Analize de sânge',
            '/hemograma\s+completă/iu' => 'Hemograma completă',
            '/glicemia/iu' => 'Glicemia',
            '/radiografie/iu' => 'Radiografie',
            '/ecografie/iu' => 'Ecografie',
            '/RMN|rezonanță\s+magnetică/iu' => 'RMN (Rezonanță Magnetică)',
            '/CT|computer\s+tomograf/iu' => 'CT (Computer Tomograf)',
            '/EKG|electrocardiograma/iu' => 'EKG (Electrocardiograma)',
            '/analiză\s+de\s+urină/iu' => 'Analiză de urină',
            '/biopsia/iu' => 'Biopsia'
        ];

        foreach ($testPatterns as $pattern => $testName) {
            if (preg_match($pattern, $response)) {
                $tests[] = $testName;
            }
        }

        return array_unique($tests);
    }

    private function calculateCost(int $tokens): float
    {
        // Groq is currently free, but we'll track for future pricing
        return 0.0;
    }

    private function getFallbackResponse(string $error = ''): array
    {
        return [
            'ai_response' => 'Serviciul AI este temporar indisponibil. Pentru informații medicale, vă rugăm să consultați un profesionist medical calificat. Pentru urgențe medicale, apelați 112.',
            'confidence_score' => 0,
            'rationale_explanation' => 'Răspuns de rezervă - serviciul AI nu este disponibil',
            'safety_warnings' => [
                'Serviciul AI nu este disponibil momentan',
                'Consultați un profesionist medical pentru asistență',
                'Pentru urgențe medicale, apelați 112'
            ],
            'urgency_level' => 'unknown',
            'processing_time' => 0,
            'tokens_used' => 0,
            'provider_service' => 'groq',
            'error_message' => $error
        ];
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey
            ])->timeout(5)->get($this->baseUrl . '/models');

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getRateLimitStatus(): array
    {
        // Groq rate limits: 30 requests/minute for free tier
        $cacheKey = 'groq_rate_limit_' . date('Y-m-d-H-i');
        $requests = Cache::get($cacheKey, 0);

        return [
            'requests_used' => $requests,
            'requests_limit' => 30,
            'requests_remaining' => max(0, 30 - $requests),
            'reset_time' => now()->addMinute()->startOfMinute()
        ];
    }

    public function incrementRateLimit(): void
    {
        $cacheKey = 'groq_rate_limit_' . date('Y-m-d-H-i');
        Cache::increment($cacheKey);
        Cache::expire($cacheKey, 60); // Expire after 1 minute
    }
}
