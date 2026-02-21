<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Jobs\MatchSavedSearchesJob;
use App\Models\AgentProfile;
use App\Models\Lead;
use App\Models\Property;
use App\Models\Report;
use App\Models\User;

class AdminService
{
    public function __construct(
        protected NotificationService $notificationService,
    ) {}

    public function getDashboardStats(): array
    {
        return [
            'total_users'           => User::count(),
            'total_agents'          => AgentProfile::count(),
            'total_properties'      => Property::count(),
            'pending_properties'    => Property::pending()->count(),
            'pending_agents'        => AgentProfile::pending()->count(),
            'total_leads'           => Lead::count(),
            'open_reports'          => Report::open()->count(),
            'properties_this_month' => Property::where('created_at', '>=', now()->startOfMonth())->count(),
            'users_this_month'      => User::where('created_at', '>=', now()->startOfMonth())->count(),
        ];
    }

    public function approveProperty(Property $property, User $admin): Property
    {
        $property->update([
            'status'       => PropertyStatus::Approved,
            'approved_by'  => $admin->id,
            'approved_at'  => now(),
            'published_at' => now(),
            'expires_at'   => now()->addDays(90),
        ]);

        $agentUser = $property->agent?->user;
        if ($agentUser) {
            $this->notificationService->send(
                $agentUser,
                'Property Approved',
                "Your property \"{$property->title}\" has been approved and published.",
                'property_approved',
                ['action_type' => 'property', 'action_id' => $property->id, 'action_url' => "/properties/{$property->slug}"]
            );
        }

        // Match against saved searches asynchronously
        MatchSavedSearchesJob::dispatch($property->id);

        return $property->fresh();
    }

    public function rejectProperty(Property $property, string $reason, User $admin): Property
    {
        $property->update([
            'status'           => PropertyStatus::Rejected,
            'rejection_reason' => $reason,
            'approved_by'      => $admin->id,
        ]);

        $agentUser = $property->agent?->user;
        if ($agentUser) {
            $this->notificationService->send(
                $agentUser,
                'Property Rejected',
                "Your property \"{$property->title}\" was rejected: {$reason}",
                'property_rejected',
                ['action_type' => 'property', 'action_id' => $property->id]
            );
        }

        return $property->fresh();
    }

    public function featureProperty(Property $property, int $days = 30): Property
    {
        $property->update([
            'featured'       => true,
            'featured_until' => now()->addDays($days),
        ]);

        return $property->fresh();
    }

    public function verifyAgent(AgentProfile $agent, User $admin): void
    {
        $agent->update([
            'verification_status' => VerificationStatus::Verified,
            'verified_at'         => now(),
            'verified_by'         => $admin->id,
        ]);

        if ($agent->user) {
            $this->notificationService->send(
                $agent->user,
                'Agent Verified',
                'Your agent profile has been verified. You can now list properties.',
                'agent_verified',
            );
        }
    }

    public function rejectAgent(AgentProfile $agent, string $reason, User $admin): void
    {
        $agent->update([
            'verification_status'    => VerificationStatus::Rejected,
            'verification_rejection' => $reason,
        ]);

        if ($agent->user) {
            $this->notificationService->send(
                $agent->user,
                'Verification Rejected',
                "Your agent verification was rejected: {$reason}",
                'agent_rejected',
            );
        }
    }

    public function banUser(User $user, string $reason, User $admin): void
    {
        $user->update([
            'status'     => UserStatus::Banned,
            'ban_reason' => $reason,
            'banned_at'  => now(),
            'banned_by'  => $admin->id,
        ]);

        $user->tokens()->delete();
    }

    public function unbanUser(User $user): void
    {
        $user->update([
            'status'     => UserStatus::Active,
            'ban_reason' => null,
            'banned_at'  => null,
            'banned_by'  => null,
        ]);
    }
}
