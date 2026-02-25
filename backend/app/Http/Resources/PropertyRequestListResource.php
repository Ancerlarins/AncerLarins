<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyRequestListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'title'           => $this->title,
            'listing_type'    => $this->listing_type?->value,
            'min_bedrooms'    => $this->min_bedrooms,
            'max_bedrooms'    => $this->max_bedrooms,
            'budget_kobo'     => $this->budget_kobo,
            'status'          => $this->status?->value,
            'response_count'  => $this->response_count,
            'expires_at'      => $this->expires_at?->toISOString(),
            'area'            => $this->when(
                $this->relationLoaded('area') && $this->area,
                fn () => [
                    'id'   => $this->area->id,
                    'name' => $this->area->name,
                ]
            ),
            'city'            => $this->when(
                $this->relationLoaded('city') && $this->city,
                fn () => [
                    'id'   => $this->city->id,
                    'name' => $this->city->name,
                ]
            ),
            'created_at'      => $this->created_at?->toISOString(),
        ];
    }
}
