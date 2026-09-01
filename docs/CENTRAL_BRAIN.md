# Central Brain v1

Central Brain foydalanuvchi matni yoki speech-to-text natijasini xavfsiz execution plan’ga yo‘naltiradi. U tool bajarmaydi; faqat intent, capability, entity va aniqlashtirish ehtiyojini chiqaradi.

## Pipeline

```text
Voice → Speech-to-text ┐
                      ├→ normalize → route → extract entities → clarify/plan
Text ─────────────────┘                                      │
                                                     Policy Engine
                                                            │
                                                   User confirmation
                                                            │
                                                     MCP execution
```

## BrainDecision

- `intent` — message, media, reminder, automation, note yoki task.
- `confidence` — router ishonchi, `0..1`.
- `capabilityNames` — versionlangan capability’lar.
- `entities` — vaqt, recipient va keyingi bosqichlarda media/account qiymatlari.
- `missingFields` — bajarish uchun yetishmayotgan majburiy qiymatlar.
- `clarificationQuestion` — userga beriladigan bitta aniq savol.

## Hozirgi route’lar

| Signal | Natija |
|---|---|
| Telegram/xabar va `@username` | `messaging.telegram.send` |
| Rasm/video + Instagram | `media.video.generate` (remote MCP) → `social.instagram.publish` (remote MCP) |
| Galereya/rasm/video | `media.video.generate` (remote MCP) |
| Budilnik/eslatma + `HH:mm` | `clock.alarm.create` |
| “har safar/agar” | `automation.create` |
| Qayd/saqla | `notes.create` |
| Vazifa/topshiriq | `tasks.create` |

Recipient, vaqt yoki intent yetishmasa plan `clarification_required` bo‘ladi va approve endpoint uni bajarmaydi.

## Keyingi evolyutsiya

1. Rule router doim birinchi qatlam bo‘lib qoladi.
2. Murakkab buyruqlar uchun structured-output LLM adapter qo‘shiladi.
3. LLM chiqishi Zod schema, allowlist va Policy Engine’dan o‘tadi.
4. Multi-turn clarification oldingi command bilan bog‘lanadi.
5. Ovoz qatlami faqat transcript va locale beradi; routing bir xil qoladi.

## Development cheklovlari

- `DATABASE_URL` bilan user, session, plan va audit PostgreSQL’da persistent; testsiz lokal rejimda memory fallback mavjud.
- Fake MCP faqat simulyatsiya qiladi; real servis amali yo‘q.
- Web tokeni `sessionStorage`da; production’da same-origin BFF + HttpOnly Secure cookie kerak.
- Routing deterministik v1; AI adapter hali ulanmagan.

## MCP-first execution

Central Brain faqat qaysi capability kerakligini tanlaydi. Video generatsiya Jravis processida bajarilmaydi. User tasdiqlagan media tashqi AI video MCP’ga yuboriladi; MCP `Artifact` (`video/mp4`, URI, expiry) qaytaradi. Jravis artifact metadata’sini saqlaydi, preview uchun klientga beradi va keyingi publish MCP qadamiga uzatadi.
