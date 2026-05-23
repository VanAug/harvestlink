
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

RESEND_SEND_URL = "https://api.resend.com/emails"


async def _send(to: str, subject: str, html: str) -> bool:
    """Send one email via Resend REST API. Returns True on success."""
    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY not set — email NOT sent to %s (subject: %s)", to, subject
        )
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                RESEND_SEND_URL,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
        if resp.is_success:
            logger.info("Email sent to %s via Resend (id=%s)", to, resp.json().get("id"))
            return True
        logger.error("Resend error %s: %s", resp.status_code, resp.text)
        return False
    except Exception as exc:
        logger.error("Email send failed: %s", exc)
        return False


def _base_template(title: str, body_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<style>
  body{{font-family:Arial,sans-serif;background:#f4f7f4;margin:0;padding:0}}
  .wrap{{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}}
  .header{{background:#1a5c38;padding:28px 32px}}
  .header h1{{color:#fff;margin:0;font-size:22px;font-weight:700}}
  .header p{{color:rgba(255,255,255,.75);margin:4px 0 0;font-size:13px}}
  .body{{padding:32px}}
  .body p{{color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px}}
  .btn{{display:inline-block;background:#1a5c38;color:#fff!important;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:15px;margin:8px 0 20px}}
  .note{{background:#f4f7f4;border-radius:10px;padding:14px 18px;font-size:13px;color:#6b7280;margin-top:8px}}
  .footer{{padding:20px 32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🌿 HarvestLink</h1>
    <p>Global Agricultural Marketplace</p>
  </div>
  <div class="body">
    {body_html}
  </div>
  <div class="footer">© 2026 HarvestLink. This email was sent because an action was taken on your account.</div>
</div>
</body>
</html>"""


async def send_email_verification(to_email: str, full_name: str, token: str) -> bool:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    body = f"""
<p>Hi <strong>{full_name}</strong>,</p>
<p>Thanks for joining HarvestLink! Please verify your email address to activate your account.</p>
<a class="btn" href="{verify_url}">Verify Email Address</a>
<div class="note">
  This link expires in <strong>24 hours</strong>.<br>
  If you didn't create a HarvestLink account, you can safely ignore this email.
</div>
<p style="margin-top:20px;font-size:13px;color:#6b7280">
  Or copy this link into your browser:<br>
  <a href="{verify_url}" style="color:#1a5c38;word-break:break-all">{verify_url}</a>
</p>"""
    return await _send(
        to=to_email,
        subject="Verify your HarvestLink email address",
        html=_base_template("Verify your email", body),
    )


async def send_password_reset(to_email: str, full_name: str, token: str) -> bool:
    reset_url = f"{settings.FRONTEND_URL}/password-reset?token={token}"
    body = f"""
<p>Hi <strong>{full_name}</strong>,</p>
<p>We received a request to reset your HarvestLink password. Click the button below to choose a new one.</p>
<a class="btn" href="{reset_url}">Reset Password</a>
<div class="note">
  This link expires in <strong>2 hours</strong>.<br>
  If you didn't request a password reset, please ignore this email — your password won't change.
</div>
<p style="margin-top:20px;font-size:13px;color:#6b7280">
  Or copy this link into your browser:<br>
  <a href="{reset_url}" style="color:#1a5c38;word-break:break-all">{reset_url}</a>
</p>"""
    return await _send(
        to=to_email,
        subject="Reset your HarvestLink password",
        html=_base_template("Password reset", body),
    )
