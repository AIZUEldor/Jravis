# Arxitektura

Jravis foydalanuvchi niyatini bitta `Command` modeliga aylantiradi. Web yoki mobil klient buyruqni API’ga yuboradi; orkestrator niyatni aniqlaydi, kelajakdagi adapter esa kerakli tashqi servisda amal bajaradi.

```text
Voice/Text → Client → Command API → Intent Router → Integration Adapter
                                      ↓
                              Memory / Audit Log
```

## Xavfsizlik chegaralari

- Tashqi amallar uchun foydalanuvchi roziligi va OAuth talab qilinadi.
- Pul o‘tkazish, o‘chirish va xabar yuborish kabi xavfli amallar tasdiqlanadi.
- Har bir avtomatlashtirish audit jurnaliga yoziladi.
- API kalitlari faqat server muhitida saqlanadi.

