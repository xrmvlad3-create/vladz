<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class HybridAiService
{
    private GroqAiService $groqService;
    private OllamaService $ollamaService;
    private array $fallbackChain;

    public function __construct(
        GroqAiService $groqService,
        OllamaService $ollamaService
    ) {
        $this->groqService = $groqService;
        $this->ollamaService = $ollamaService;

        $this->fallbackChain = [
            'groq' => $groqService,
            'ollama' => $ollamaService
        ];
    }

    public function processMessage(string $message, array $context = []): array
    {
        $startTime = microtime(true);
        $errors = [];

        foreach ($this->fallbackChain as $serviceName => $service) {
            try {
                Log::info("Attempting AI processing with {$serviceName} service", [
                    'message_length' => strlen($message),
                    'has_context' => !empty($context)
                ]);

                // Check service availability
                if (!$this->isServiceAvailable($serviceName, $service)) {
                    $errors[$serviceName] = 'Service not available';
                    continue;
                }

                // Check rate limits for external services
                if ($serviceName === 'groq' && !$this->checkRateLimit($serviceName)) {
                    $errors[$serviceName] = 'Rate limit exceeded';
                    continue;
                }

                // Process the message
                $result = $service->processMessage($message, $context);

                // Validate response quality
                if ($this->isValidResponse($result)) {
                    $result['fallback_used'] = $serviceName !== 'groq';
                    $result['service_used'] = $serviceName;
                    $result['total_processing_time'] = microtime(true) - $startTime;

                    // Update service metrics
                    $this->updateServiceMetrics($serviceName, 'success');

                    Log::info("AI processing successful with {$serviceName}", [
                        'processing_time' => $result['processing_time'] ?? 0,
                        'confidence' => $result['confidence_score'] ?? 0
                    ]);

                    return $result;
                }

                $errors[$serviceName] = 'Invalid response quality';

            } catch (\Exception $e) {
                $errors[$serviceName] = $e->getMessage();
                $this->updateServiceMetrics($serviceName, 'error');

                Log::warning("AI service {$serviceName} failed", [
                    'error' => $e->getMessage(),
                    'processing_time' => microtime(true) - $startTime
                ]);
            }
        }

        // All services failed, return comprehensive fallback
        Log::error('All AI services failed', [
            'errors' => $errors,
            'total_processing_time' => microtime(true) - $startTime
        ]);

        return $this->getComprehensiveFallback($errors);
    }

    public function generateDifferentialDiagnosis(array $symptoms, ?int $age = null, ?string $gender = null): array
    {
        $startTime = microtime(true);
        $errors = [];

        foreach ($this->fallbackChain as $serviceName => $service) {
            try {
                if (!$this->isServiceAvailable($serviceName, $service)) {
                    $errors[$serviceName] = 'Service not available';
                    continue;
                }

                if ($serviceName === 'groq' && !$this->checkRateLimit($serviceName)) {
                    $errors[$serviceName] = 'Rate limit exceeded';
                    continue;
                }

                $result = $service->generateDifferentialDiagnosis($symptoms, $age, $gender);

                if ($this->isValidDifferentialDiagnosis($result)) {
                    $result['fallback_used'] = $serviceName !== 'groq';
                    $result['service_used'] = $serviceName;
                    $result['total_processing_time'] = microtime(true) - $startTime;

                    $this->updateServiceMetrics($serviceName, 'success');
                    return $result;
                }

                $errors[$serviceName] = 'Invalid diagnosis quality';

            } catch (\Exception $e) {
                $errors[$serviceName] = $e->getMessage();
                $this->updateServiceMetrics($serviceName, 'error');
            }
        }

        // Return diagnostic fallback
        return $this->getDiagnosticFallback($symptoms, $errors);
    }

    public function analyzeImages(array $imagePaths, string $context = ''): array
    {
        $startTime = microtime(true);
        $errors = [];

        // Try Ollama first for image analysis (has vision models)
        $visionChain = ['ollama', 'groq'];

        foreach ($visionChain as $serviceName) {
            try {
                $service = $this->fallbackChain[$serviceName];

                if (!$this->isServiceAvailable($serviceName, $service)) {
                    $errors[$serviceName] = 'Service not available';
                    continue;
                }

                $result = $service->analyzeImageWithContext($imagePaths, $context);

                if ($this->isValidImageAnalysis($result)) {
                    $result['fallback_used'] = $serviceName !== 'ollama';
                    $result['service_used'] = $serviceName;
                    $result['total_processing_time'] = microtime(true) - $startTime;

                    $this->updateServiceMetrics($serviceName, 'success');
                    return $result;
                }

                $errors[$serviceName] = 'Invalid analysis quality';

            } catch (\Exception $e) {
                $errors[$serviceName] = $e->getMessage();
                $this->updateServiceMetrics($serviceName, 'error');
            }
        }

        // Return image analysis fallback
        return $this->getImageAnalysisFallback($errors);
    }

    private function isServiceAvailable(string $serviceName, $service): bool
    {
        $cacheKey = "ai_service_availability_{$serviceName}";

        return Cache::remember($cacheKey, 60, function () use ($service) { // Cache for 1 minute
            return method_exists($service, 'isAvailable') ? $service->isAvailable() : true;
        });
    }

    private function checkRateLimit(string $serviceName): bool
    {
        if ($serviceName === 'groq') {
            $rateLimitStatus = $this->groqService->getRateLimitStatus();
            return $rateLimitStatus['requests_remaining'] > 0;
        }

        return true; // Ollama has no rate limits
    }

    private function isValidResponse(array $response): bool
    {
        return !empty($response['ai_response']) && 
               strlen($response['ai_response']) > 50 && // Minimum response length
               !isset($response['error_message']);
    }

    private function isValidDifferentialDiagnosis(array $response): bool
    {
        return !empty($response['summary']) &&
               (isset($response['differential_diagnoses']) || isset($response['recommended_tests'])) &&
               !isset($response['error_message']);
    }

    private function isValidImageAnalysis(array $response): bool
    {
        return !empty($response['summary']) &&
               strlen($response['summary']) > 30 &&
               !isset($response['error_message']);
    }

    private function updateServiceMetrics(string $serviceName, string $result): void
    {
        $cacheKey = "ai_service_metrics_{$serviceName}_" . date('Y-m-d-H');

        $metrics = Cache::get($cacheKey, ['success' => 0, 'error' => 0]);
        $metrics[$result]++;

        Cache::put($cacheKey, $metrics, 3600); // 1 hour
    }

    private function getComprehensiveFallback(array $errors): array
    {
        return [
            'ai_response' => $this->getStaticMedicalResponse(),
            'confidence_score' => 0,
            'rationale_explanation' => 'Toate serviciile AI sunt temporar indisponibile. Răspuns educațional static furnizat.',
            'safety_warnings' => [
                'Serviciile AI sunt temporar indisponibile',
                'Consultați IMEDIAT un profesionist medical calificat',
                'Pentru urgențe medicale, apelați 112',
                'Nu întârziați căutarea asistenței medicale'
            ],
            'urgency_level' => 'high',
            'processing_time' => 0,
            'service_used' => 'fallback',
            'fallback_used' => true,
            'service_errors' => $errors,
            'recommended_actions' => [
                'Consultați un medic pentru evaluare profesională',
                'Contactați serviciile medicale de urgență dacă este necesar',
                'Încercați din nou mai târziu pentru suport AI'
            ]
        ];
    }

    private function getDiagnosticFallback(array $symptoms, array $errors): array
    {
        return [
            'summary' => $this->getStaticDiagnosticGuidance($symptoms),
            'differential_diagnoses' => [
                'Diagnosticul necesită evaluarea medicală profesională',
                'Combinația de simptome poate avea multiple cauze',
                'Consultația clinică este necesară pentru diagnostic'
            ],
            'recommended_tests' => $this->getBasicRecommendedTests($symptoms),
            'recommended_actions' => [
                'Consultați URGENT un medic pentru evaluare clinică',
                'Documentați simptomele și evoluția acestora',
                'Nu întârziați căutarea asistenței medicale'
            ],
            'urgency_level' => $this->assessSymptomsUrgency($symptoms),
            'safety_warnings' => [
                'Serviciile AI de diagnostic nu sunt disponibile',
                'Evaluarea medicală imediată este necesară',
                'Pentru urgențe medicale, apelați 112'
            ],
            'service_used' => 'fallback',
            'fallback_used' => true,
            'service_errors' => $errors
        ];
    }

    private function getImageAnalysisFallback(array $errors): array
    {
        return [
            'summary' => 'Serviciile de analiză a imaginilor medicale nu sunt disponibile momentan. Pentru interpretarea imaginilor medicale, consultați IMEDIAT un radiolog sau specialist în imagistică medicală.',
            'safety_warnings' => [
                'Analiza AI a imaginilor nu este disponibilă',
                'Consultați un radiolog pentru interpretarea imaginilor',
                'Nu întârziați evaluarea medicală profesională',
                'Pentru urgențe medicale, contactați serviciile de urgență'
            ],
            'recommended_actions' => [
                'Contactați un radiolog sau specialist în imagistică',
                'Programați o consultație medicală pentru interpretare profesională',
                'Pentru urgențe, prezentați-vă la serviciile de urgență'
            ],
            'service_used' => 'fallback',
            'fallback_used' => true,
            'service_errors' => $errors
        ];
    }

    private function getStaticMedicalResponse(): string
    {
        return "Serviciile AI sunt temporar indisponibile, dar vă pot oferi următoarele recomandări generale importante:

ACȚIUNI IMEDIATE RECOMANDATE:
• Consultați un medic calificat pentru orice problemă medicală
• Pentru urgențe medicale, apelați 112
• Documentați simptomele și evoluția acestora
• Nu întârziați căutarea asistenței medicale profesionale

RESURSE MEDICALE DISPONIBILE:
• Medicul de familie pentru consultații de rutină
• Serviciile de urgență pentru situații acute
• Specialiștii medicali pentru probleme complexe
• Farmaciștii pentru întrebări despre medicamente

INFORMAȚII GENERALE IMPORTANTE:
• Urmați întotdeauna sfaturile medicului dumneavoastră
• Nu modificați tratamentele fără supraveghere medicală
• Mențineți un stil de viață sănătos
• Efectuați controalele medicale regulate

Pentru informații medicale specifice și actualizate, consultați întotdeauna profesioniștii din sănătate.";
    }

    private function getStaticDiagnosticGuidance(array $symptoms): string
    {
        $symptomsText = implode(', ', array_slice($symptoms, 0, 5));

        return "Pentru simptomele prezentate ({$symptomsText}), este esențială evaluarea medicală profesională.

PAȘI RECOMANDAȚI:
1. Consultați URGENT un medic pentru evaluare clinică
2. Pregătiți un istoric detaliat al simptomelor
3. Notați când au început simptomele și cum au evoluat
4. Menționați orice medicamente luate recent
5. Includeți istoricul medical personal și familial

SEMNALE DE ALARMĂ care necesită atenție IMEDIATĂ:
• Durere severă sau care se înrăutățește
• Dificultăți de respirație
• Febră înaltă (>39°C)
• Sângerare neobișnuită
• Pierderea cunoștinței sau amețeli severe

NU ÎNTÂRZIAȚI consultația medicală pentru diagnosticul și tratamentul adecvat.";
    }

    private function getBasicRecommendedTests(array $symptoms): array
    {
        return [
            'Analize de sânge complete (hemograma, biochimie)',
            'Analiză generală de urină',
            'Examen clinic complet',
            'Investigații suplimentare conform recomandărilor medicului'
        ];
    }

    private function assessSymptomsUrgency(array $symptoms): string
    {
        $urgentSymptoms = [
            'durere în piept', 'durere toracică', 'dificultate respiratorie',
            'dispnee', 'sângerare', 'hemoragie', 'pierderea cunoștinței',
            'leșin', 'convulsii', 'febră foarte mare'
        ];

        $symptomsText = strtolower(implode(' ', $symptoms));

        foreach ($urgentSymptoms as $urgentSymptom) {
            if (strpos($symptomsText, $urgentSymptom) !== false) {
                return 'emergency';
            }
        }

        return 'high'; // Always err on the side of caution
    }

    public function getServiceStatus(): array
    {
        return [
            'groq' => [
                'available' => $this->isServiceAvailable('groq', $this->groqService),
                'rate_limit' => $this->groqService->getRateLimitStatus()
            ],
            'ollama' => [
                'available' => $this->isServiceAvailable('ollama', $this->ollamaService),
                'models' => $this->ollamaService->getAvailableModels()
            ],
            'fallback_chain_order' => array_keys($this->fallbackChain),
            'last_updated' => now()->toISOString()
        ];
    }

    public function testAllServices(): array
    {
        $results = [];
        $testMessage = "Test message for service availability";

        foreach ($this->fallbackChain as $serviceName => $service) {
            $startTime = microtime(true);

            try {
                $result = $service->processMessage($testMessage);
                $results[$serviceName] = [
                    'status' => 'success',
                    'response_time' => microtime(true) - $startTime,
                    'response_length' => strlen($result['ai_response'] ?? ''),
                    'confidence' => $result['confidence_score'] ?? 0
                ];
            } catch (\Exception $e) {
                $results[$serviceName] = [
                    'status' => 'error',
                    'error' => $e->getMessage(),
                    'response_time' => microtime(true) - $startTime
                ];
            }
        }

        return $results;
    }
}
