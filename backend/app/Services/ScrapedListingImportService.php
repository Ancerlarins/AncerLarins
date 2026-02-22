<?php

namespace App\Services;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\ScrapedListingStatus;
use App\Models\AgentProfile;
use App\Models\Area;
use App\Models\City;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyType;
use App\Models\ScrapedListing;
use App\Models\State;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ScrapedListingImportService
{
    public function __construct(
        protected CloudinaryService $cloudinaryService,
    ) {}

    /**
     * Convert an approved scraped listing into a real Property record.
     *
     * Returns the created Property or null on failure.
     */
    public function import(ScrapedListing $listing, ?string $approvedBy = null): ?Property
    {
        return DB::transaction(function () use ($listing, $approvedBy) {
            $agentId = $this->resolveAgentId();
            $locationIds = $this->resolveLocation($listing->location);
            $propertyTypeId = $this->resolvePropertyType($listing->title, $listing->property_type);
            $listingType = $this->resolveListingType($listing->listing_type);

            $slug = Str::slug($listing->title . '-' . Str::random(6));

            $property = Property::create([
                'agent_id'        => $agentId,
                'listing_type'    => $listingType,
                'property_type_id' => $propertyTypeId,
                'title'           => $listing->title,
                'slug'            => $slug,
                'description'     => $this->buildDescription($listing),
                'price_kobo'      => $listing->price_kobo ?? 0,
                'bedrooms'        => $listing->bedrooms ?? 0,
                'bathrooms'       => 0,
                'toilets'         => 0,
                'state_id'        => $locationIds['state_id'],
                'city_id'         => $locationIds['city_id'],
                'area_id'         => $locationIds['area_id'],
                'address'         => $listing->location ?? 'Lagos, Nigeria',
                'status'          => PropertyStatus::Approved,
                'approved_by'     => $approvedBy,
                'approved_at'     => now(),
                'published_at'    => now(),
                'expires_at'      => now()->addDays(90),
                'meta_title'      => Str::limit($listing->title, 60),
                'meta_description' => Str::limit($this->buildDescription($listing), 155),
            ]);

            // Upload scraped image to Cloudinary, then create cover image
            if ($listing->image_url) {
                $imageUrl = $listing->image_url;

                $uploaded = $this->cloudinaryService->uploadFromUrl($listing->image_url, 'scraped');
                if ($uploaded['url']) {
                    $imageUrl = $uploaded['url'];
                }

                PropertyImage::create([
                    'property_id'  => $property->id,
                    'image_url'    => $imageUrl,
                    'sort_order'   => 0,
                    'is_cover'     => true,
                ]);
            }

            // Link the scraped listing to the new property
            $listing->update([
                'status'              => ScrapedListingStatus::Imported,
                'matched_property_id' => $property->id,
            ]);

            Log::info('Scraped listing imported as property', [
                'scraped_listing_id' => $listing->id,
                'property_id'        => $property->id,
                'source'             => $listing->source,
            ]);

            return $property;
        });
    }

    /**
     * Get or create a platform agent profile for scraped listings.
     */
    private function resolveAgentId(): string
    {
        // Look for an existing platform agent by company name
        $agent = AgentProfile::where('company_name', 'AncerLarins Platform')->first();

        if ($agent) {
            return $agent->id;
        }

        // Find the admin/super_admin user to attach the agent profile to
        $adminUser = User::whereIn('role', ['super_admin', 'admin'])->first();

        if (! $adminUser) {
            // Fallback: use the first agent profile available
            $fallback = AgentProfile::first();
            if ($fallback) {
                return $fallback->id;
            }
            throw new \RuntimeException('No agent profile available for scraped listing import.');
        }

        // Check if admin already has an agent profile
        $existing = AgentProfile::where('user_id', $adminUser->id)->first();
        if ($existing) {
            return $existing->id;
        }

        // Create a platform agent profile under the admin user
        $agent = AgentProfile::create([
            'user_id'             => $adminUser->id,
            'company_name'        => 'AncerLarins Platform',
            'verification_status' => 'verified',
            'verified_at'         => now(),
            'subscription_tier'   => 'basic',
            'max_listings'        => 99999,
            'bio'                 => 'Listings sourced and verified by the AncerLarins platform.',
            'specializations'     => ['residential', 'commercial', 'land'],
            'years_experience'    => 1,
        ]);

        return $agent->id;
    }

    /**
     * Attempt to match the scraped location string to state/city/area IDs.
     * Falls back to Lagos defaults.
     */
    private function resolveLocation(?string $location): array
    {
        // Default to Lagos state
        $state = State::where('slug', 'lagos')->first();
        if (! $state) {
            $state = State::first();
        }

        $defaultCity = City::where('state_id', $state->id)->first();
        $defaultArea = Area::where('city_id', $defaultCity->id)->first();

        if (! $location) {
            return [
                'state_id' => $state->id,
                'city_id'  => $defaultCity->id,
                'area_id'  => $defaultArea->id,
            ];
        }

        $locationLower = Str::lower($location);

        // Try to match an area by name (fuzzy — check if area name appears in location string)
        $area = Area::whereRaw('LOWER(name) = ?', [$locationLower])->first();

        if (! $area) {
            // Partial match: check if any area name is contained in the location string
            $areas = Area::all();
            foreach ($areas as $candidate) {
                if (Str::contains($locationLower, Str::lower($candidate->name))) {
                    $area = $candidate;
                    break;
                }
            }
        }

        if ($area) {
            $city = City::find($area->city_id);
            return [
                'state_id' => $city->state_id ?? $state->id,
                'city_id'  => $city->id ?? $defaultCity->id,
                'area_id'  => $area->id,
            ];
        }

        // Try to match a city
        $city = City::where('state_id', $state->id)
            ->whereRaw('LOWER(name) LIKE ?', ['%' . $locationLower . '%'])
            ->first();

        if ($city) {
            $firstArea = Area::where('city_id', $city->id)->first();
            return [
                'state_id' => $state->id,
                'city_id'  => $city->id,
                'area_id'  => $firstArea->id ?? $defaultArea->id,
            ];
        }

        return [
            'state_id' => $state->id,
            'city_id'  => $defaultCity->id,
            'area_id'  => $defaultArea->id,
        ];
    }

    /**
     * Match scraped property type string to a PropertyType ID.
     */
    private function resolvePropertyType(?string $title, ?string $scrapedType): string
    {
        $searchText = Str::lower(($title ?? '') . ' ' . ($scrapedType ?? ''));

        // Keyword-to-slug mapping ordered by specificity
        $mappings = [
            'penthouse'       => 'penthouse',
            'semi-detached'   => 'semi-detached-duplex',
            'semi detached'   => 'semi-detached-duplex',
            'detached'        => 'detached-house',
            'duplex'          => 'duplex',
            'terrace'         => 'terrace',
            'bungalow'        => 'bungalow',
            'self contain'    => 'self-contain',
            'self-contain'    => 'self-contain',
            'selfcon'         => 'self-contain',
            'room and parlour' => 'room-parlour',
            'room & parlour'  => 'room-parlour',
            'mini flat'       => 'mini-flat',
            'miniflat'        => 'mini-flat',
            'warehouse'       => 'warehouse',
            'shop'            => 'shop-office',
            'office'          => 'shop-office',
            'land'            => 'land',
            'plot'            => 'land',
            'apartment'       => 'flat-apartment',
            'flat'            => 'flat-apartment',
        ];

        foreach ($mappings as $keyword => $slug) {
            if (Str::contains($searchText, $keyword)) {
                $type = PropertyType::where('slug', $slug)->first();
                if ($type) {
                    return $type->id;
                }
            }
        }

        // Default to "Flat / Apartment"
        $default = PropertyType::where('slug', 'flat-apartment')->first();
        return $default ? $default->id : PropertyType::first()->id;
    }

    /**
     * Map scraped listing_type string to ListingType enum.
     */
    private function resolveListingType(?string $type): ListingType
    {
        return match ($type) {
            'sale'      => ListingType::Sale,
            'short_let' => ListingType::ShortLet,
            default     => ListingType::Rent,
        };
    }

    /**
     * Build a description from the scraped data.
     */
    private function buildDescription(ScrapedListing $listing): string
    {
        $parts = [$listing->title];

        if ($listing->location) {
            $parts[] = "Located in {$listing->location}.";
        }

        if ($listing->bedrooms) {
            $parts[] = "{$listing->bedrooms} bedroom" . ($listing->bedrooms > 1 ? 's' : '') . '.';
        }

        if ($listing->price_kobo) {
            $price = number_format($listing->price_kobo / 100, 0, '.', ',');
            $parts[] = "Price: ₦{$price}.";
        }

        $parts[] = "Sourced from {$listing->source}.";

        return implode(' ', $parts);
    }
}
