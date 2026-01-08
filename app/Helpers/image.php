<?php

use App\Services\ImageService;

if (! function_exists('image_service')) {
    function image_service(): ImageService
    {
        return app(ImageService::class);
    }
}
