<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function update(User $user, Property $property): bool
    {
        // Admin can update any property
        if ($user->isAdmin()) {
            return true;
        }

        // Agent can only update their own listings
        return $user->agentProfile
            && $property->agent_id === $user->agentProfile->id;
    }

    public function delete(User $user, Property $property): bool
    {
        return $this->update($user, $property);
    }

    public function uploadImages(User $user, Property $property): bool
    {
        return $this->update($user, $property);
    }

    public function approve(User $user): bool
    {
        return $user->isAdmin();
    }

    public function feature(User $user): bool
    {
        return $user->isAdmin();
    }
}
