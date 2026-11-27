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
- `SFL_LICENSE_PRIVATE_SEED_HEX` — обязателен для подписи `seat_cert` при `/api/license/activate` и `/api/license/replace`, а также для выпуска ключей `SFL1-...` при апгрейдах доноров
- `PATREON_WEBHOOK_SECRET` — секрет из настроек Patreon Webhook для проверки `X-Patreon-Signature` (pure-JS HMAC-MD5) на `POST /api/webhooks/patreon`
- `ADMIN_API_TOKEN` — Bearer-токен для ручной/CLI записи донатов и возвратов через `POST /api/donations/record`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `KOFI_TOKEN` — для уведомлений в Telegram (Ko-fi webhook и алерты при выпуске/апгрейде ключа донору).

---

## Вариант 4: Кумулятивный леджер доноров, Patreon v2 Webhooks и автовыпуск ключей

Воркер ведёт кумулятивный баланс доноров в `LICENSE_KV` (`donor:<sha256_email>`) и автоматически выпускает/обновляет Ed25519-ключи `SFL1-...` при достижении порогов:

### Пороги в USD (кумулятивно по `email`)
| Порог | Tier Code | Тариф | `product_mask` | Лимит ПК |
| :--- | :--- | :--- | :--- | :--- |
| **>= $3.00** (`300` центов) | `4` | Bronze Supporter | `7` (все 3 орба) | `1` |
| **>= $5.00** (`500` центов) | `1` | Silver / Single Edition | `1` (или `apps`, маска Bronze `7` не наследуется) | `1` |
| **>= $13.00** (`1300` центов) | `2` | Gold / Duo Pack | наследуется от платного AI-тира (`1/2/3`) или `5` (`BlinkScribe \| VoxScribe`) | `2` |
| **>= $15.00** (`1500` центов) | `3` | Platinum / Scribe Trinity | `7` (все 3 приложения) | `5` |

> При возвратах или `members:pledge:delete`, если сумма падает ниже порога выданного тира, воркер выставляет `lic:<id>.revoked = true`, и `/api/license/activate` и `/api/license/replace` возвращают HTTP `403` (`error_code: "license_revoked"`).

### Новые эндпоинты
- **`POST /api/webhooks/patreon`** — принимает события Patreon v2 (`members:pledge:create`, `members:pledge:update`, `members:pledge:delete`), проверяет `X-Patreon-Signature` (pure-JS RFC 2104 HMAC-MD5 с `PATREON_WEBHOOK_SECRET`), учитывает дельту `currently_entitled_amount_cents` по `patreon_pledges[data.id]` без дублирования и отправляет уведомление в Telegram при апгрейде.
- **`POST /api/donations/record`** — защищённый заголовком `Authorization: Bearer <ADMIN_API_TOKEN>` эндпоинт для ручной записи донатов/покупок Patreon Shop/возвратов (`email`, `amount_cents` или `amount`, `tx_id`, `source`, `apps`).

### CLI-режим в `scripts/license_keygen.py`
```powershell
# Локальный JSON-леджер:
python scripts/license_keygen.py --record-donation --email donor@example.com --amount 5.00 --apps blinkscribe --ledger-file scripts/.donor_ledger.json --json

# Удалённая запись через Cloudflare Worker:
python scripts/license_keygen.py --record-donation --email donor@example.com --amount 10.00 --worker-url https://soloforgelabs-license.soloforgelabs.workers.dev --admin-token "<ADMIN_API_TOKEN>"
```
