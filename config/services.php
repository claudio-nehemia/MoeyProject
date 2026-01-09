<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'model' => App\Models\User::class,
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Firebase Cloud Messaging (FCM) Settings - V1 API
    |--------------------------------------------------------------------------
    |
    | Using Firebase Admin SDK with Service Account JSON.
    | This is the MODERN and RECOMMENDED method (not Legacy Server Key).
    | 
    | How to get Service Account JSON:
    | 1. Firebase Console > Project Settings > Service Accounts tab
    | 2. Click "Generate new private key"
    | 3. Save to: storage/firebase/service-account.json
    |
    */
    'fcm' => [
        'service_account' => storage_path('firebase/service-account.json'),
        'project_id' => env('FCM_PROJECT_ID', ''),
    ],

];
