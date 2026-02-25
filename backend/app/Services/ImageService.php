<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    public function __construct(
        protected CloudinaryService $cloudinaryService,
    ) {}

    public function upload($file, string $folder = 'properties'): array
    {
        // Try Cloudinary first if configured
        if ($this->isCloudinaryConfigured()) {
            $result = $this->cloudinaryService->uploadImage($file, $folder);

            if ($result['url']) {
                return [
                    'url'           => $result['url'],
                    'thumbnail_url' => $this->generateThumbnailUrl($result['url']),
                    'public_id'     => $result['public_id'],
                ];
            }
        }

        // Fallback to local storage
        return $this->uploadLocal($file, $folder);
    }

    public function uploadPrivate($file, string $folder = 'verification'): array
    {
        if ($this->isCloudinaryConfigured()) {
            $result = $this->cloudinaryService->uploadPrivate($file, $folder);
            if ($result['url']) {
                return $result;
            }
        }

        // Fallback: store in private local disk
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs("private/{$folder}", $filename, 'local');

        return [
            'url'       => url("storage/private/{$folder}/{$filename}"),
            'public_id' => "local:{$path}",
        ];
    }

    public function getSignedUrl(?string $publicId): ?string
    {
        if (! $publicId) {
            return null;
        }

        if (str_starts_with($publicId, 'local:')) {
            return url('storage/' . str_replace('local:', '', $publicId));
        }

        return $this->cloudinaryService->getSignedUrl($publicId);
    }

    public function delete(?string $publicId): bool
    {
        if (! $publicId) {
            return false;
        }

        if (str_starts_with($publicId, 'local:')) {
            $path = str_replace('local:', '', $publicId);
            return Storage::disk('public')->delete($path);
        }

        return $this->cloudinaryService->deleteImage($publicId);
    }

    protected function uploadLocal($file, string $folder): array
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($folder, $filename, 'public');
        $url = url("storage/{$path}");

        return [
            'url'           => $url,
            'thumbnail_url' => $url, // same URL for local (no on-the-fly transforms)
            'public_id'     => "local:{$path}",
        ];
    }

    protected function isCloudinaryConfigured(): bool
    {
        $url = config('cloudinary.cloud_url') ?: env('CLOUDINARY_URL', '');

        // Detect placeholder credentials
        return $url
            && ! str_contains($url, 'API_KEY')
            && ! str_contains($url, 'API_SECRET')
            && ! str_contains($url, 'CLOUD_NAME');
    }

    protected function generateThumbnailUrl(string $url): string
    {
        return str_replace('/upload/', '/upload/c_fill,w_400,h_300,q_auto/', $url);
    }

    protected function applyWatermark(string $url): string
    {
        return str_replace(
            '/upload/',
            '/upload/l_text:Arial_24_bold:AncerLarins,co_rgb:FFFFFF,o_40,g_south_east,x_10,y_10/',
            $url
        );
    }
}
