{{ $notification->title }}

{{ $notification->message }}

@if($notification->action_url)
View Details: {{ url($notification->action_url) }}
@endif

---
This is an automated notification from VOMS (Vehicle Operations Management System).
If you have any questions, please contact your system administrator.


