<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminPropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'title'         => $this->title,
            'slug'          => $this->slug,
            'listing_type'  => $this->listing_type,
            'price_kobo'    => $this->price_kobo,
            'formatted_price' => $this->formatted_price,
            'status'        => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'featured'      => $this->featured,
            'bedrooms'      => $this->bedrooms,
            'bathrooms'     => $this->bathrooms,
            'address'       => $this->address,
            'property_type' => $this->when(
                $this->relationLoaded('propertyType'),
                fn () => [
                    'id'   => $this->propertyType->id,
                    'name' => $this->propertyType->name,
                ]
            ),
            'city' => $this->when(
                $this->relationLoaded('city'),
                fn () => [
                    'id'   => $this->city->id,
                    'name' => $this->city->name,
                ]
            ),
            'area' => $this->when(
                $this->relationLoaded('area') && $this->area,
                fn () => [
                    'id'   => $this->area->id,
                    'name' => $this->area->name,
                ]
            ),
            'agent' => $this->when(
                $this->relationLoaded('agent'),
                fn () => $this->agent ? [
                    'id'           => $this->agent->id,
                    'company_name' => $this->agent->company_name,
                    'user_name'    => $this->agent->user?->full_name,
                    'is_verified'  => $this->agent->isVerified(),
                ] : null
            ),
            'agent_detail' => $this->when(
                $this->relationLoaded('agent'),
                fn () => $this->agent ? [
                    'id'                  => $this->agent->id,
                    'company_name'        => $this->agent->company_name,
                    'user_name'           => $this->agent->user?->full_name,
                    'verification_status' => $this->agent->verification_status?->value,
                ] : null
            ),
            'cover_image' => $this->when(
                $this->relationLoaded('images'),
                fn () => $this->coverImage ? [
                    'url'           => $this->coverImage->url,
                    'thumbnail_url' => $this->coverImage->thumbnail_url,
                ] : null
            ),
            'images' => $this->when(
                $this->relationLoaded('images'),
                fn () => $this->images->map(fn ($img) => [
                    'id'            => $img->id,
                    'url'           => $img->url,
                    'thumbnail_url' => $img->thumbnail_url,
                    'is_cover'      => $img->is_cover,
                ])
            ),
            'fraud_score'  => $this->fraud_score,
            'report_count' => $this->when(isset($this->reports_count), $this->reports_count),
            'approved_by'  => $this->approved_by,
            'approved_at'  => $this->approved_at?->toISOString(),
            'published_at' => $this->published_at?->toISOString(),
            'expires_at'   => $this->expires_at?->toISOString(),
            'created_at'   => $this->created_at?->toISOString(),
        ];
    }
}
