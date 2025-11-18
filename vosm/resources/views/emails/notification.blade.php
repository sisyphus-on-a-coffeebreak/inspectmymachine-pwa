<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }
        .message {
            margin: 20px 0;
            padding: 15px;
            background: #f9fafb;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }
        .action-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">{{ $notification->title }}</h1>
    </div>
    <div class="content">
        <div class="message">
            {!! nl2br(e($notification->message)) !!}
        </div>
        
        @if($notification->action_url)
        <a href="{{ url($notification->action_url) }}" class="action-button">
            View Details
        </a>
        @endif
    </div>
    <div class="footer">
        <p>This is an automated notification from VOMS (Vehicle Operations Management System).</p>
        <p>If you have any questions, please contact your system administrator.</p>
    </div>
</body>
</html>


