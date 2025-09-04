<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class OllamaService
{
    private string $baseUrl;
    private string $defaultModel;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.base_url', 'http://localhost:11434');
        $this->defaultModel = config('services.ollama.default_model', 'llama3.1:8b');
        $this->timeout = config('services.ollama.timeout', 120);
    }

    public function processMessage(string $message, array $context = []): array
    {
        $startTime = microtime(true);

        try {
            // Check if Ollama is available
            if (!$this->isAvailable()) {
                throw new \Exception('Ollama service is not available');
            }

            $systemPrompt = $this->buildMedicalSystemPrompt();
            $userPrompt = $this->buildUserPrompt($message, $context);

            $response = Http::timeout($this->timeout)
                          ->post($this->baseUrl . '/api/chat', [
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt]
                ],
                'stream' => false,
                'options' => [
                    'temperature' => 0.3,
                    'top_p' => 0.9,
                    'num_predict' => 2000
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $aiMessage = $data['message']['content'] ?? '';

                $processingTime = microtime(true) - $startTime;

                return $this->parseAiResponse($aiMessage, [
                    'processing_time' => round($processingTime, 3),
                    'model_used' => $this->defaultModel,
                    'provider_service' => 'ollama'
                ]);
            }

            throw new \Exception('Ollama API request failed: HTTP ' . $response->status());

        } catch (\Exception $e) {
            Log::error('Ollama Service Error: ' . $e->getMessage(), [
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
            if (!$this->isAvailable()) {
                throw new \Exception('Ollama service is not available');
            }

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

            $response = Http::timeout($this->timeout)
                          ->post($this->baseUrl . '/api/chat', [
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt]
                ],
                'stream' => false,
                'options' => [
                    'temperature' => 0.2,
                    'num_predict' => 1500
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $diagnosis = $data['message']['content'] ?? '';

                return $this->parseDifferentialDiagnosisResponse($diagnosis, [
                    'processing_time' => microtime(true) - $startTime,
                    'model_used' => $this->defaultModel,
                    'provider_service' => 'ollama'
                ]);
            }

            throw new \Exception('Ollama differential diagnosis request failed');

        } catch (\Exception $e) {
            Log::error('Ollama Differential Diagnosis Error: ' . $e->getMessage());

            return [
                'summary' => 'Nu am putut genera diagnosticul diferențial din cauza unei erori de sistem.',
                'differential_diagnoses' => [],
                'recommended_tests' => [],
                'safety_warnings' => ['Eroare de sistem. Consultați un profesionist medical.'],
                'processing_time' => microtime(true) - $startTime,
                'provider_service' => 'ollama',
                'error_message' => $e->getMessage()
            ];
        }
    }

    public function analyzeImageWithContext(array $imagePaths, string $context = ''): array
    {
        // Check if we have a vision-capable model
        $visionModels = ['llava:latest', 'bakllava:latest'];
        $hasVisionModel = false;

        foreach ($visionModels as $model) {
            if ($this->hasModel($model)) {
                $hasVisionModel = true;
                $visionModel = $model;
                break;
            }
        }

        if (!$hasVisionModel) {
            return [
                'summary' => 'Modelul de analiză a imaginilor nu este disponibil. Pentru interpretarea imaginilor medicale, consultați un specialist.',
                'safety_warnings' => [
                    'Model de analiză imagini indisponibil',
                    'Consultați un radiolog sau specialist medical pentru interpretarea imaginilor',
                    'Pentru urgențe medicale, contactați serviciile de urgență'
                ],
                'provider_service' => 'ollama',
                'error_message' => 'Vision model not available'
            ];
        }

        $startTime = microtime(true);

        try {
            // Process first image only for now
            $imagePath = $imagePaths[0] ?? null;
            if (!$imagePath || !file_exists($imagePath)) {
                throw new \Exception('Image file not found or invalid');
            }

            $imageData = base64_encode(file_get_contents($imagePath));

            $systemPrompt = $this->buildImageAnalysisPrompt();
            $userPrompt = "Analizează această imagine medicală. Context suplimentar: " . $context;

            $response = Http::timeout($this->timeout * 2) // Double timeout for image analysis
                          ->post($this->baseUrl . '/api/chat', [
                'model' => $visionModel,
                'messages' => [
                    [
                        'role' => 'system', 
                        'content' => $systemPrompt
                    ],
                    [
                        'role' => 'user',
                        'content' => $userPrompt,
                        'images' => [$imageData]
                    ]
                ],
                'stream' => false,
                'options' => [
                    'temperature' => 0.1,
                    'num_predict' => 1000
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $analysis = $data['message']['content'] ?? '';

                return [
                    'summary' => $analysis,
                    'confidence_score' => $this->extractConfidenceScore($analysis),
                    'safety_warnings' => array_merge(
                        $this->extractSafetyWarnings($analysis),
                        [
                            'Analiza AI nu înlocuiește interpretarea medicală profesională',
                            'Consultați un specialist pentru diagnosticul final',
                            'Pentru urgențe medicale, contactați serviciile de urgență'
                        ]
                    ),
                    'processing_time' => microtime(true) - $startTime,
                    'model_used' => $visionModel,
                    'provider_service' => 'ollama'
                ];
            }

            throw new \Exception('Ollama image analysis request failed');

        } catch (\Exception $e) {
            Log::error('Ollama Image Analysis Error: ' . $e->getMessage());

            return [
                'summary' => 'Nu am putut analiza imaginea din cauza unei erori de sistem.',
                'safety_warnings' => ['Eroare de sistem. Consultați un profesionist medical pentru interpretarea imaginii.'],
                'processing_time' => microtime(true) - $startTime,
                'provider_service' => 'ollama',
                'error_message' => $e->getMessage()
            ];
        }
    }

    public function pullModel(string $modelName): bool
    {
        try {
            $response = Http::timeout(300) // 5 minutes timeout for model pulling
                          ->post($this->baseUrl . '/api/pull', [
                'name' => $modelName
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Failed to pull Ollama model {$modelName}: " . $e->getMessage());
            return false;
        }
    }

    public function hasModel(string $modelName): bool
    {
        try {
            $response = Http::timeout(10)
                          ->get($this->baseUrl . '/api/tags');

            if ($response->successful()) {
                $data = $response->json();
                $models = array_column($data['models'] ?? [], 'name');
                return in_array($modelName, $models);
            }

            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getAvailableModels(): array
    {
        try {
            $response = Http::timeout(10)
                          ->get($this->baseUrl . '/api/tags');

            if ($response->successful()) {
                $data = $response->json();
                return $data['models'] ?? [];
            }

            return [];
        } catch (\Exception $e) {
            return [];
        }
    }

    public function isAvailable(): bool
    {
        $cacheKey = 'ollama_availability';

        return Cache::remember($cacheKey, 30, function () { // Cache for 30 seconds
            try {
                $response = Http::timeout(5)
                              ->get($this->baseUrl . '/api/tags');

                return $response->successful();
            } catch (\Exception $e) {
                return false;
            }
        });
    }

    private function buildMedicalSystemPrompt(): string
    {
        return "Ești IzaAI, un asistent medical educațional care funcționează local pentru a asigura confidențialitatea datelor medicale.

ROL ȘI LIMITĂRI:
- Asistent medical educațional pentru profesioniștii din sănătate
- NU furnizezi diagnostice medicale - doar suport educațional
- Toate recomandările necesită verificarea de către medici calificați
- Pentru urgențe medicale, recomandă apelarea la 112

COMPETENȚE:
- Cunoștințe medicale bazate pe literatura științifică
- Familiaritate cu sistemul medical românesc
- Terminologie medicală în română și engleză
- Ghiduri clinice internaționale și locale

PRINCIPII:
- Confidențialitate maximă (procesare locală)
- Transparență privind limitările
- Bazat pe evidențe medicale
- Adaptat la contextul românesc

Răspunde în română cu informații precise, include disclaimer-uri medicale și menținează un ton profesional și educațional.";
    }

    private function buildDifferentialDiagnosisPrompt(): string
    {
        return "Ești IzaAI, specialist în diagnosticul diferențial educațional cu procesare locală pentru confidențialitate maximă.

METODOLOGIE DIAGNOSTICĂ:
1. Analizează simptomele în contextul demografic
2. Generează diagnostice diferențiale ordonate după probabilitate
3. Include caracteristici clinice distinctive
4. Recomandă investigații pentru clarificare
5. Identifică semnele de alarmă

STRUCTURĂ RĂSPUNS:
**DIAGNOSTICE DIFERENȚIALE** (ordonate după probabilitate):
1. Diagnostic principal (probabilitate %)
2. Diagnostic alternativ (probabilitate %)
3. Alte considerări

**INVESTIGAȚII RECOMANDATE:**
- Teste de laborator specifice
- Imagistică necesară
- Evaluări specializate

**SEMNE DE ALARMĂ:**
- Simptome care necesită atenție urgentă

**LIMITĂRI:**
- Doar pentru educație medicală
- Necesită confirmare clinică
- Nu înlocuiește evaluarea medicală

Furnizează informații detaliate menținând perspectiva educațională și necesitatea evaluării profesionale.";
    }

    private function buildImageAnalysisPrompt(): string
    {
        return "Ești IzaAI, specialist în interpretarea imaginilor medicale pentru scop educațional, cu procesare locală pentru confidențialitate.

PRINCIPII INTERPRETARE:
- Analiză obiectivă a caracteristicilor vizibile
- Identificarea anomaliilor aparente
- Contextualiza în cadrul clinic furnizat
- Menționa limitările interpretării AI

STRUCTURĂ ANALIZĂ:
**OBSERVAȚII TEHNICE:**
- Calitatea și tipul imaginii
- Structurile anatomice vizibile

**CARACTERISTICI NOTABILE:**
- Aspecte normale identificate
- Anomalii sau variante observate

**CONSIDERAȚII CLINICE:**
- Corelații posibile cu simptomele
- Investigații suplimentare recomandate

**LIMITĂRI:**
- Interpretarea AI nu înlocuiește radiologul
- Necesară corelație clinică
- Pentru urgențe, consultă specialistul

Furnizează o analiză detaliată dar menționează întotdeauna necesitatea confirmării de către un specialist în imagistică medicală.";
    }

    // Reused methods from GroqAiService with same implementation
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
            'rationale_explanation' => 'Răspuns generat local cu Ollama pentru confidențialitate maximă, bazat pe literatura medicală',
            'safety_warnings' => array_merge($safetyWarnings, [
                'Procesare locală pentru confidențialitate maximă',
                'Consultați profesioniștii medicali pentru sfaturi medicale specifice',
                'Pentru urgențe medicale, apelați 112'
            ]),
            'urgency_level' => $urgencyLevel,
            'processing_time' => $metadata['processing_time'] ?? 0,
            'model_used' => $metadata['model_used'] ?? $this->defaultModel,
            'provider_service' => $metadata['provider_service'] ?? 'ollama'
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
            'rationale_explanation' => 'Diagnostic diferențial generat local cu confidențialitate maximă, bazat pe simptomele prezentate',
            'safety_warnings' => [
                'Procesare locală pentru protejarea datelor medicale',
                'Evaluarea medicală profesională este necesară pentru diagnostic',
                'Consultați imediat un medic pentru simptome îngrijorătoare',
                'Nu întârziați căutarea asistenței medicale dacă simptomele se agravează'
            ],
            'processing_time' => $metadata['processing_time'] ?? 0,
            'model_used' => $metadata['model_used'] ?? $this->defaultModel,
            'provider_service' => $metadata['provider_service'] ?? 'ollama'
        ];
    }

    // Import confidence scoring and other utility methods from GroqAiService
    private function extractConfidenceScore(string $response): float
    {
        // Similar implementation as in GroqAiService
        $certaintyWords = ['sigur', 'cert', 'definit', 'clar', 'evident', 'confirmat'];
        $uncertaintyWords = ['posibil', 'probabil', 's-ar putea', 'poate', 'uneori', 'variabil'];

        $certaintyCount = 0;
        $uncertaintyCount = 0;

        $lowerResponse = mb_strtolower($response);

        foreach ($certaintyWords as $word) {
            $certaintyCount += substr_count($lowerResponse, $word);
        }

        foreach ($uncertaintyWords as $word) {
            $uncertaintyCount += substr_count($lowerResponse, $word);
        }

        $baseConfidence = 0.70; // Slightly lower for local models
        $confidence = $baseConfidence + ($certaintyCount * 0.05) - ($uncertaintyCount * 0.08);

        return max(0.10, min(0.90, $confidence));
    }

    private function extractSafetyWarnings(string $response): array
    {
        $warnings = [];

        $urgentKeywords = [
            'durere în piept', 'durere toracică', 'dificultate respiratorie',
            'sângerare', 'pierderea cunoștinței', 'convulsii', 'febră foarte mare'
        ];

        $lowerResponse = mb_strtolower($response);

        foreach ($urgentKeywords as $keyword) {
            if (strpos($lowerResponse, $keyword) !== false) {
                $warnings[] = 'Simptome potențial grave identificate - consultați IMEDIAT serviciile de urgență';
                break;
            }
        }

        return $warnings;
    }

    private function assessUrgencyLevel(string $response): string
    {
        $emergencyKeywords = ['urgență', 'emergență', 'imediat', '112', 'critic'];
        $highUrgencyKeywords = ['cât mai repede', 'în câteva ore', 'nu întârzați'];

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
        preg_match_all('/\d+\.\s*(.+?)(?=\n|\d+\.|$)/s', $response, $matches);
        if (!empty($matches[1])) {
            foreach ($matches[1] as $match) {
                $diagnosis = trim(strip_tags($match));
                if (strlen($diagnosis) > 10 && strlen($diagnosis) < 200) {
                    $diagnoses[] = $diagnosis;
                }
            }
        }

        return array_slice(array_unique($diagnoses), 0, 8);
    }

    private function extractRecommendedTests(string $response): array
    {
        $tests = [];

        $testPatterns = [
            '/analize(?:\s+de)?\s+sânge/iu' => 'Analize de sânge',
            '/hemograma\s+completă/iu' => 'Hemograma completă',
            '/radiografie/iu' => 'Radiografie',
            '/ecografie/iu' => 'Ecografie',
            '/RMN|rezonanță/iu' => 'RMN (Rezonanță Magnetică)',
            '/CT|computer\s+tomograf/iu' => 'CT (Computer Tomograf)'
        ];

        foreach ($testPatterns as $pattern => $testName) {
            if (preg_match($pattern, $response)) {
                $tests[] = $testName;
            }
        }

        return array_unique($tests);
    }

    private function getFallbackResponse(string $error = ''): array
    {
        return [
            'ai_response' => 'Serviciul AI local este temporar indisponibil. Pentru informații medicale, vă rugăm să consultați un profesionist medical calificat. Pentru urgențe medicale, apelați 112.',
            'confidence_score' => 0,
            'rationale_explanation' => 'Răspuns de rezervă - serviciul AI local nu este disponibil',
            'safety_warnings' => [
                'Serviciul AI local nu este disponibil momentan',
                'Consultați un profesionist medical pentru asistență',
                'Pentru urgențe medicale, apelați 112'
            ],
            'urgency_level' => 'unknown',
            'processing_time' => 0,
            'provider_service' => 'ollama',
            'error_message' => $error
        ];
    }
}
