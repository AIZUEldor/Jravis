# Backend development guide

## Hozir mavjud qatlamlar

- `packages/contracts` — Zod schemas va umumiy domain turlari.
- `packages/brain-core` — intent routing, confidence, entity extraction va clarification.
- `packages/policy-engine` — LLM’dan mustaqil deterministic risk qarorlari.
- `packages/mcp-gateway` — trusted provider registry va capability router.
- `apps/api/src/domain` — intent aniqlash va execution plan yaratish.
- `apps/api/src/services` — orchestration, development store va audit.
- `apps/api/src/app.ts` — HTTP boundary va validation.

`MemoryStore` faqat birinchi development skeleti uchun. Keyingi backend sprintida PostgreSQL repository va queue worker bilan almashtiriladi.

## Lokal ishga tushirish

```powershell
Copy-Item .env.example .env
npm install
npm run dev:api
```

API `http://localhost:4000` da ishlaydi.

## Docker

```powershell
docker compose up --build
```

## API oqimini tekshirish

Buyruq va tasdiqlash orasidagi ajratish xavfsizlik uchun ataylab qilingan.

```powershell
$command = Invoke-RestMethod -Method Post -Uri http://localhost:4000/v1/commands `
  -ContentType 'application/json' `
  -Body '{"text":"Ertaga soat 5:00 ga budilnik qo‘y","source":"text"}'

$planId = $command.plan.id
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/v1/plans/$planId/decision" `
  -ContentType 'application/json' `
  -Body '{"approved":true}'
```

## Endpointlar

| Method | Path | Maqsad |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/ready` | Provider readiness |
| POST | `/v1/auth/register` | Development hisob yaratish |
| POST | `/v1/auth/login` | Opaque session olish |
| GET | `/v1/auth/me` | Joriy user |
| POST | `/v1/auth/logout` | Session revoke |
| POST | `/v1/commands` | Buyruqni validation va plan qilish |
| GET | `/v1/plans` | Development plan ro‘yxati |
| GET | `/v1/plans/:planId` | Plan preview |
| POST | `/v1/plans/:planId/decision` | Approve/deny va execution |
| GET | `/v1/audit-events` | Development audit tarixi |

## Keyingi implementatsiya tartibi

1. Repository interfeyslari va PostgreSQL migrations.
2. User/device auth va haqiqiy actor ID.
3. Queue worker hamda transactional outbox.
4. MCP SDK remote transport, OAuth broker va tool discovery.
5. OpenAPI schema va generated clients.
6. Audit hash-chain va retention.
