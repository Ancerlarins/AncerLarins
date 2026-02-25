<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'total_users'            => $this['total_users'] ?? 0,
            'total_agents'           => $this['total_agents'] ?? 0,
            'total_properties'       => $this['total_properties'] ?? 0,
            'pending_approvals'      => $this['pending_approvals'] ?? 0,
            'pending_agents'         => $this['pending_agents'] ?? 0,
            'total_leads'            => $this['total_leads'] ?? 0,
            'leads_this_week'        => $this['leads_this_week'] ?? 0,
            'open_reports'           => $this['open_reports'] ?? 0,
            'properties_by_status'   => $this['properties_by_status'] ?? [],
            'agents_by_verification' => $this['agents_by_verification'] ?? [],
            'new_listings_this_week' => $this['new_listings_this_week'] ?? 0,
            'new_users_this_week'    => $this['new_users_this_week'] ?? 0,
        ];
    }
}
