<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function view(User $user, Lead $lead): bool
    {
        // Admin/staff can view any lead
        if ($user->isAdmin()) {
            return true;
        }

        // Agent can view leads for their own properties (limited fields only)
        return $user->agentProfile
            && $lead->agent_id === $user->agentProfile->id;
    }

    public function updateStatus(User $user): bool
    {
        return $user->isAdmin();
    }

    public function assign(User $user): bool
    {
        return $user->isAdmin();
    }
}
