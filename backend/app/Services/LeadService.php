<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LeadService
{
    public function __construct(
        protected NotificationService $notificationService,
    ) {}

    public function create(Property $property, User $user, string $contactType, ?string $source = null, ?string $utmCampaign = null): Lead
    {
        $lead = Lead::create([
            'property_id'  => $property->id,
            'agent_id'     => $property->agent_id,
            'user_id'      => $user->id,
            'contact_type' => $contactType,
            'source'       => $source,
            'utm_campaign' => $utmCampaign,
        ]);

        // Increment property contact counter
        $property->increment('contact_count');

        // Increment agent's total_leads counter
        if ($property->agent) {
            $property->agent->increment('total_leads');

            // Send push notification to agent
            $contactLabel = match ($contactType) {
                'whatsapp' => 'WhatsApp message',
                'call'     => 'phone call',
                default    => 'inquiry',
            };

            $this->notificationService->send(
                $property->agent->user,
                "New lead for {$property->title}!",
                "{$user->full_name} wants to reach you via {$contactLabel}.",
                'new_lead',
                ['action_type' => 'lead', 'action_id' => $lead->id, 'action_url' => '/dashboard/leads'],
            );
        }

        return $lead;
    }

    public function generateWhatsAppLink(Property $property, ?string $leadId = null): string
    {
        $agent = $property->agent;
        $phone = $agent?->whatsapp_number ?? $agent?->user?->phone ?? '';
        $phone = preg_replace('/[^0-9]/', '', $phone);

        $property->loadMissing(['area', 'city']);

        $frontendUrl = config('ancerlarins.frontend_url');
        $propertyUrl = "{$frontendUrl}/properties/{$property->slug}";
        if ($leadId) {
            $propertyUrl .= "?utm_source=whatsapp&utm_campaign={$leadId}";
        }

        $price = '₦' . number_format($property->price_kobo / 100, 0, '.', ',');

        $message = str_replace(
            [':title', ':area', ':city', ':price', ':url'],
            [
                $property->title,
                $property->area?->name ?? '',
                $property->city?->name ?? '',
                $price,
                $propertyUrl,
            ],
            config('ancerlarins.whatsapp_template'),
        );

        return "https://wa.me/{$phone}?text=" . urlencode($message);
    }

    /**
     * Create a lead from the inquiry form with smart staff assignment.
     *
     * High-value properties (>=₦300M) are routed to super_admin first.
     * All others use round-robin across admin/super_admin staff with the
     * fewest active (non-closed) leads.
     *
     * @return array{lead: Lead, assigned_to: ?User}
     */
    public function createFromInquiry(array $data, Property $property, ?User $user): array
    {
        // Prevent duplicate inquiries within 24 hours
        $existingQuery = Lead::where('property_id', $property->id)
            ->where('created_at', '>=', now()->subDay());

        if ($user) {
            $existingQuery->where('user_id', $user->id);
        } elseif (!empty($data['email'])) {
            $existingQuery->where('email_hash', Lead::hashEmail($data['email']));
        }

        $existing = $existingQuery->first();
        if ($existing) {
            return ['lead' => $existing, 'assigned_to' => $existing->assigned_to ? User::find($existing->assigned_to) : null];
        }

        $leadData = [
            'property_id'    => $property->id,
            'agent_id'       => $property->agent_id,
            'user_id'        => $user?->id,
            'contact_type'   => 'form',
            'full_name'      => $data['full_name'] ?? $user?->full_name,
            'email'          => $data['email'] ?? $user?->email,
            'phone'          => $data['phone'] ?? $user?->phone,
            'budget_range'   => $data['budget_range'] ?? null,
            'timeline'       => $data['timeline'] ?? null,
            'financing_type' => $data['financing_type'] ?? null,
            'message'        => $data['message'] ?? null,
            'source'         => $data['source'] ?? null,
        ];

        $staffMember = $this->assignStaff($property);

        $lead = Lead::create($leadData);

        // Set admin-managed fields outside $fillable
        $adminFields = ['status' => 'new'];
        if ($staffMember) {
            $adminFields['assigned_to'] = $staffMember->id;
        }
        $lead->forceFill($adminFields)->save();

        // Increment counters
        $property->increment('contact_count');
        if ($property->agent) {
            $property->agent->increment('total_leads');
        }

        return ['lead' => $lead, 'assigned_to' => $staffMember];
    }

    /**
     * Determine which staff member should be assigned a new lead.
     */
    protected function assignStaff(Property $property): ?User
    {
        $highValueThreshold = 30_000_000_000; // ₦300M in kobo
        $isHighValue = $property->price_kobo >= $highValueThreshold;

        $staffQuery = User::where('status', 'active')
            ->withCount(['assignedInquiries' => fn ($q) => $q->whereNotIn('status', ['closed_won', 'closed_lost'])])
            ->orderBy('assigned_inquiries_count', 'asc');

        if ($isHighValue) {
            $staff = (clone $staffQuery)->where('role', 'super_admin')->first()
                ?? $staffQuery->whereIn('role', ['admin', 'super_admin'])->first();
        } else {
            $staff = $staffQuery->whereIn('role', ['admin', 'super_admin'])->first();
        }

        if (!$staff) {
            Log::warning('No staff available for lead assignment', [
                'property_id' => $property->id,
                'is_high_value' => $isHighValue,
            ]);
        }

        return $staff;
    }

    public function markResponded(Lead $lead): void
    {
        $lead->markResponded();
    }
}
