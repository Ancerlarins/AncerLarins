<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\CreateInquiryRequest;
use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use App\Services\LeadService;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected LeadService $leadService,
        protected NotificationService $notificationService,
    ) {}

    // ── Public ─────────────────────────────────────────────

    public function store(CreateInquiryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $property = Property::with('agent')->findOrFail($data['property_id']);

        ['lead' => $lead, 'assigned_to' => $staffMember] = $this->leadService->createFromInquiry(
            $data,
            $property,
            $request->user(),
        );

        // Notify assigned staff
        if ($staffMember) {
            $this->notificationService->send(
                $staffMember,
                "New inquiry for {$property->title}",
                ($data['full_name'] ?? $request->user()?->full_name ?? 'A buyer') . ' is interested in viewing this property.',
                'new_inquiry',
                ['action_type' => 'inquiry', 'action_id' => $lead->id, 'action_url' => '/admin/inquiries'],
            );
        }

        return $this->successResponse(
            ['inquiry_id' => $lead->id, 'tracking_ref' => $lead->tracking_ref],
            'Thank you! Our team will contact you within 2 hours to arrange your private viewing.',
            201
        );
    }

    // ── Public: Buyer tracking ────────────────────────────

    public function track(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ref'   => ['required', 'string', 'size:10'],
            'email' => ['required', 'email'],
        ]);

        $lead = Lead::where('tracking_ref', $data['ref'])
            ->where('email_hash', Lead::hashEmail($data['email']))
            ->first();

        if (!$lead) {
            return $this->errorResponse('No inquiry found. Please check your reference number and email.', 404);
        }

        $lead->load('property:id,title,slug,price_kobo');

        $statusLabels = [
            'new'                  => 'Received',
            'contacted'            => 'Under Review',
            'qualified'            => 'Qualified',
            'agreement_signed'     => 'Agreement Signed',
            'inspection_scheduled' => 'Viewing Scheduled',
            'negotiating'          => 'In Negotiation',
            'offer_made'           => 'Offer Made',
            'closed_won'           => 'Closed — Congratulations!',
            'closed_lost'          => 'Closed',
        ];

        return $this->successResponse([
            'tracking_ref'  => $lead->tracking_ref,
            'status'        => $lead->status,
            'status_label'  => $statusLabels[$lead->status] ?? $lead->status,
            'property'      => $lead->property ? [
                'title'           => $lead->property->title,
                'slug'            => $lead->property->slug,
                'formatted_price' => '₦' . number_format($lead->property->price_kobo / 100, 0, '.', ','),
            ] : null,
            'inspection_date'     => $lead->inspection_date?->toDateString(),
            'inspection_time'     => $lead->inspection_time,
            'inspection_location' => $lead->inspection_location,
            'agreement_accepted'  => (bool) $lead->agreement_accepted_at,
            'created_at'          => $lead->created_at?->toIso8601String(),
            'qualified_at'        => $lead->qualified_at?->toIso8601String(),
            'inspection_at'       => $lead->inspection_at?->toIso8601String(),
        ]);
    }

    public function acceptAgreement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ref'   => ['required', 'string', 'size:10'],
            'email' => ['required', 'email'],
        ]);

        $lead = Lead::where('tracking_ref', $data['ref'])
            ->where('email_hash', Lead::hashEmail($data['email']))
            ->first();

        if (!$lead) {
            return $this->errorResponse('No inquiry found.', 404);
        }

        if ($lead->agreement_accepted_at) {
            return $this->errorResponse('Agreement has already been accepted.', 422);
        }

        $lead->update([
            'agreement_accepted_at'   => now(),
            'agreement_ip'            => $request->ip(),
            'agreement_terms_version' => '1.0',
        ]);

        // Notify assigned staff
        if ($lead->assigned_to) {
            $staff = User::find($lead->assigned_to);
            if ($staff) {
                $lead->load('property:id,title');
                $this->notificationService->send(
                    $staff,
                    'Buyer agreement accepted',
                    "{$lead->full_name} has digitally accepted the service agreement for \"{$lead->property?->title}\".",
                    'agreement_accepted',
                    ['action_type' => 'inquiry', 'action_id' => $lead->id, 'action_url' => '/admin/inquiries'],
                );
            }
        }

        return $this->successResponse(null, 'Agreement accepted successfully.');
    }

    // ── Admin ──────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Lead::with(['property:id,title,slug,price_kobo,agent_id', 'assignedStaff:id,first_name,last_name'])
            ->whereNotNull('status')
            ->where('status', '!=', '');

        if ($status = $request->query('status')) {
            $query->byStatus($status);
        }
        if ($assignedTo = $request->query('assigned_to')) {
            $query->byAssignedTo($assignedTo);
        }
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }
        if ($qualification = $request->query('qualification')) {
            $query->byQualification($qualification);
        }

        $paginator = $query->orderByDesc('created_at')
            ->paginate($request->perPage(20));

        // Format items for admin view
        $items = collect($paginator->items())->map(fn (Lead $lead) => [
            'id'             => $lead->id,
            'full_name'      => $lead->full_name,
            'phone'          => $lead->phone,
            'email'          => $lead->email,
            'budget_range'   => $lead->budget_range,
            'timeline'       => $lead->timeline,
            'financing_type'  => $lead->financing_type,
            'status'          => $lead->status,
            'qualification'   => $lead->qualification,
            'assigned_to'     => $lead->assignedStaff ? [
                'id'        => $lead->assignedStaff->id,
                'full_name' => $lead->assignedStaff->full_name,
            ] : null,
            'property' => $lead->property ? [
                'id'              => $lead->property->id,
                'title'           => $lead->property->title,
                'slug'            => $lead->property->slug,
                'formatted_price' => '₦' . number_format($lead->property->price_kobo / 100, 0, '.', ','),
            ] : null,
            'created_at' => $lead->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    public function show(Lead $lead): JsonResponse
    {
        $lead->load([
            'property:id,title,slug,price_kobo,agent_id',
            'property.agent:id,company_name,user_id',
            'property.agent.user:id,first_name,last_name',
            'assignedStaff:id,first_name,last_name',
            'user:id,first_name,last_name',
        ]);

        return $this->successResponse([
            'id'             => $lead->id,
            'full_name'      => $lead->full_name,
            'phone'          => $lead->phone,
            'email'          => $lead->email,
            'budget_range'   => $lead->budget_range,
            'timeline'       => $lead->timeline,
            'financing_type' => $lead->financing_type,
            'message'        => $lead->message,
            'status'         => $lead->status,
            'qualification'  => $lead->qualification,
            'staff_notes'    => $lead->staff_notes,
            'assigned_to'    => $lead->assignedStaff ? [
                'id'        => $lead->assignedStaff->id,
                'full_name' => $lead->assignedStaff->full_name,
            ] : null,
            'property' => $lead->property ? [
                'id'              => $lead->property->id,
                'title'           => $lead->property->title,
                'slug'            => $lead->property->slug,
                'formatted_price' => '₦' . number_format($lead->property->price_kobo / 100, 0, '.', ','),
            ] : null,
            'agent' => $lead->property?->agent ? [
                'company_name' => $lead->property->agent->company_name,
                'user_name'    => $lead->property->agent->user?->full_name,
            ] : null,
            'user' => $lead->user ? [
                'id'        => $lead->user->id,
                'full_name' => $lead->user->full_name,
            ] : null,
            'qualified_at'          => $lead->qualified_at?->toIso8601String(),
            'inspection_at'         => $lead->inspection_at?->toIso8601String(),
            'closed_at'             => $lead->closed_at?->toIso8601String(),
            'created_at'            => $lead->created_at?->toIso8601String(),
            'tracking_ref'          => $lead->tracking_ref,
            'inspection_date'       => $lead->inspection_date?->toDateString(),
            'inspection_time'       => $lead->inspection_time,
            'inspection_location'   => $lead->inspection_location,
            'inspection_notes'      => $lead->inspection_notes,
            'agreement_accepted_at' => $lead->agreement_accepted_at?->toIso8601String(),
            'agreement_ip'          => $lead->agreement_ip,
            'agreement_terms_version' => $lead->agreement_terms_version,
        ]);
    }

    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->validate([
            'status'              => ['required', 'in:new,contacted,qualified,agreement_signed,inspection_scheduled,negotiating,offer_made,closed_won,closed_lost'],
            'qualification'       => ['nullable', 'in:qualified,not_qualified,cold,fake'],
            'staff_notes'         => ['nullable', 'string', 'max:2000'],
            'inspection_date'     => ['nullable', 'date', 'after_or_equal:today'],
            'inspection_time'     => ['nullable', 'string', 'max:10'],
            'inspection_location' => ['nullable', 'string', 'max:500'],
            'inspection_notes'    => ['nullable', 'string', 'max:1000'],
        ]);

        $previousStatus = $lead->status;
        $updates = ['status' => $data['status']];

        if (array_key_exists('qualification', $data)) {
            $updates['qualification'] = $data['qualification'];
        }

        if (array_key_exists('staff_notes', $data)) {
            $updates['staff_notes'] = $data['staff_notes'];
        }

        // Inspection scheduling fields
        foreach (['inspection_date', 'inspection_time', 'inspection_location', 'inspection_notes'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        // Auto-set timestamps based on status transitions
        if ($data['status'] === 'qualified' && !$lead->qualified_at) {
            $updates['qualified_at'] = now();
        }
        if ($data['status'] === 'inspection_scheduled' && !$lead->inspection_at) {
            $updates['inspection_at'] = now();
        }
        if (in_array($data['status'], ['closed_won', 'closed_lost']) && !$lead->closed_at) {
            $updates['closed_at'] = now();
        }

        $lead->update($updates);

        // Send notifications only when status actually changed
        if ($previousStatus !== $data['status']) {
            $lead->load('property:id,title');
            $propertyTitle = $lead->property?->title ?? 'a property';

            // Notify buyer (if they have an account)
            if ($lead->user_id) {
                $buyerUser = User::find($lead->user_id);
                if ($buyerUser) {
                    $this->sendBuyerStatusNotification($buyerUser, $lead, $data['status'], $propertyTitle);
                }
            }

            // Notify agent when inspection is scheduled
            if ($data['status'] === 'inspection_scheduled') {
                $lead->load('agent.user');
                $agentUser = $lead->agent?->user;
                if ($agentUser) {
                    $inspectionDetail = $data['inspection_date'] ?? 'TBD';
                    $this->notificationService->send(
                        $agentUser,
                        'Viewing scheduled for your property',
                        "A private viewing has been scheduled for \"{$propertyTitle}\" on {$inspectionDetail}. AncerLarins will coordinate the details.",
                        'inspection_scheduled',
                        ['action_type' => 'inquiry', 'action_id' => $lead->id, 'action_url' => '/dashboard/leads'],
                    );
                }
            }
        }

        return $this->successResponse(null, 'Status updated.');
    }

    protected function sendBuyerStatusNotification(User $buyer, Lead $lead, string $newStatus, string $propertyTitle): void
    {
        $messages = [
            'contacted'            => [
                'title' => 'We received your inquiry',
                'body'  => "Our team is reviewing your interest in \"{$propertyTitle}\". We'll be in touch shortly.",
            ],
            'qualified'            => [
                'title' => 'You\'ve been qualified',
                'body'  => "Great news! You've been qualified for \"{$propertyTitle}\". Our team will arrange next steps.",
            ],
            'agreement_signed'     => [
                'title' => 'Agreement confirmed',
                'body'  => "Your service agreement for \"{$propertyTitle}\" has been recorded. We're moving forward.",
            ],
            'inspection_scheduled' => [
                'title' => 'Your private viewing is confirmed',
                'body'  => "Your private viewing for \"{$propertyTitle}\" has been scheduled. Check your email for details.",
            ],
            'negotiating'          => [
                'title' => 'Negotiation in progress',
                'body'  => "We're actively negotiating on your behalf for \"{$propertyTitle}\". We'll update you soon.",
            ],
            'offer_made'           => [
                'title' => 'Offer submitted',
                'body'  => "An offer has been made for \"{$propertyTitle}\". We'll notify you once we hear back.",
            ],
            'closed_won'           => [
                'title' => 'Congratulations!',
                'body'  => "The deal for \"{$propertyTitle}\" has been successfully closed. Welcome to your new property!",
            ],
            'closed_lost'          => [
                'title' => 'Inquiry closed',
                'body'  => "Your inquiry for \"{$propertyTitle}\" has been closed. Feel free to explore other properties on AncerLarins.",
            ],
        ];

        if (!isset($messages[$newStatus])) {
            return;
        }

        $msg = $messages[$newStatus];

        $this->notificationService->send(
            $buyer,
            $msg['title'],
            $msg['body'],
            'inquiry_status_update',
            [
                'action_type' => 'inquiry',
                'action_id'   => $lead->id,
                'action_url'  => '/track-inquiry?ref=' . $lead->tracking_ref,
            ],
        );
    }

    public function assign(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->validate([
            'assigned_to' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $lead->update(['assigned_to' => $data['assigned_to']]);

        // Notify newly assigned staff
        $staff = User::find($data['assigned_to']);
        if ($staff) {
            $lead->load('property:id,title');
            $this->notificationService->send(
                $staff,
                'Inquiry assigned to you',
                "You've been assigned an inquiry for {$lead->property?->title}.",
                'inquiry_assigned',
                ['action_type' => 'inquiry', 'action_id' => $lead->id, 'action_url' => '/admin/inquiries'],
            );
        }

        return $this->successResponse(null, 'Inquiry reassigned.');
    }

    // ── Agent ──────────────────────────────────────────────

    public function agentInquiries(Request $request): JsonResponse
    {
        $user = $request->user();
        $agentProfile = $user->agentProfile;

        if (!$agentProfile) {
            return $this->errorResponse('Agent profile not found.', 403);
        }

        $paginator = Lead::where('agent_id', $agentProfile->id)
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->with('property:id,title,slug')
            ->select(['id', 'property_id', 'full_name', 'status', 'created_at'])
            ->orderByDesc('created_at')
            ->paginate($request->perPage(20));

        // Agent sees name + property only — NO phone/email
        $items = collect($paginator->items())->map(fn (Lead $lead) => [
            'id'        => $lead->id,
            'full_name' => $lead->full_name,
            'status'    => $lead->status,
            'property'  => $lead->property ? [
                'id'    => $lead->property->id,
                'title' => $lead->property->title,
                'slug'  => $lead->property->slug,
            ] : null,
            'created_at' => $lead->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }
}
