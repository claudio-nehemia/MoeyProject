<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Test TaskResponse untuk estimasi
echo "=== TESTING TASK RESPONSE FOR ESTIMASI ===\n";

$tasks = \App\Models\TaskResponse::where('tahap', 'estimasi')->get();
echo "Total estimasi task responses: " . $tasks->count() . "\n";

foreach ($tasks->take(5) as $task) {
    echo "Order ID: {$task->order_id}, Status: {$task->status}, Deadline: " . ($task->deadline ? $task->deadline->format('Y-m-d H:i') : 'NULL') . "\n";
}

// Test API endpoint
echo "\n=== TESTING API ENDPOINT ===\n";
if ($tasks->count() > 0) {
    $firstTask = $tasks->first();
    echo "Testing API for order {$firstTask->order_id}...\n";
    
    // Simulate API call
    $taskResponse = \App\Models\TaskResponse::where('order_id', $firstTask->order_id)
        ->where('tahap', 'estimasi')
        ->orderBy('created_at', 'desc')
        ->get();
    
    echo "API would return: " . json_encode($taskResponse->toArray(), JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== CHECKING MOODBOARD CONTROLLER LOGIC ===\n";
// Check if moodboards exist without task responses
$moodboards = \App\Models\Moodboard::with('order')->get();
echo "Total moodboards: " . $moodboards->count() . "\n";

$moodboardsWithoutEstimasiTask = 0;
foreach ($moodboards as $moodboard) {
    $hasEstimasiTask = \App\Models\TaskResponse::where('order_id', $moodboard->order_id)
        ->where('tahap', 'estimasi')
        ->exists();
    
    if (!$hasEstimasiTask) {
        $moodboardsWithoutEstimasiTask++;
        echo "Moodboard {$moodboard->id} (Order {$moodboard->order_id}) has no estimasi task response\n";
    }
}

echo "Moodboards without estimasi task: {$moodboardsWithoutEstimasiTask}\n";
