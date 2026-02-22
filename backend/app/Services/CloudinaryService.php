<?php

namespace App\Services;

use Cloudinary\Asset\Image;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    public function uploadImage($file, string $folder = 'properties'): array
    {
        try {
            $result = Cloudinary::upload($file->getRealPath(), [
                'folder'        => "ancerlarins/{$folder}",
                'resource_type' => 'image',
                'transformation' => ['quality' => 'auto', 'fetch_format' => 'auto'],
            ]);

            return [
                'url'       => $result->getSecurePath(),
                'public_id' => $result->getPublicId(),
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed', ['error' => $e->getMessage()]);
            return ['url' => null, 'public_id' => null];
        }
    }

    public function uploadPrivate($file, string $folder = 'verification'): array
    {
        try {
            $result = Cloudinary::upload($file->getRealPath(), [
                'folder'         => "ancerlarins/{$folder}",
                'resource_type'  => 'auto',
                'type'           => 'authenticated',
            ]);

            return [
                'url'       => $result->getSecurePath(),
                'public_id' => $result->getPublicId(),
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary private upload failed', ['error' => $e->getMessage()]);
            return ['url' => null, 'public_id' => null];
        }
    }

    public function getSignedUrl(string $publicId): ?string
    {
        try {
            $url = (string) Image::authenticated($publicId)
                ->signUrl()
                ->toUrl();

            return $url ?: null;
        } catch (\Exception $e) {
            Log::error('Cloudinary signed URL generation failed', [
                'public_id' => $publicId,
                'error'     => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function uploadFromUrl(string $url, string $folder = 'properties'): array
    {
        try {
            $result = Cloudinary::upload($url, [
                'folder'        => "ancerlarins/{$folder}",
                'resource_type' => 'image',
                'transformation' => ['quality' => 'auto', 'fetch_format' => 'auto'],
            ]);

            return [
                'url'       => $result->getSecurePath(),
                'public_id' => $result->getPublicId(),
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload from URL failed', ['url' => $url, 'error' => $e->getMessage()]);
            return ['url' => null, 'public_id' => null];
        }
    }

    public function deleteImage(string $publicId): bool
    {
        try {
            Cloudinary::destroy($publicId);
            return true;
        } catch (\Exception $e) {
            Log::error('Cloudinary delete failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function uploadMultiple(array $files, string $folder = 'properties'): array
    {
        return array_map(fn ($file) => $this->uploadImage($file, $folder), $files);
    }
}
