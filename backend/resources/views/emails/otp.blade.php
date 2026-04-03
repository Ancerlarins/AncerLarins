<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 32px 40px 24px; text-align: center; background-color: #1a1a2e;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">AncerLarins</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 16px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                            <p style="margin: 0; font-size: 40px; font-weight: 700; color: #1a1a2e; letter-spacing: 8px;">{{ $code }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 40px 40px; text-align: center;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                This code expires in <strong>10 minutes</strong>.<br>
                                If you did not request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 40px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; {{ date('Y') }} AncerLarins. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
