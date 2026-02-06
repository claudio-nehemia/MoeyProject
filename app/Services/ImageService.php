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

        // Use original filename with timestamp to avoid collision
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = $originalName . '_' . time() . '.jpg';
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

        // Use original filename for thumbnail with timestamp
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = 'thumb_' . $originalName . '_' . time() . '.jpg';
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

        // Use original filename with timestamp to avoid collision
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $timestamp = time();
        $mainFilename = $originalName . '_' . $timestamp . '.jpg';
        $mainPath = "{$directory}/{$mainFilename}";
        Storage::disk('public')->put($mainPath, $mainBinary);

        // Generate thumbnail from the already-scaled main image bytes
        $thumbImage = $this->manager->read($mainBinary);
        if ($thumbImage->width() > $thumbnailWidth) {
            $thumbImage->scale(width: $thumbnailWidth);
        }

        $encodedThumb = $thumbImage->toJpeg(quality: $thumbnailQuality);
        $thumbFilename = 'thumb_' . $originalName . '_' . $timestamp . '.jpg';
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
     * Save non-image file (PDF, DWG, DXF) with original filename
     */
    public function saveRawFile(UploadedFile $file, string $directory): array
    {
        // Use original filename with timestamp to avoid collision
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        $filename = $originalName . '_' . time() . '.' . $extension;
        $path = $file->storeAs($directory, $filename, 'public');

        return [
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];
    }
}
