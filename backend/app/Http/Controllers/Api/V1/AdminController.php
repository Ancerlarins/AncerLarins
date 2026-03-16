<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApprovePropertyRequest;
use App\Http\Requests\Admin\BanUserRequest;
use App\Http\Requests\Admin\DemoteAdminRequest;
use App\Http\Requests\Admin\PromoteAdminRequest;
use App\Http\Requests\Admin\RejectAgentRequest;
use App\Http\Requests\Admin\RejectPropertyRequest;
use App\Http\Requests\Admin\VerifyAgentRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\AdminPropertyResource;
use App\Http\Resources\AgentListResource;
use App\Http\Resources\DashboardStatsResource;
use App\Models\ActivityLog;
use App\Models\AgentProfile;
use App\Models\Property;
use App\Models\Report;
use App\Models\User;
use App\Services\AdminService;
use App\Services\AgentService;
use App\Services\PropertyService;
use App\Services\ReportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin
 *
 * @authenticated
 *
 * Admin dashboard, property/agent moderation, user management, and reports.
 */
class AdminController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AdminService $adminService,
        protected AgentService $agentService,
        protected ReportService $reportService,
        protected PropertyService $propertyService,
    ) {}

    public function dashboard(): JsonResponse
    {
        $stats = $this->adminService->getDashboardStats();

        return $this->successResponse(new DashboardStatsResource($stats));
    }

    public function adminProperties(Request $request): JsonResponse
    {
        $query = Property::query()
            ->with(['propertyType', 'city', 'area', 'agent.user', 'images'])
            ->withCount('reports')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $properties = $query->paginate($request->perPage(20));

        return $this->paginatedResponse(
            $properties->setCollection(
                $properties->getCollection()->map(fn ($p) => new AdminPropertyResource($p))
            )
        );
    }

    public function pendingProperties(Request $request): JsonResponse
    {
        $properties = Property::pending()
            ->with(['propertyType', 'city', 'area', 'agent.user', 'images'])
            ->withCount('reports')
            ->latest()
            ->paginate($request->perPage(20));

        return $this->paginatedResponse(
            $properties->setCollection(
                $properties->getCollection()->map(fn ($p) => new AdminPropertyResource($p))
            )
        );
    }

    public function approveProperty(ApprovePropertyRequest $request): JsonResponse
    {
        $property = Property::findOrFail($request->property_id);
        $property = $this->adminService->approveProperty($property, $request->user());

        return $this->successResponse(
            new AdminPropertyResource($property->load(['propertyType', 'city', 'agent.user'])),
            'Property approved.'
        );
    }

    public function rejectProperty(RejectPropertyRequest $request): JsonResponse
    {
        $property = Property::findOrFail($request->property_id);
        $property = $this->adminService->rejectProperty($property, $request->rejection_reason, $request->user());

        return $this->successResponse(
            new AdminPropertyResource($property->load(['propertyType', 'city', 'agent.user'])),
            'Property rejected.'
        );
    }

    /**
     * Feature a Property
     *
     * Mark a property as featured for a specified number of days.
     *
     * @bodyParam property_id string required UUID of the property. Example: 9c1a2b3d-4e5f-6789-abcd-ef0123456789
     * @bodyParam days integer Number of days to feature. Default: 30. Example: 14
     *
     * @response 200 {"success": true, "message": "Property featured.", "data": null}
     */
    public function featureProperty(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|uuid|exists:properties,id',
            'days' => 'nullable|integer|min:1|max:365',
        ]);

        $property = Property::findOrFail($request->property_id);
        $property = $this->adminService->featureProperty($property, $request->integer('days', 30));

        return $this->successResponse(null, 'Property featured.');
    }

    public function destroyProperty(Property $property): JsonResponse
    {
        $this->propertyService->delete($property);

        return response()->json(null, 204);
    }

    public function pendingAgents(Request $request): JsonResponse
    {
        $agents = AgentProfile::pending()
            ->with('user')
            ->latest()
            ->paginate($request->perPage(20));

        return $this->paginatedResponse(
            $agents->setCollection(
                $agents->getCollection()->map(fn ($a) => new AgentListResource($a))
            )
        );
    }

    public function verifyAgent(VerifyAgentRequest $request): JsonResponse
    {
        $agent = AgentProfile::findOrFail($request->agent_profile_id);
        $this->adminService->verifyAgent($agent, $request->user());

        return $this->successResponse(null, 'Agent verified.');
    }

    public function rejectAgent(RejectAgentRequest $request): JsonResponse
    {
        $agent = AgentProfile::findOrFail($request->agent_profile_id);
        $this->adminService->rejectAgent($agent, $request->rejection_reason, $request->user());

        return $this->successResponse(null, 'Agent verification rejected.');
    }

    public function agentDocuments(AgentProfile $agent): JsonResponse
    {
        $urls = $this->agentService->getVerificationDocumentUrls($agent);

        return $this->successResponse([
            'agent_id' => $agent->id,
            'company_name' => $agent->company_name,
            'documents' => $urls,
            'id_document_type' => $agent->id_document_type,
            'id_document_number' => $agent->id_document_number,
            'verification_status' => $agent->verification_status,
        ]);
    }

    public function banUser(BanUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::findOrFail($data['user_id']);
        $this->adminService->banUser($user, $data['ban_reason'], $request->user());

        return $this->successResponse(null, 'User banned.');
    }

    public function reports(Request $request): JsonResponse
    {
        $reports = Report::with(['reporter', 'reportable', 'resolvedByUser'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest('created_at')
            ->paginate($request->perPage(20));

        return $this->paginatedResponse($reports);
    }

    /**
     * Resolve a Report
     *
     * @bodyParam resolution_note string Optional note about the resolution. Example: Investigated and removed listing.
     *
     * @response 200 {"success": true, "message": "Report resolved.", "data": null}
     */
    public function resolveReport(Request $request, Report $report): JsonResponse
    {
        $request->validate(['resolution_note' => 'nullable|string|max:1000']);

        $this->reportService->resolve($report, $request->user(), $request->resolution_note);

        return $this->successResponse(null, 'Report resolved.');
    }

    public function unbanUser(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $this->adminService->unbanUser($user);

        return $this->successResponse(null, 'User unbanned.');
    }

    public function dismissReport(Request $request, Report $report): JsonResponse
    {
        $request->validate(['resolution_note' => 'nullable|string|max:1000']);

        $this->reportService->dismiss($report, $request->user(), $request->resolution_note);

        return $this->successResponse(null, 'Report dismissed.');
    }

    public function listUsers(Request $request): JsonResponse
    {
        $query = User::query()->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate($request->perPage(20));

        return $this->paginatedResponse($users);
    }

    public function listAdmins(Request $request): JsonResponse
    {
        $admins = User::admins()
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->perPage(20));

        return $this->paginatedResponse($admins);
    }

    public function promoteToAdmin(PromoteAdminRequest $request): JsonResponse
    {
        $target = User::findOrFail($request->user_id);
        $user = $this->adminService->promoteToAdmin($target, $request->user());

        return $this->successResponse($user, 'User promoted to admin.');
    }

    public function demoteAdmin(DemoteAdminRequest $request): JsonResponse
    {
        $target = User::findOrFail($request->user_id);
        $user = $this->adminService->demoteAdmin($target, $request->user());

        return $this->successResponse($user, 'Admin demoted to user.');
    }

    public function getSystemSettings(): JsonResponse
    {
        $settings = $this->adminService->getSystemSettings();

        return $this->successResponse($settings);
    }

    public function updateSystemSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'property_expiry_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'featured_default_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'landmark_radius_km' => ['sometimes', 'numeric', 'min:0.1', 'max:100'],
            'landmark_limit' => ['sometimes', 'integer', 'min:1', 'max:500'],
            'max_upload_size_mb' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $settings = $this->adminService->updateSystemSettings($data, $request->user());

        return $this->successResponse($settings, 'Settings updated.');
    }

    public function activityLogs(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => ['nullable', 'uuid'],
            'action' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $logs = ActivityLog::with('user')
            ->when($request->user_id, fn ($q, $v) => $q->where('user_id', $v))
            ->when($request->action, fn ($q, $v) => $q->where('action', 'like', '%'.str_replace(['%', '_'], ['\\%', '\\_'], $v).'%'))
            ->when($request->date_from, fn ($q, $v) => $q->where('created_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->where('created_at', '<=', $v))
            ->latest('created_at')
            ->paginate($request->perPage(50));

        return $this->paginatedResponse(
            $logs->setCollection(
                $logs->getCollection()->map(fn ($l) => new ActivityLogResource($l))
            )
        );
    }
}
