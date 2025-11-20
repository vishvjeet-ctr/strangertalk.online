export const Verification_Email_Template =`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }

    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #ddd;
    }

    .header {
      background: #4f46e5;
      padding: 20px;
      color: #ffffff;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
    }

    .content {
      padding: 20px;
      text-align: center;
    }

    .code-box {
      display: inline-block;
      padding: 15px 25px;
      background: #f3f4f6;
      border: 2px dashed #c7c9d1;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 28px;
      letter-spacing: 4px;
      font-weight: bold;
      color: #111827;
    }

    .footer {
      text-align: center;
      padding: 15px;
      background: #fafafa;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1>Email Verification</h1>
    </div>

    <div class="content">
      <p>Use the verification code below to verify your email address.</p>

      <span class="verification-code">{verification}</span>

      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
