<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

class ImageService
{
    /**
     * Resize & save image (main image)
     */
    public function saveImage(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1600,
        int $quality = 80
    ): array {
        $image = Image::make($file)
            ->resize($maxWidth, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            })
            ->encode('jpg', $quality);

        $filename = uniqid() . '.jpg';
        $path = "{$directory}/{$filename}";

        Storage::disk('public')->put($path, (string) $image);

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
        $thumb = Image::make($file)
            ->resize($width, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            })
            ->encode('jpg', $quality);

        $filename = uniqid('thumb_') . '.jpg';
        $path = "{$directory}/thumbnails/{$filename}";

        Storage::disk('public')->put($path, (string) $thumb);

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
