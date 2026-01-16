<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    protected $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Resize & save image (main image)
     */
    public function saveImage(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1600,
        int $quality = 80
    ): array {
        $image = $this->manager->read($file);
        
        // Scale down if wider than maxWidth
        if ($image->width() > $maxWidth) {
            $image->scale(width: $maxWidth);
        }
        
        $encoded = $image->toJpeg(quality: $quality);

        $filename = uniqid() . '.jpg';
        $path = "{$directory}/{$filename}";

        Storage::disk('public')->put($path, (string) $encoded);

        return [
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => 'image/jpeg',
            'size' => Storage::disk('public')->size($path),
        ];
    }

    /**
     * Generate thumbnail
     */
    public function saveThumbnail(
        UploadedFile $file,
        string $directory,
        int $width = 400,
        int $quality = 70
    ): string {
        $thumb = $this->manager->read($file);
        
        // Scale down to thumbnail width
        if ($thumb->width() > $width) {
            $thumb->scale(width: $width);
        }
        
        $encoded = $thumb->toJpeg(quality: $quality);

        $filename = uniqid('thumb_') . '.jpg';
        $path = "{$directory}/thumbnails/{$filename}";

        Storage::disk('public')->put($path, (string) $encoded);

        return $path;
    }

    /**
     * Save non-image file (PDF, DWG, DXF)
     */
    public function saveRawFile(UploadedFile $file, string $directory): array
    {
        $path = $file->store($directory, 'public');

        return [
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];
    }
}
