<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseRequest;
use App\Http\Resources\CourseResource;
use App\Http\Resources\CourseCollection;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Services\AuditLogService;
use App\Services\CourseProgressService;
use App\Services\CertificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    public function __construct(
        private AuditLogService $auditLogService,
        private CourseProgressService $progressService,
        private CertificationService $certificationService
    ) {
        $this->middleware('permission:view courses')->only(['index', 'show']);
        $this->middleware('permission:create courses')->only(['store']);
        $this->middleware('permission:edit courses')->only(['update']);
        $this->middleware('permission:delete courses')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Course::with(['instructor:id,name,specialization,institution'])
                          ->withCount(['enrollments', 'reviews'])
                          ->withAvg('reviews', 'rating');

            // Apply visibility filters
            if (!$request->user() || !$request->user()->can('view unpublished courses')) {
                $query->active();
            }

            // Language filter (default 'ro', pass language=all to disable)
            $language = $request->get('language', 'ro');
            if ($language !== 'all') {
                $query->where('language', $language);
            }

            // Search functionality
            if ($request->filled('search')) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('description', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('category', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('tags', $searchTerm)
                      ->orWhereJsonContains('target_audience', $searchTerm);
                });
            }

            // Filters
            if ($request->filled('category')) {
                $query->byCategory($request->category);
            }

            if ($request->filled('difficulty_level')) {
                $query->byDifficulty($request->difficulty_level);
            }

            if ($request->filled('instructor_id')) {
                $query->byInstructor($request->instructor_id);
            }

            if ($request->boolean('featured')) {
                $query->featured();
            }

            if ($request->boolean('free')) {
                $query->free();
            }

            if ($request->boolean('with_cme')) {
                $query->withCmeCredits();
            }

            if ($request->boolean('enrolled_only') && $request->user()) {
                $query->whereHas('enrollments', function ($q) use ($request) {
                    $q->where('user_id', $request->user()->id);
                });
            }

            // Price range filter
            if ($request->filled(['min_price', 'max_price'])) {
                $query->whereBetween('price', [$request->min_price, $request->max_price]);
            }

            // Duration filter
            if ($request->filled(['min_duration', 'max_duration'])) {
                $query->whereBetween('duration_hours', [$request->min_duration, $request->max_duration]);
            }

            // Sorting
            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');

            $validSortFields = [
                'title', 'price', 'duration_hours', 'cme_credits', 'created_at', 
                'updated_at', 'start_date', 'enrollments_count', 'reviews_avg_rating'
            ];

            if (in_array($sortField, $validSortFields)) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->latest();
            }

            // Pagination
            $perPage = min($request->get('per_page', 12), 50);
            $courses = $query->paginate($perPage);

            // Add enrollment status for authenticated users
            if ($request->user()) {
                $courseIds = $courses->pluck('id')->toArray();
                $enrollments = CourseEnrollment::where('user_id', $request->user()->id)
                                             ->whereIn('course_id', $courseIds)
                                             ->get()
                                             ->keyBy('course_id');

                $courses->getCollection()->transform(function ($course) use ($enrollments) {
                    $enrollment = $enrollments->get($course->id);
                    $course->enrollment_status = $enrollment?->status;
                    $course->progress_percentage = $enrollment?->progress_percentage ?? 0;
                    $course->is_enrolled = !is_null($enrollment);
                    return $course;
                });
            }

            return response()->json([
                'data' => new CourseCollection($courses),
                'meta' => [
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'per_page' => $courses->perPage(),
                    'total' => $courses->total(),
                    'from' => $courses->firstItem(),
                    'to' => $courses->lastItem()
                ],
                'links' => [
                    'first' => $courses->url(1),
                    'last' => $courses->url($courses->lastPage()),
                    'prev' => $courses->previousPageUrl(),
                    'next' => $courses->nextPageUrl()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la încărcarea cursurilor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(CourseRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $course = Course::create([
                ...$request->validated(),
                'instructor_id' => $request->user()->id,
                'status' => $request->user()->hasRole(['admin', 'super_admin']) ? 'published' : 'draft'
            ]);

            // Add tags if provided
            if ($request->filled('tags')) {
                $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
                $course->update(['tags' => array_map('trim', $tags)]);
            }

            DB::commit();

            // Log creation
            $this->auditLogService->log(
                $request->user(),
                'course_created',
                "Course '{$course->title}' created",
                [
                    'course_id' => $course->id,
                    'category' => $course->category,
                    'difficulty_level' => $course->difficulty_level,
                    'price' => $course->price,
                    'cme_credits' => $course->cme_credits
                ]
            );

            // Clear related caches
            Cache::tags(['courses'])->flush();

            return response()->json([
                'message' => 'Cursul a fost creat cu succes',
                'data' => new CourseResource($course->load(['instructor', 'modules']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Eroare la crearea cursului',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        try {
            // Check access permissions
            if ($course->status !== 'published' && 
                (!$request->user() || 
                 ($course->instructor_id !== $request->user()->id && 
                  !$request->user()->can('view unpublished courses')))) {
                return response()->json(['message' => 'Cursul nu este disponibil'], 404);
            }

            $course->load([
                'instructor:id,name,specialization,institution,bio,avatar',
                'modules' => function ($query) {
                    $query->orderBy('order_index')->select([
                        'id', 'course_id', 'title', 'description', 'duration_minutes',
                        'order_index', 'is_mandatory'
                    ]);
                },
                'tests:id,course_id,title,description,passing_score,time_limit_minutes,max_attempts',
                'reviews' => function ($query) {
                    $query->with('user:id,name,specialization')->latest()->limit(10);
                },
                'announcements' => function ($query) {
                    $query->latest()->limit(5);
                }
            ]);

            // Add enrollment information for authenticated users
            if ($request->user()) {
                $enrollment = $course->getUserEnrollment($request->user());
                $course->enrollment = $enrollment;
                $course->can_enroll = $course->canUserEnroll($request->user());
                $course->progress_percentage = $enrollment?->progress_percentage ?? 0;

                if ($enrollment) {
                    // Use JSON-based module progress if no dedicated relation/table exists
                    $course->module_progress = collect($enrollment->module_progress ?? [])->values();
                }
            } else {
                $course->can_enroll = $course->isEnrollmentOpen();
            }

            // Add statistics
            $course->stats = [
                'total_enrollments' => $course->enrollments()->count(),
                'active_enrollments' => $course->enrollments()->whereIn('status', ['enrolled', 'in_progress'])->count(),
                'completion_rate' => $course->getCompletionRateAttribute(),
                'average_rating' => round($course->reviews()->avg('rating') ?? 0, 1),
                'total_reviews' => $course->reviews()->count()
            ];

            // Increment view count
            Cache::increment("course_views_{$course->id}");

            return response()->json([
                'data' => new CourseResource($course)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la încărcarea cursului',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function enroll(Request $request, Course $course): JsonResponse
    {
        try {
            if (!$course->canUserEnroll($request->user())) {
                return response()->json([
                    'message' => 'Nu vă puteți înscrie la acest curs',
                    'reasons' => $this->getEnrollmentBlockReasons($course, $request->user())
                ], 400);
            }

            DB::beginTransaction();

            $enrollment = $course->enrollUser($request->user());

            DB::commit();

            // Log enrollment
            $this->auditLogService->log(
                $request->user(),
                'course_enrolled',
                "Enrolled in course '{$course->title}'",
                [
                    'course_id' => $course->id,
                    'enrollment_id' => $enrollment->id,
                    'price' => $course->current_price
                ]
            );

            // Send confirmation email (if applicable)
            // $request->user()->notify(new CourseEnrollmentConfirmation($course));

            return response()->json([
                'message' => 'Înscrierea la curs a fost realizată cu succes',
                'data' => [
                    'enrollment' => $enrollment,
                    'course' => new CourseResource($course),
                    'next_steps' => [
                        'Accesați modulele cursului',
                        'Completați activitățile cerute',
                        'Susțineți testele finale pentru certificare'
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Eroare la înscrierea în curs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getProgress(Request $request, Course $course): JsonResponse
    {
        try {
            $enrollment = $course->getUserEnrollment($request->user());

            if (!$enrollment) {
                return response()->json([
                    'message' => 'Nu sunteți înscris la acest curs'
                ], 404);
            }

            $progress = $this->progressService->getDetailedProgress($enrollment);

            return response()->json([
                'data' => $progress
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Eroare la încărcarea progresului',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function completeCourse(Request $request, Course $course): JsonResponse
    {
        try {
            $enrollment = $course->getUserEnrollment($request->user());

            if (!$enrollment) {
                return response()->json(['message' => 'Nu sunteți înscris la acest curs'], 404);
            }

            if ($enrollment->status === 'completed') {
                return response()->json(['message' => 'Cursul este deja completat'], 400);
            }

            // Check completion requirements
            $completionCheck = $this->progressService->checkCompletionRequirements($enrollment);

            if (!$completionCheck['can_complete']) {
                return response()->json([
                    'message' => 'Cursul nu poate fi finalizat încă',
                    'requirements' => $completionCheck['missing_requirements']
                ], 400);
            }

            DB::beginTransaction();

            // Mark as completed
            $enrollment->update([
                'status' => 'completed',
                'completion_date' => now(),
                'progress_percentage' => 100
            ]);

            // Generate certificate
            $certificate = $this->certificationService->generateCertificate($course, $request->user());

            DB::commit();

            // Log completion
            $this->auditLogService->log(
                $request->user(),
                'course_completed',
                "Completed course '{$course->title}' and received certification",
                [
                    'course_id' => $course->id,
                    'certificate_id' => $certificate->id,
                    'cme_credits' => $course->cme_credits,
                    'completion_time' => $enrollment->created_at->diffInDays(now())
                ]
            );

            return response()->json([
                'message' => 'Felicitări! Ați completat cu succes cursul.',
                'data' => [
                    'enrollment' => $enrollment->fresh(),
                    'certificate' => $certificate,
                    'cme_credits_earned' => $course->cme_credits,
                    'next_steps' => [
                        'Descărcați certificatul',
                        'Adăugați creditele EMC în portofoliul profesional',
                        'Explorați cursuri conexe'
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Eroare la finalizarea cursului',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getEnrollmentBlockReasons(Course $course, $user): array
    {
        $reasons = [];

        if ($course->status !== 'published') {
            $reasons[] = 'Cursul nu este încă disponibil';
        }

        if ($course->registration_deadline && $course->registration_deadline < now()) {
            $reasons[] = 'Termenul de înscriere a expirat';
        }

        if ($course->max_participants && $course->enrollments()->count() >= $course->max_participants) {
            $reasons[] = 'Numărul maxim de participanți a fost atins';
        }

        if ($course->enrollments()->where('user_id', $user->id)->exists()) {
            $reasons[] = 'Sunteți deja înscris la acest curs';
        }

        if ($course->requires_approval && !$user->hasRole(['professor', 'admin'])) {
            $reasons[] = 'Cursul necesită aprobare specială';
        }

        return $reasons;
    }
}
