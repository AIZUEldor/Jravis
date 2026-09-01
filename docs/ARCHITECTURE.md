# Jravis arxitekturasi

> Holat: qabul qilingan bazaviy arxitektura — 2026-09-01

Jravis — qurilmada ishlaydigan ishonchli boshqaruvchi va tashqi MCP serverlar orqali imkoniyat oladigan “ikkinchi miya”. Ilova topshiriqni tushunadi, xavfsiz reja tuzadi, ruxsatlarni tekshiradi, zarur tasdiqni oladi va faqat ruxsat etilgan adapter orqali bajaradi.

## Asosiy qoida

Jravis **cheksiz qurilma egasi** bo‘lmaydi. U faqat operatsion tizim, foydalanuvchi va tashqi servis bergan aniq vakolat doirasida ishlaydi. “Hamma narsaga ruxsat” o‘rniga ruxsat kerak bo‘lgan paytda, kerakli eng kichik doirada so‘raladi.

## Yuqori darajadagi oqim

```text
Voice / Text → Input Gateway → Intent + Context → Planner
                                                   │
                                      Policy Engine + Confirmation
                                                   │
                                         Capability Router
                         ┌─────────────────┬────────┴─────────┐
                    Device adapters  Service adapters   MCP Gateway
                         └─────────────────┴────────┬─────────┘
                                            Execution Engine
                                                   │
                                      Verify → Audit → Undo
```

## Asosiy komponentlar

### Client shell

- **Mobile:** Expo/React Native UI; native development build orqali mikrofon, media picker, alarm va secure storage.
- **Desktop:** keyingi bosqichda Tauri Windows/macOS klient; faqat tanlangan fayl/papka scope’i.
- **Web:** integratsiyalar, ruxsatlar, workflow va audit paneli. Brauzer qurilmani to‘liq boshqarmaydi.

### Input Gateway

- Matn va push-to-talk ovozni qabul qiladi; yashirin doimiy tinglash yo‘q.
- Ovoz yozilayotganini doim ko‘rsatadi.
- Speech-to-text lokal yoki alohida provider adapterida.
- Xom audioni saqlash standart holatda o‘chiq.

### Intent, Planner va Policy Engine

- Buyruq strukturali `Intent` va bajariladigan `PlanStep`larga aylanadi.
- LLM natijasi faqat ishonchsiz taklif; u tool’ni bevosita bajara olmaydi.
- Planner faqat allowlist’dagi capability’lardan foydalanadi.
- Policy Engine `DENY`, `ASK_ONCE`, `ASK_EVERY_TIME`, `ALLOW_SESSION` yoki `ALLOW_RULE` qarorini beradi.
- Qaror qurilma ruxsati, OAuth scope, tool ishonchi, ma’lumot sezgirligi va qaytarilish imkoniga bog‘liq.

### Capability Router

Provider nomiga emas, versionlangan imkoniyat kontraktiga bog‘lanadi:

```text
media.search             media.read_selected
media.video.generate     social.instagram.publish
clock.alarm.create       messaging.telegram.send
files.read_selected      calendar.event.create
```

Har capability JSON Schema, kerakli ruxsat, risk, tasdiq turi va `dry-run` imkonini e’lon qiladi.

### MCP Gateway

- Faqat registry’dagi tasdiqlangan MCP serverlar ulanadi.
- Remote MCP uchun OAuth 2.1 + PKCE, HTTPS va resource-bound tokenlar.
- Token passthrough taqiqlanadi; har server uchun alohida audience.
- Tool tavsifi ishonchsiz; lokal manifest va policy bilan solishtiriladi.
- Tashqi fayl/web kontenti buyruq emas, data sifatida belgilanadi.
- Schema validation, timeout, rate limit, circuit breaker va payload limit majburiy.
- MCP server qurilma tokenlarini ko‘rmaydi; minimal data broker orqali beriladi.

### Execution Engine va Memory

- Qadamlar idempotency key bilan, avval preview/dry-run, keyin commit tartibida bajariladi.
- Qisman xatoda rollback yoki kompensatsiya; natija post/message/alarm ID bilan verify qilinadi.
- Working memory, user-approved personal memory va execution history alohida saqlanadi.
- Semantik xotira shifrlanadi; user uni ko‘rishi, tahrirlashi, eksport va o‘chirishi mumkin.

### Artifact Broker

- Video, rasm, audio va document yaratish Jravis core ichida bajarilmaydi.
- User tanlagan input assetlar consent’dan so‘ng remote MCP providerga vaqtinchalik signed URL yoki stream orqali beriladi.
- Provider tayyor natijani `Artifact` manifesti sifatida qaytaradi: `id`, `kind`, `mimeType`, `uri`, `expiresAt`.
- Jravis natijani malware/type/size tekshiruvidan o‘tkazadi, preview qiladi va keyingi MCP qadamiga reference sifatida beradi.
- Provider input va output retention muddatini e’lon qilishi shart; muddat tugaganda artifact revoke/tozalanadi.

## Platforma chegaralari

| Imkoniyat | Android | iOS | Jravis yo‘li |
|---|---|---|---|
| Galereya | Photo Picker yoki aniq media permission | Photos Picker / limited library | Tanlangan element yoki minimal scope |
| Budilnik | Alarm/Clock Intent yoki alarm API | App Intents/Shortcuts doirasida | Platform adapter va ko‘rinadigan natija |
| Telegram | Rasmiy API/MCP yoki share intent | Rasmiy API/MCP yoki share sheet | Preview va tasdiq |
| Instagram | Rasmiy publishing API/MCP yoki share flow | Rasmiy API/MCP yoki share sheet | Login/parol va UI scraping yo‘q |
| Boshqa ilova | Intent/deep link/API; Accessibility juda cheklangan | URL scheme, App Intents, Shortcuts | Rasmiy integratsiya bo‘lmasa qo‘lda davom |
| Fayllar | System picker / tanlangan papka | Document picker / sandbox | Butun disk emas, user-selected scope |
| Sozlamalar | Faqat ruxsat etilgan Settings intent | Apple ruxsat bergan deep link | Yashirin o‘zgartirish yo‘q |
| Ilovalar ro‘yxati | Package visibility cheklangan | Umumiy ro‘yxat berilmaydi | Faqat integratsiya qilingan ilova |

Android Accessibility API umumiy avtonom AI boshqaruvi uchun ishlatilmaydi. Google Play deterministik, foydalanuvchi tushunadigan tor avtomatlashtirishni ajratadi va umumiy assistantni accessibility tool deb hisoblamaydi.

## Xavf darajalari

| Daraja | Misol | Talab |
|---|---|---|
| L0 read-only | tanlangan rasm metadata’si | scope + audit |
| L1 local reversible | draft yoki fayl nusxasi | preview + undo |
| L2 external reversible | event yoki draft post | aniq tasdiq/rule |
| L3 communication | Telegram send, Instagram publish | har safar target/content preview |
| L4 destructive/sensitive | delete yoki security setting | biometrika; ko‘pincha avtomatlashtirilmaydi |
| L5 financial/irreversible | pul, purchase, credential | MVP’da taqiqlangan |

## Namunaviy bajarilish

“Bugungi rasmlardan video qil va Instagram’ga joyla”:

1. `media.search(date=today)`; scope yetishmasa system picker.
2. Tanlangan rasmlar preview’si.
3. `media.video.generate` tashqi AI video MCP’da vaqtinchalik artifact yaratadi; Jravis video yasamaydi.
4. Video, caption va account preview qilinadi.
5. Foydalanuvchi aynan shu publish’ni tasdiqlaydi.
6. `social.instagram.publish` rasmiy API orqali bajariladi.
7. Post ID auditga yoziladi; vaqtinchalik asset retention bo‘yicha tozalanadi.

“Telegram’da @user ga shu ma’lumotni yubor”:

1. Username aniq entity’ga resolve qilinadi.
2. Adresat va matn preview qilinadi.
3. Foydalanuvchi tasdiqlaydi.
4. Telegram adapter/MCP minimal vakolat bilan yuboradi.
5. Message ID auditga yoziladi.

## Ma’lumotlar va deployment

Entity’lar: `User`, `Device`, `Command`, `Intent`, `Plan`, `PlanStep`, `Capability`, `McpServer`, `Grant`, `ConsentReceipt`, `Execution`, `Artifact`, `AuditEvent`, `Workflow`.

```text
Mobile/Desktop/Web ─TLS→ API + Auth → Orchestrator → Policy → Queue
                                      │                    │
                               PostgreSQL/pgvector    Worker Sandbox
                                                           │
                                                   MCP/Adapter Gateway
```

Mobil secretlar Keychain/Keystore’da, server secretlari KMS/Vault’da. Tenant isolation, PII redaction va pinned MCP tool version majburiy.

## Mutlaq taqiqlar

- Parol, SMS kodi yoki session tokenni LLM/MCP’ga berish.
- Yashirin mikrofon, kamera yoki ekran kuzatuvi.
- Noaniq buyruqdan xabar/post yuborish yoki data o‘chirish.
- UI scraping’ni asosiy integratsiya qilish.
- Accessibility orqali avtonom rejalash va umumiy qurilma boshqaruvi.
- Ishonchsiz MCP’ga butun galereya, fayl tizimi yoki kontaktlarni ochish.
