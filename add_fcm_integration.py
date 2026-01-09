import re

# Read the file
with open(r'C:\projectFlutter\MOEYPROJECT\MoeyBackendAdmin\app\Services\NotificationService.php', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match foreach loops with Notification::create
# We'll look for: foreach (...) { Notification::create([ ... ]); }
# And replace with: foreach (...) { $notification = Notification::create([ ... ]); // FCM code }

def add_fcm_to_method(content, var_name='$user'):
    """
    Add FCM push notification after Notification::create() calls.
    This handles various variable names like $surveyor, $designer, $estimator, etc.
    """
    
    # Pattern explanation:
    # - foreach \((.*?) as (\$\w+)\) - Captures the foreach statement and variable name
    # - Notification::create\(\[  - Matches the start of Notification::create([
    # - (.*?)            - Captures all content inside create (non-greedy)
    # - \]\);            - Matches the closing ]);
    # - (\s+\})          - Captures the closing brace with whitespace
    
    pattern = r'(foreach \((.*?) as (\$\w+)\)\s*\{\s*)(Notification::create\(\[(.*?)\]\);)'
    
    def replacer(match):
        foreach_part = match.group(1)  # foreach (...) as $var) {
        var_name = match.group(3)       # $surveyor, $designer, etc.
        notification_create = match.group(4)  # Notification::create([...]);
        notification_content = match.group(5)  # Content inside create([...])
        
        # Replace Notification::create with $notification = Notification::create
        new_create = notification_create.replace('Notification::create', '$notification = Notification::create')
        
        # Extract user_id value to get the correct variable reference
        user_id_match = re.search(r"'user_id'\s*=>\s*(\$\w+)->id", notification_content)
        if user_id_match:
            user_var = user_id_match.group(1)
        else:
            user_var = var_name
        
        # Build FCM push code
        fcm_code = f'''

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser({user_var}->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);'''
        
        return foreach_part + new_create + fcm_code
    
    # Apply the replacement
    modified_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    return modified_content

# Apply transformation
updated_content = add_fcm_to_method(content)

# Write back
with open(r'C:\projectFlutter\MOEYPROJECT\MoeyBackendAdmin\app\Services\NotificationService.php', 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("FCM integration added successfully!")
print(f"File updated: {len(updated_content)} characters")
