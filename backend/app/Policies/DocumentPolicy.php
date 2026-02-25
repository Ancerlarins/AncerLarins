<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function updateStatus(User $user): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Document $document): bool
    {
        // Only the uploader or an admin can delete
        if ($user->isAdmin()) {
            return true;
        }

        return $document->uploaded_by === $user->id;
    }
}
