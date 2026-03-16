<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Enums\TourType;
use App\Enums\UserRole;
use App\Models\AgentProfile;
use App\Models\Landmark;
use App\Models\PriceHistory;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyView;
use App\Models\User;
use App\Models\VirtualTour;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PropertyService
{
    public function __construct(
        protected ImageService $imageService,
        protected NotificationService $notificationService,
        protected ValuationService $valuationService,
        protected FraudDetectionService $fraudDetectionService,
    ) {}

    public function getBySlug(string $slug): ?Property
    {
        $property = Property::where('slug', $slug)
            ->approved()
            ->with([
                'propertyType', 'state', 'city', 'area',
                'images', 'amenities', 'agent.user',
                'virtualTour',
            ])
            ->withCount(['views', 'savedBy'])
            ->first();

        if ($property) {
            $property->similar_count = Property::approved()
                ->where('id', '!=', $property->id)
                ->where('city_id', $property->city_id)
                ->where('listing_type', $property->listing_type)
                ->count();

            $property->ancer_estimate = $this->valuationService->estimate($property);

            // Attach nearby landmarks if property has a location
            if ($property->latitude && $property->longitude) {
                $radiusMeters = config('ancerlarins.landmark_radius_meters', 5000);
                $landmarkLimit = config('ancerlarins.landmark_limit', 10);

                $property->nearby_landmarks = Landmark::whereNotNull('latitude')
                    ->whereNotNull('longitude')
                    ->whereRaw(
                        'ST_Distance_Sphere(POINT(longitude, latitude), POINT(?, ?)) <= ?',
                        [$property->longitude, $property->latitude, $radiusMeters]
                    )
                    ->selectRaw(
                        'id, name, type, ROUND(ST_Distance_Sphere(POINT(longitude, latitude), POINT(?, ?)) / 1000, 1) AS distance_km',
                        [$property->longitude, $property->latitude]
                    )
                    ->orderBy('distance_km')
                    ->limit($landmarkLimit)
                    ->get();
            }
        }

        return $property;
    }

    public function create(array $data, AgentProfile $agent): Property
    {
        return DB::transaction(function () use ($data, $agent) {
            $slug = $this->generateSlug($data['title']);

            $property = new Property(array_merge($data, [
                'agent_id' => $agent->id,
                'slug' => $slug,
            ]));
            $property->status = PropertyStatus::Pending;
            $property->save();

            if (! empty($data['amenity_ids'])) {
                $property->amenities()->sync($data['amenity_ids']);
            }

            if (isset($data['latitude'], $data['longitude'])) {
                $property->setLocation($data['latitude'], $data['longitude']);
            }

            PriceHistory::create([
                'property_id' => $property->id,
                'price_kobo' => $property->price_kobo,
                'recorded_at' => now(),
            ]);

            $property->load(['propertyType', 'state', 'city', 'area', 'amenities', 'agent.user']);

            // Run fraud detection
            $fraud = $this->fraudDetectionService->analyze($property);
            if ($fraud['score'] > 0) {
                $property->forceFill([
                    'fraud_score' => $fraud['score'],
                    'fraud_flags' => $fraud['flags'],
                ])->save();
            }

            // Notify admins about new pending property
            $admins = User::whereIn('role', [UserRole::Admin, UserRole::SuperAdmin])->get();
            foreach ($admins as $admin) {
                $this->notificationService->send(
                    $admin,
                    'New Property Pending Review',
                    "'{$property->title}' by {$property->agent->user->full_name} needs review.",
                    'property_pending',
                    [
                        'action_type' => 'property',
                        'action_id' => $property->id,
                        'action_url' => '/admin/properties/pending',
                    ]
                );
            }

            return $property;
        });
    }

    public function update(Property $property, array $data): Property
    {
        return DB::transaction(function () use ($property, $data) {
            $oldPrice = $property->price_kobo;

            if (isset($data['title']) && $data['title'] !== $property->title) {
                $data['slug'] = $this->generateSlug($data['title']);
            }

            $property->update($data);

            if (! empty($data['amenity_ids'])) {
                $property->amenities()->sync($data['amenity_ids']);
            }

            if (isset($data['latitude'], $data['longitude'])) {
                $property->setLocation($data['latitude'], $data['longitude']);
            }

            if (isset($data['price_kobo']) && $data['price_kobo'] !== $oldPrice) {
                PriceHistory::create([
                    'property_id' => $property->id,
                    'price_kobo' => $data['price_kobo'],
                    'recorded_at' => now(),
                ]);
            }

            return $property->load(['propertyType', 'state', 'city', 'area', 'images', 'amenities', 'agent.user']);
        });
    }

    public function delete(Property $property): void
    {
        DB::transaction(function () use ($property) {
            foreach ($property->images as $image) {
                $this->imageService->delete($image->cloudinary_public_id);
            }

            // Clean up video if present
            if ($property->virtualTour?->cloudinary_public_id) {
                $this->imageService->deleteVideo($property->virtualTour->cloudinary_public_id);
            }

            $property->delete();
        });
    }

    public function uploadImages(Property $property, array $files, array $captions = []): array
    {
        $currentCount = $property->images()->count();
        $maxAllowed = 20 - $currentCount;
        $files = array_slice($files, 0, $maxAllowed);

        $images = [];
        $isFirst = $currentCount === 0;

        foreach ($files as $index => $file) {
            $result = $this->imageService->upload($file, 'properties');

            if ($result['url']) {
                $images[] = $property->images()->create([
                    'image_url' => $result['url'],
                    'thumbnail_url' => $result['thumbnail_url'] ?? $result['url'],
                    'cloudinary_public_id' => $result['public_id'],
                    'caption' => $captions[$index] ?? null,
                    'is_cover' => $isFirst && $index === 0,
                    'sort_order' => $currentCount + $index,
                ]);
            }
        }

        return $images;
    }

    public function uploadVideo(Property $property, $file): VirtualTour
    {
        // Delete existing video if any
        $this->removeVideo($property);

        $result = $this->imageService->uploadVideo($file, 'properties');

        return $property->virtualTour()->create([
            'tour_type' => TourType::Video,
            'url' => $result['url'],
            'cloudinary_public_id' => $result['public_id'],
            'thumbnail_url' => $result['thumbnail_url'],
            'duration_seconds' => $result['duration'] ? (int) round($result['duration']) : null,
        ]);
    }

    public function removeVideo(Property $property): void
    {
        $tour = $property->virtualTour;

        if (! $tour) {
            return;
        }

        if ($tour->cloudinary_public_id) {
            $this->imageService->deleteVideo($tour->cloudinary_public_id);
        }

        $tour->delete();
    }

    public function removeImage(PropertyImage $image): void
    {
        if ($image->cloudinary_public_id) {
            $this->imageService->delete($image->cloudinary_public_id);
        }

        $image->delete();
    }

    public function markAsSold(Property $property): Property
    {
        $property->forceFill(['status' => PropertyStatus::Sold])->save();

        return $property->fresh();
    }

    public function markAsRented(Property $property): Property
    {
        $property->forceFill(['status' => PropertyStatus::Rented])->save();

        return $property->fresh();
    }

    public function incrementViewCount(Property $property, array $meta = []): void
    {
        PropertyView::create([
            'property_id' => $property->id,
            'user_id' => $meta['user_id'] ?? null,
            'session_id' => $meta['session_id'] ?? null,
            'source' => $meta['source'] ?? null,
            'device_type' => $meta['device_type'] ?? null,
        ]);
    }

    protected function generateSlug(string $title): string
    {
        $slug = Str::slug($title);
        $count = Property::where('slug', 'like', "{$slug}%")->count();

        return $count > 0 ? "{$slug}-{$count}" : $slug;
    }
}
