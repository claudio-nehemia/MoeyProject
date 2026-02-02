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
     * Resize, save main image, and generate thumbnail efficiently.
     *
     * Performance note: thumbnail is generated from the already-encoded main JPEG
     * to avoid decoding the original file twice (which is slow for large images).
     */
    public function saveImageWithThumbnail(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1600,
        int $quality = 80,
        int $thumbnailWidth = 400,
        int $thumbnailQuality = 70
    ): array {
        $image = $this->manager->read($file);

        if ($image->width() > $maxWidth) {
            $image->scale(width: $maxWidth);
        }

        $encodedMain = $image->toJpeg(quality: $quality);
        $mainBinary = (string) $encodedMain;

        $mainFilename = uniqid() . '.jpg';
        $mainPath = "{$directory}/{$mainFilename}";
        Storage::disk('public')->put($mainPath, $mainBinary);

        // Generate thumbnail from the already-scaled main image bytes
        $thumbImage = $this->manager->read($mainBinary);
        if ($thumbImage->width() > $thumbnailWidth) {
            $thumbImage->scale(width: $thumbnailWidth);
        }

        $encodedThumb = $thumbImage->toJpeg(quality: $thumbnailQuality);
        $thumbFilename = uniqid('thumb_') . '.jpg';
        $thumbPath = "{$directory}/thumbnails/{$thumbFilename}";
        Storage::disk('public')->put($thumbPath, (string) $encodedThumb);

        return [
            'path' => $mainPath,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => 'image/jpeg',
            'size' => Storage::disk('public')->size($mainPath),
            'thumbnail' => $thumbPath,
        ];
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
