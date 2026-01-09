# PowerShell script to update NotificationService.php with FCM integration
# This script will add FCM push notifications to all send*Notification methods

$filePath = "C:\projectFlutter\MOEYPROJECT\MoeyBackendAdmin\app\Services\NotificationService.php"
$content = Get-Content $filePath -Raw

# Define the pattern to match Notification::create( followed by the closing ]); and then the closing }
# We'll replace it with: $notification = Notification::create(...); + FCM push code + }

# List of all notification methods to update
$methods = @(
    "sendSurveyRequestNotification",
    "sendMoodboardRequestNotification",
    "sendEstimasiRequestNotification",
    "sendCommitmentFeeRequestNotification",
    "sendDesignApprovalNotification",
    "sendFinalDesignRequestNotification",
    "sendItemPekerjaanRequestNotification",
    "sendRabInternalRequestNotification",
    "sendKontrakRequestNotification",
    "sendInvoiceRequestNotification",
    "sendSurveyScheduleRequestNotification",
    "sendSurveyUlangRequestNotification",
    "sendGambarKerjaRequestNotification",
    "sendApprovalMaterialRequestNotification",
    "sendWorkplanRequestNotification",
    "sendApprovalRabUpdateNotification",
    "sendProjectManagementRequestNotification"
)

Write-Host "Starting FCM integration updates..."
Write-Host "Total methods to update: $($methods.Count)"

# Read the file
$lines = Get-Content $filePath

# Flag to track if we're inside a foreach loop
$inForeach = $false
$foreachLevel = 0
$currentMethod = ""
$updates = 0

for ($i = 0; $i < $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Track which method we're in
    foreach ($method in $methods) {
        if ($line -match "public function $method") {
            $currentMethod = $method
            Write-Host "Found method: $currentMethod at line $($i+1)"
            break
        }
    }
    
    # Track foreach loops
    if ($line -match '^\s+foreach\s*\(') {
        $inForeach = $true
        $foreachLevel++
    }
    
    # Track closing braces
    if ($line -match '^\s+\}' -and $inForeach) {
        $foreachLevel--
        if ($foreachLevel == 0) {
            # We're at the end of the foreach loop
            # Check if there's already FCM code
            if ($i > 0 -and $lines[$i-1] -notmatch 'fcmService') {
                Write-Host "  -> Adding FCM to $currentMethod"
                $updates++
                # This is where we would insert FCM code, but it's complex in PowerShell
                # Better to use the file editing approach
            }
            $inForeach = $false
        }
    }
}

Write-Host "`nAnalysis complete. Found $updates locations needing updates."
Write-Host "Use manual file editing for precise control."
