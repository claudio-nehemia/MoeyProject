<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Notification;

echo "=== DEBUGGING ESTIMASI RELASI ===\n";

// Cek orders dengan estimasi_request notifications
$orders = Order::with(['estimasi', 'moodboard.estimasi', 'moodboard'])
    ->whereHas('notifications', function($q) {
        $q->where('type', 'estimasi_request');
    })->limit(3)->get();

foreach($orders as $order) {
    echo "Order: {$order->id} - {$order->nama_project}\n";
    
    echo "Has moodboard: " . ($order->moodboard ? 'YES' : 'NO') . "\n";
    if($order->moodboard) {
        echo "  Moodboard ID: {$order->moodboard->id}\n";
    }
    
    echo "Via hasOneThrough estimasi: " . ($order->estimasi ? 'YES' : 'NO') . "\n";
    if($order->estimasi) {
        echo "  Estimasi ID: {$order->estimasi->id}\n";
        echo "  response_time: " . ($order->estimasi->response_time ?? 'NULL') . "\n";
        echo "  response_by: " . ($order->estimasi->response_by ?? 'NULL') . "\n";
    }
    
    echo "Via moodboard.estimasi: " . ($order->moodboard?->estimasi ? 'YES' : 'NO') . "\n";
    if($order->moodboard?->estimasi) {
        echo "  Estimasi ID: {$order->moodboard->estimasi->id}\n";
        echo "  response_time: " . ($order->moodboard->estimasi->response_time ?? 'NULL') . "\n";
        echo "  response_by: " . ($order->moodboard->estimasi->response_by ?? 'NULL') . "\n";
    }
    
    echo "---\n";
}