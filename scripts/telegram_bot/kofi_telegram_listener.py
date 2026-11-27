#!/usr/bin/env python3
"""
SoloForge Labs — Local Ko-fi Webhook Listener for Telegram Notifications
========================================================================
Lightweight standalone HTTP server that receives Ko-fi donation webhooks
and forwards them to Telegram Bot API.

Usage:
    export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
    export TELEGRAM_CHAT_ID="987654321"
    export KOFI_VERIFICATION_TOKEN="optional_token"

    python kofi_telegram_listener.py --port 8080
"""

import argparse
import html
import json
import os
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
VERIFICATION_TOKEN = os.environ.get("KOFI_VERIFICATION_TOKEN", "")


def send_telegram_message(text: str):
    """Send formatted HTML message to Telegram."""
    if not BOT_TOKEN or not CHAT_ID:
        print("⚠️ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables.")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode("utf-8"))
            return res.get("ok", False)
    except Exception as e:
        print(f"❌ Failed to send Telegram message: {e}")
        return False


class KofiWebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")

        payload = None
        content_type = self.headers.get("Content-Type", "")

        try:
            if "application/x-www-form-urlencoded" in content_type:
                parsed = urllib.parse.parse_qs(post_data)
                raw_json = parsed.get("data", [""])[0]
                if raw_json:
                    payload = json.loads(raw_json)
            elif "application/json" in content_type:
                payload = json.loads(post_data)

            if not payload:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid or missing payload")
                return

            # Verification token check
            token = payload.get("verification_token")
            if VERIFICATION_TOKEN and token and token != VERIFICATION_TOKEN:
                print(f"⛔ Unauthorized token received: {token}")
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return

            from_name = html.escape(payload.get("from_name") or "Anonymous")
            amount = payload.get("amount", "0.00")
            currency = payload.get("currency", "USD")
            msg_text = payload.get("message")
            formatted_msg = f'\n💬 <i>"{html.escape(msg_text)}"</i>' if msg_text else ""
            is_sub = " (Monthly Subscription)" if payload.get("is_subscription_payment") else ""
            url = payload.get("url", "https://ko-fi.com")
            timestamp = payload.get("timestamp", "")

            tg_text = (
                f"☕ <b>SoloForge Labs: Новая поддержка на Ko-fi!</b>\n"
                f"━━━━━━━━━━━━━━━━━━━━\n"
                f"💰 <b>Сумма:</b> {amount} {currency}{is_sub}\n"
                f"👤 <b>От:</b> <code>{from_name}</code>{formatted_msg}\n"
                f"📅 <b>Время:</b> {timestamp}\n\n"
                f'<a href="{url}">Открыть детали транзакции на Ko-fi →</a>'
            )

            print(f"🎉 Received Ko-fi donation: {amount} {currency} from {from_name}")
            ok = send_telegram_message(tg_text)
            if ok:
                print("✅ Telegram notification dispatched successfully.")

            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")

        except Exception as e:
            print(f"❌ Webhook handling error: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode("utf-8"))

    def do_GET(self):
        """Health check endpoint."""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"SoloForge Labs Ko-fi Webhook Listener is Active.")


def main():
    parser = argparse.ArgumentParser(description="Ko-fi Webhook to Telegram Listener")
    parser.add_argument("--port", type=int, default=8080, help="Port to listen on (default 8080)")
    args = parser.parse_args()

    server = HTTPServer(("0.0.0.0", args.port), KofiWebhookHandler)
    print(f"🚀 Ko-fi Webhook Listener running on http://0.0.0.0:{args.port}")
    print(f"👉 Ensure BOT_TOKEN and CHAT_ID are set.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")


if __name__ == "__main__":
    main()
