<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - SarangTV</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0b0b12;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #E2E8F0;
        }
        .container {
            max-width: 520px;
            margin: 40px auto;
            background: #141322;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
            padding: 36px 32px 24px;
            text-align: center;
            background: linear-gradient(180deg, rgba(236, 72, 153, 0.12) 0%, transparent 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .brand {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 2px;
            color: #FFFFFF;
            margin: 0;
        }
        .brand span {
            color: #EC4899;
        }
        .content {
            padding: 32px;
            text-align: center;
        }
        h2 {
            font-size: 20px;
            font-weight: 700;
            color: #FFFFFF;
            margin-top: 0;
            margin-bottom: 12px;
        }
        p {
            font-size: 14px;
            line-height: 1.6;
            color: #94A3B8;
            margin: 0 0 24px;
        }
        .otp-container {
            margin: 28px 0;
            padding: 20px;
            background: #1E1D33;
            border-radius: 12px;
            border: 1px dashed rgba(236, 72, 153, 0.4);
            display: inline-block;
        }
        .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #EC4899;
            margin: 0;
        }
        .badge {
            display: inline-block;
            margin-top: 8px;
            font-size: 12px;
            color: #94A3B8;
        }
        .footer {
            padding: 20px 32px;
            background-color: #0E0D1B;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 12px;
            color: #64748B;
            text-align: center;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="brand">SARANG<span>TV</span></h1>
        </div>
        <div class="content">
            <h2>Verify Your Email</h2>
            <p>Hi {{ $userName }},<br>Thank you for creating an account with SarangTV. Use the verification code below to complete your registration:</p>
            
            <div class="otp-container">
                <div class="otp-code">{{ $otp }}</div>
                <div class="badge">Valid for 10 minutes</div>
            </div>

            <p>If you didn't create a SarangTV account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} SarangTV. All rights reserved.<br>
            This is an automated security email, please do not reply.
        </div>
    </div>
</body>
</html>
