# Jravis

Jravis — “ikkinchi miya” tamoyiliga asoslangan, ovozli yoki yozma buyruqlar orqali kundalik jarayonlarni avtomatlashtirishga mo‘ljallangan web va mobil platforma.

## MVP imkoniyatlari

- Ovoz yoki matndan yagona buyruq yaratish
- Buyruq niyatini aniqlash: vazifa, eslatma, qayd yoki avtomatlashtirish
- Web va mobil klientlarda bir xil API kontrakti
- Keyinchalik AI, kalendar, email, CRM va smart-home integratsiyalariga tayyor arxitektura

## Tuzilma

```text
apps/api       Fastify REST API va buyruq orkestratori
apps/web       Next.js web ilova
apps/mobile    Expo / React Native mobil ilova
packages/contracts  Umumiy TypeScript turlari va validatsiya
docs           Arxitektura va rivojlanish rejasi
```

## Ishga tushirish

1. Node.js 22+ o‘rnating.
2. `.env.example` faylidan `.env` yarating.
3. `npm install` buyrug‘ini bajaring.
4. Web + API uchun `npm run dev:web`, barcha ilovalar uchun `npm run dev`.

Web: http://localhost:3000 · API: http://localhost:4000 · Health: http://localhost:4000/health

## Muhim eslatma

Hozirgi orkestrator MVP uchun qoida asosida ishlaydi. Haqiqiy AI va tashqi servis amallari `apps/api/src/services` qatlamiga adapter sifatida ulanadi. Maxfiy kalitlarni Git’ga yubormang.

## Professional reja

- [Master development plan](docs/MASTER_PLAN.md)
- [Target arxitektura](docs/ARCHITECTURE.md)
- [Security baseline](docs/SECURITY.md)
