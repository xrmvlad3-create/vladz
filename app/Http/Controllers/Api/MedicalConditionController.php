<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MedicalConditionRequest;
use App\Http\Resources\MedicalConditionResource;
use App\Http\Resources\MedicalConditionCollection;
use App\Models\MedicalCondition;
use App\Models\UserBookmark;
use App\Services\AuditLogService;
use App\Services\MedicalDataValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MedicalConditionController extends Controller
{
    public function __construct(
        private AuditLogService $auditLogService,
        private MedicalDataValidationService $medicalValidationService
    ) {
        $this->middleware('permission:view medical conditions')->only(['index', 'show']);
        $this->middleware('permission:create medical conditions')->only(['store']);
        $this->middleware('permission:edit medical conditions')->only(['update']);
        $this->middleware('permission:delete medical conditions')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = MedicalCondition::with(['creator:id,name,specialization'])
                                   ->published();

            // Language filter (default 'ro', pass language=all to disable)
            $language = $request->get('language', 'ro');
            if ($language !== 'all') {
                $query->where('language', $language);
            }

            // Search functionality
            if ($request->filled('search')) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('description', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('icd_10_code', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('icd_11_code', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('snomed_ct_code', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('symptoms', $searchTerm)
                      ->orWhereJsonContains('tags', $searchTerm);
                });
            }

            // Filters
            if ($request->filled('category')) {
                $query->byCategory($request->category);
            }

            if ($request->filled('severity')) {
                $query->bySeverity($request->severity);
            }

            if ($request->filled('evidence_level')) {
                $query->byEvidenceLevel($request->evidence_level);
            }

            if ($request->boolean('high_prevalence')) {
                $query->highPrevalence();
            }

            if ($request->boolean('needs_review')) {
                $query->needsReview();
            }

            if ($request->filled('tags')) {
                $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
                foreach ($tags as $tag) {
                    $query->withTag(trim($tag));
                }
            }

            // Sorting
            $sortField = $request->get('sort', 'name');
            $sortDirection = $request->get('direction', 'asc');

            $validSortFields = ['name', 'category', 'severity', 'prevalence', 'created_at', 'updated_at'];
            if (in_array($sortField, $validSortFields)) {
                $query->orderBy($sortField, $sortDirection);
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 50);
            $conditions = $query->paginate($perPage);

            // Add user bookmarks info if authenticated
            if ($request->user()) {
                $conditionIds = $conditions->pluck('id')->toArray();
                $bookmarks = UserBookmark::where('user_id', $request->user()->id)
                                       ->whereIn('medical_condition_id', $conditionIds)
                                       ->pluck('medical_condition_id')
                                       ->toArray();

                $conditions->getCollection()->transform(function ($condition) use ($bookmarks) {
                    $condition->is_bookmarked = in_array($condition->id, $bookmarks);
                    return $condition;
                });
            }

            return response()->json([
                'data' => new MedicalConditionCollection($conditions),
                'meta' => [
                    'current_page' => $conditions->currentPage(),
                    'last_page' => $conditions->lastPage(),
                    'per_page' => $conditions->perPage(),
                    'total' => $conditions->total(),
                    'from' => $conditions->firstItem(),
                    'to' => $conditions->lastItem()
                ],
                'links' => [
                    'first' => $conditions->url(1),
                    'last' => $conditions->url($conditions->lastPage()),
                    'prev' => $conditions->previousPageUrl(),
                    'next' => $conditions->nextPageUrl()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la încărcarea afecțiunilor medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(MedicalConditionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Validate medical codes
            $validationResult = $this->medicalValidationService->validateCodes([
                'icd_10' => $request->icd_10_code,
                'icd_11' => $request->icd_11_code,
                'snomed_ct' => $request->snomed_ct_code
            ]);

            if (!$validationResult['valid']) {
                return response()->json([
                    'message' => 'Coduri medicale invalide',
                    'errors' => $validationResult['errors']
                ], 422);
            }

            $condition = MedicalCondition::create([
                ...$request->validated(),
                'created_by' => $request->user()->id,
                'status' => $request->user()->hasRole(['admin', 'super_admin']) ? 'published' : 'draft',
                'version' => 1.0,
                'language' => $request->get('language', 'ro')
            ]);

            // Add tags if provided
            if ($request->filled('tags')) {
                $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
                $condition->update(['tags' => array_map('trim', $tags)]);
            }

            DB::commit();

            // Log creation
            $this->auditLogService->log(
                $request->user(),
                'medical_condition_created',
                "Medical condition '{$condition->name}' created",
                [
                    'condition_id' => $condition->id,
                    'category' => $condition->category,
                    'severity' => $condition->severity,
                    'status' => $condition->status
                ]
            );

            // Clear related caches
            Cache::tags(['medical_conditions'])->flush();

            return response()->json([
                'message' => 'Afecțiunea medicală a fost creată cu succes',
                'data' => new MedicalConditionResource($condition->load('creator'))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Eroare la crearea afecțiunii medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, MedicalCondition $medicalCondition): JsonResponse
    {
        try {
            $medicalCondition->load([
                'creator:id,name,specialization,institution',
                'treatmentProtocols:id,medical_condition_id,name,protocol_type,status',
                'reviews' => function ($query) {
                    $query->with('user:id,name,specialization')->latest()->limit(5);
                }
            ]);

            // Add related conditions
            $medicalCondition->related_by_symptoms = $medicalCondition->getRelatedBySymptoms(5);

            // Add user-specific data if authenticated
            if ($request->user()) {
                $medicalCondition->is_bookmarked = $medicalCondition->isBookmarkedBy($request->user());
                $medicalCondition->user_rating = $medicalCondition->reviews()
                                                                ->where('user_id', $request->user()->id)
                                                                ->value('rating');
            }

            // Add statistics
            $medicalCondition->stats = [
                'total_bookmarks' => $medicalCondition->getTotalBookmarks(),
                'average_rating' => round($medicalCondition->getAverageRating(), 1),
                'total_reviews' => $medicalCondition->reviews()->count(),
                'views_count' => Cache::increment("medical_condition_views_{$medicalCondition->id}")
            ];

            return response()->json([
                'data' => new MedicalConditionResource($medicalCondition)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la încărcarea afecțiunii medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(MedicalConditionRequest $request, MedicalCondition $medicalCondition): JsonResponse
    {
        try {
            // Check authorization
            if (!$request->user()->can('edit medical conditions') && 
                $medicalCondition->created_by !== $request->user()->id) {
                return response()->json([
                    'message' => 'Nu aveți permisiunea de a modifica această afecțiune medicală'
                ], 403);
            }

            DB::beginTransaction();

            $originalData = $medicalCondition->toArray();

            // Validate medical codes if changed
            if ($request->filled(['icd_10_code', 'icd_11_code', 'snomed_ct_code'])) {
                $validationResult = $this->medicalValidationService->validateCodes([
                    'icd_10' => $request->icd_10_code,
                    'icd_11' => $request->icd_11_code,
                    'snomed_ct' => $request->snomed_ct_code
                ]);

                if (!$validationResult['valid']) {
                    return response()->json([
                        'message' => 'Coduri medicale invalide',
                        'errors' => $validationResult['errors']
                    ], 422);
                }
            }

            $updateData = $request->validated();
            $updateData['last_reviewed_at'] = now();
            $updateData['version'] = $medicalCondition->version + 0.1;

            if ($request->filled('review_notes')) {
                $updateData['review_notes'] = $request->review_notes;
            }

            $medicalCondition->update($updateData);

            // Update tags if provided
            if ($request->filled('tags')) {
                $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
                $medicalCondition->update(['tags' => array_map('trim', $tags)]);
            }

            DB::commit();

            // Log update
            $this->auditLogService->log(
                $request->user(),
                'medical_condition_updated',
                "Medical condition '{$medicalCondition->name}' updated",
                [
                    'condition_id' => $medicalCondition->id,
                    'changes' => array_diff_key($updateData, $originalData),
                    'version' => $medicalCondition->version
                ]
            );

            // Clear caches
            Cache::tags(['medical_conditions'])->flush();
            Cache::forget("medical_condition_{$medicalCondition->id}");

            return response()->json([
                'message' => 'Afecțiunea medicală a fost actualizată cu succes',
                'data' => new MedicalConditionResource($medicalCondition->fresh(['creator']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Eroare la actualizarea afecțiunii medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, MedicalCondition $medicalCondition): JsonResponse
    {
        try {
            // Check authorization
            if (!$request->user()->can('delete medical conditions') && 
                $medicalCondition->created_by !== $request->user()->id) {
                return response()->json([
                    'message' => 'Nu aveți permisiunea de a șterge această afecțiune medicală'
                ], 403);
            }

            $conditionName = $medicalCondition->name;
            $conditionId = $medicalCondition->id;

            // Soft delete
            $medicalCondition->delete();

            // Log deletion
            $this->auditLogService->log(
                $request->user(),
                'medical_condition_deleted',
                "Medical condition '{$conditionName}' deleted",
                ['condition_id' => $conditionId]
            );

            // Clear caches
            Cache::tags(['medical_conditions'])->flush();
            Cache::forget("medical_condition_{$conditionId}");

            return response()->json([
                'message' => 'Afecțiunea medicală a fost ștearsă cu succes'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la ștergerea afecțiunii medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:2|max:255',
            'filters' => 'array',
            'limit' => 'integer|min:1|max:50'
        ]);

        try {
            $cacheKey = 'medical_conditions_search:' . md5($request->query . serialize($request->filters ?? []));

            $results = Cache::remember($cacheKey, 300, function () use ($request) { // 5 minutes cache
                $query = MedicalCondition::published()
                    ->with('creator:id,name,specialization');

                // Language filter
                $language = $request->get('language', 'ro');
                if ($language !== 'all') {
                    $query->where('language', $language);
                }

                // Full text search
                $searchTerm = $request->query;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('description', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('icd_10_code', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('icd_11_code', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('snomed_ct_code', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('symptoms', $searchTerm)
                      ->orWhereJsonContains('tags', $searchTerm);
                });

                // Apply filters
                if ($request->has('filters.category')) {
                    $query->byCategory($request->filters['category']);
                }

                if ($request->has('filters.severity')) {
                    $query->bySeverity($request->filters['severity']);
                }

                if ($request->has('filters.evidence_level')) {
                    $query->byEvidenceLevel($request->filters['evidence_level']);
                }

                // Order by relevance (exact matches first)
                $query->orderByRaw("CASE WHEN name LIKE ? THEN 1 ELSE 2 END", ["%{$searchTerm}%"])
                      ->orderBy('name');

                return $query->limit($request->get('limit', 20))->get();
            });

            return response()->json([
                'data' => MedicalConditionResource::collection($results),
                'total' => $results->count(),
                'query' => $request->query,
                'filters' => $request->filters ?? []
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la căutarea afecțiunilor medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function searchByCodes(Request $request): JsonResponse
    {
        $request->validate([
            'icd_10_code' => 'nullable|string|max:10',
            'icd_11_code' => 'nullable|string|max:20',
            'snomed_ct_code' => 'nullable|string|max:20'
        ]);

        if (!$request->anyFilled(['icd_10_code', 'icd_11_code', 'snomed_ct_code'])) {
            return response()->json([
                'message' => 'Cel puțin un cod medical este necesar'
            ], 422);
        }

        try {
            $query = MedicalCondition::published()->with('creator:id,name,specialization');

            // Language filter
            $language = $request->get('language', 'ro');
            if ($language !== 'all') {
                $query->where('language', $language);
            }

            if ($request->filled('icd_10_code')) {
                $query->where('icd_10_code', $request->icd_10_code);
            }

            if ($request->filled('icd_11_code')) {
                $query->orWhere('icd_11_code', $request->icd_11_code);
            }

            if ($request->filled('snomed_ct_code')) {
                $query->orWhere('snomed_ct_code', $request->snomed_ct_code);
            }

            $results = $query->get();

            return response()->json([
                'data' => MedicalConditionResource::collection($results),
                'total' => $results->count(),
                'codes' => $request->only(['icd_10_code', 'icd_11_code', 'snomed_ct_code'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la căutarea după coduri medicale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bookmark(Request $request, MedicalCondition $medicalCondition): JsonResponse
    {
        try {
            $bookmark = UserBookmark::firstOrCreate([
                'user_id' => $request->user()->id,
                'medical_condition_id' => $medicalCondition->id
            ]);

            $isBookmarked = $bookmark->wasRecentlyCreated;

            if (!$isBookmarked) {
                $bookmark->delete();
                $message = 'Bookmark-ul a fost eliminat';
            } else {
                $message = 'Afecțiunea a fost adăugată la bookmark-uri';
            }

            return response()->json([
                'message' => $message,
                'is_bookmarked' => $isBookmarked
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la gestionarea bookmark-ului',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stats(): JsonResponse
    {
        try {
            $language = request()->get('language', 'ro');
            $cacheKey = 'medical_conditions_stats_' . $language;

            $stats = Cache::remember($cacheKey, 3600, function () use ($language) { // 1 hour cache
                $base = MedicalCondition::published();
                if ($language !== 'all') {
                    $base->where('language', $language);
                }

                return [
                    'total_conditions' => (clone $base)->count(),
                    'by_category' => (clone $base)
                        ->select('category', DB::raw('COUNT(*) as count'))
                        ->groupBy('category')
                        ->orderBy('count', 'desc')
                        ->get(),
                    'by_severity' => (clone $base)
                        ->select('severity', DB::raw('COUNT(*) as count'))
                        ->groupBy('severity')
                        ->orderBy('count', 'desc')
                        ->get(),
                    'by_evidence_level' => (clone $base)
                        ->select('evidence_level', DB::raw('COUNT(*) as count'))
                        ->groupBy('evidence_level')
                        ->whereNotNull('evidence_level')
                        ->orderBy('evidence_level')
                        ->get(),
                    'recent_additions' => (clone $base)
                        ->where('created_at', '>=', now()->subDays(30))
                        ->count(),
                    'needs_review' => (clone $base)
                        ->needsReview()
                        ->count(),
                    'high_prevalence' => (clone $base)
                        ->highPrevalence()
                        ->count(),
                    'most_bookmarked' => (clone $base)
                        ->withCount('bookmarks')
                        ->orderBy('bookmarks_count', 'desc')
                        ->limit(5)
                        ->get(['id', 'name', 'category']),
                    'top_rated' => (clone $base)
                        ->withAvg('reviews', 'rating')
                        ->having('reviews_avg_rating', '>', 0)
                        ->orderBy('reviews_avg_rating', 'desc')
                        ->limit(5)
                        ->get(['id', 'name', 'category'])
                ];
            });

            return response()->json(['data' => $stats]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la încărcarea statisticilor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request): JsonResponse
    {
        $request->validate([
            'format' => 'in:csv,xlsx,json',
            'filters' => 'array'
        ]);

        try {
            $format = $request->get('format', 'xlsx');

            // This would be implemented with Laravel Excel
            // For now, return a job ID for async processing

            return response()->json([
                'message' => 'Exportul a fost inițiat',
                'job_id' => 'export-' . uniqid(),
                'estimated_time' => '2-5 minute',
                'format' => $format
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la exportul datelor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'condition_ids' => 'required|array|min:1',
            'condition_ids.*' => 'integer|exists:medical_conditions,id',
            'updates' => 'required|array',
            'updates.status' => 'sometimes|in:draft,review,published,archived',
            'updates.category' => 'sometimes|string',
            'updates.severity' => 'sometimes|in:mild,moderate,severe,critical',
            'updates.tags' => 'sometimes|array'
        ]);

        if (!$request->user()->can('edit medical conditions')) {
            return response()->json(['message' => 'Permisiuni insuficiente'], 403);
        }

        try {
            DB::beginTransaction();

            $conditions = MedicalCondition::whereIn('id', $request->condition_ids)->get();
            $updates = $request->updates;
            $updates['last_reviewed_at'] = now();

            $affectedRows = MedicalCondition::whereIn('id', $request->condition_ids)
                                          ->update($updates);

            DB::commit();

            // Log bulk update
            $this->auditLogService->log(
                $request->user(),
                'medical_conditions_bulk_updated',
                "Bulk updated {$affectedRows} medical conditions",
                [
                    'condition_ids' => $request->condition_ids,
                    'updates' => $updates,
                    'affected_rows' => $affectedRows
                ]
            );

            // Clear caches
            Cache::tags(['medical_conditions'])->flush();

            return response()->json([
                'message' => "Au fost actualizate {$affectedRows} afecțiuni medicale",
                'affected_rows' => $affectedRows
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Eroare la actualizarea în masă',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
