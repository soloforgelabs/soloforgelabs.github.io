# SoloForge Labs — Ko-fi Telegram Notifications Setup Guide

Этот модуль обеспечивает мгновенные оповещения в Telegram при поступлении донатов, покупок или подписок на вашей странице Ko-fi.

---

## Вариант 1: Бесплатный серверлесс Cloudflare Worker (Рекомендуется ⭐)
*Работает 24/7 в облаке, не требует включенного ПК, бесплатный тариф Cloudflare (до 100 000 запросов в день).*

### Шаг 1. Создание Telegram Бота
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте `/newbot`, укажите имя (например, `SoloForge Alerts`) и юзернейм (например, `soloforge_alerts_bot`).
3. Скопируйте полученный **HTTP API Token** (вида `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
4. Нажмите `/start` в созданном боте, чтобы разрешить ему присылать вам сообщения.
5. Узнайте свой личный **Chat ID**: откройте [@userinfobot](https://t.me/userinfobot), он пришлет ваш `Id` (например, `482910394`).

### Шаг 2. Развертывание воркера на Cloudflare
1. Зайдите на [dash.cloudflare.com](https://dash.cloudflare.com/) (бесплатная регистрация).
2. Перейдите в раздел **Workers & Pages** -> **Create application** -> **Create Worker**.
3. Введите название (например, `kofi-telegram-alerts`) и нажмите **Deploy**.
4. Нажмите **Edit code**, удалите шаблон и вставьте содержимое файла [`worker.js`](file:///d:/Antigravity/SoloForgeLabs/scripts/telegram_bot/worker.js).
5. Нажмите **Deploy**.
6. Перейдите в **Settings** воркера -> **Variables and Secrets** -> **Add**:
   - `TELEGRAM_BOT_TOKEN` : ваш токен от BotFather
   - `TELEGRAM_CHAT_ID`   : ваш Chat ID от userinfobot
   - `KOFI_TOKEN`         : (опционально) проверочный токен из настроек Ko-fi
7. Скопируйте публичный URL вашего воркера: `https://kofi-telegram-alerts.soloforgelabs.workers.dev` (если аккаунт использует поддомен `soloforgelabs.workers.dev`).

### Шаг 3. Подключение в Ko-fi
1. Откройте [Ko-fi Webhooks & API](https://ko-fi.com/manage/webhooks) (или Settings -> API & Webhooks).
2. В поле **Webhook URL** вставьте URL воркера: `https://kofi-telegram-alerts.soloforgelabs.workers.dev`.
3. Нажмите **Update** / **Save**.
4. Нажмите кнопку **Send Test** на странице Ko-fi — и через 1 секунду вам в Telegram прилетит тестовое уведомление! ☕🎉

---

## Вариант 2: Локальный запуск на Python (`kofi_telegram_listener.py`)
*Если вы хотите протестировать локально или запустить на своем сервере/VPS.*

```bash
# 1. Установите переменные окружения
export TELEGRAM_BOT_TOKEN="123456789:ABC..."
export TELEGRAM_CHAT_ID="482910394"

# 2. Запустите сервер
python scripts/telegram_bot/kofi_telegram_listener.py --port 8080

# 3. Для проброса локального порта наружу можно использовать ngrok:
# ngrok http 8080
# Полученный HTTPS адрес укажите в Ko-fi Webhook URL.
```

---

## Вариант 3: Лицензионный воркер `soloforgelabs-license` (Multi-Device Ed25519 Seat Ledger)

Замороженные `.exe`-сборки (`BlinkScribe`, `DeskScribe`, `VoxScribe`) в [`licensing.py`](file:///D:/Antigravity/ScribeSuite/ScribeCore/packages/soloforge-desktop/src/soloforge_desktop/licensing.py) обращаются к `https://soloforgelabs-license.soloforgelabs.workers.dev`.

### Текущая конфигурация Cloudflare (2026-11-23)
- **Поддомен аккаунта `workers.dev`:** `soloforgelabs.workers.dev` *(переименован с `1rusval.workers.dev`, поэтому `kofi-telegram-alerts` переехал на `https://kofi-telegram-alerts.soloforgelabs.workers.dev`)*
- **Воркер лицензирования:** `soloforgelabs-license` (`https://soloforgelabs-license.soloforgelabs.workers.dev`)
- **KV Namespace (`LICENSE_KV`):** `e946323a22304772a82c6ef8f63899fe` (записан в [`wrangler.toml`](file:///D:/Antigravity/SoloForgeLabs/scripts/telegram_bot/wrangler.toml))

### Деплой кода `worker.js` и загрузка секрета через Wrangler
```powershell
cd D:\Antigravity\SoloForgeLabs\scripts\telegram_bot
npx wrangler login
npx wrangler deploy

# Загрузка приватного Ed25519 seed из scripts/.master_license_key.json без вывода в консоль:
(Get-Content ..\.master_license_key.json | ConvertFrom-Json).seed_hex | npx wrangler secret put SFL_LICENSE_PRIVATE_SEED_HEX
```

### Необходимые секреты для `soloforgelabs-license`
- `SFL_LICENSE_PRIVATE_SEED_HEX` — обязателен для подписи `seat_cert` при `/api/license/activate` и `/api/license/replace`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `KOFI_TOKEN` — опциональны, если этот же воркер используется и для Ko-fi webhook.
