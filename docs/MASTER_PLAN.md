# Jravis professional development master plan

> Bu hujjat loyiha qarorlari va bajarish tartibining yagona manbasi. Arxitektura o‘zgarsa, avval shu hujjat va `ARCHITECTURE.md` yangilanadi.

## Mahsulot ta’rifi

Jravis — ovoz va matndan foydalanuvchi niyatini tushunib, mobil/desktop imkoniyatlari hamda tashqi MCP integratsiyalarini xavfsiz boshqaradigan personal automation platformasi.

## North-star

Foydalanuvchi kundalik raqamli ishini tabiiy tilda topshiradi; Jravis nima bajarilishini oldindan ko‘rsatadi, eng kam ruxsat bilan bajaradi va natijani isbotlaydi.

## MVP chegarasi

MVP:

1. O‘zbekcha/ruscha/inglizcha matn va push-to-talk buyruq.
2. Task, reminder, note, media workflow va message intentlari.
3. Tanlangan galereya fayllaridan oddiy video yaratish.
4. Telegram uchun draft/preview va tasdiqlangan yuborish.
5. Instagram uchun draft va rasmiy API mavjud accountlarda tasdiqlangan publish.
6. Android alarm adapter; iOS’da App Intent/Shortcut asosidagi flow.
7. MCP registry, capability allowlist va OAuth.
8. Consent center, execution preview, audit history va revoke.

MVP bajarmaydi: pul/xarid, credential yoki security setting o‘zgarishi, barcha ilovalarni Accessibility orqali boshqarish, yashirin tinglash, tasdiqsiz post/xabar.

## Ish bosqichlari

### Phase 0 — Product va threat model

- [ ] Personas va 10 ta asosiy user journey.
- [ ] Android/iOS capability matrix’ni real spike bilan isbotlash.
- [ ] STRIDE threat model va data-flow diagram.
- [ ] Privacy/retention policy va consent matnlari.
- [ ] Instagram/Telegram account va API shartlarini tasdiqlash.

**Exit:** har bir MVP use case uchun platforma yo‘li, risk va fallback hujjatlangan.

### Phase 1 — Secure core

- [ ] Passkey/OIDC auth, device registration va session revoke.
- [ ] PostgreSQL: commands, plans, grants, executions, audit.
- [ ] Versionlangan intent schema va deterministic policy engine.
- [ ] Preview/diff/approve/deny UI.
- [ ] Encrypted Secret Broker; klient va LLM tokenni ko‘rmaydi.
- [ ] Trace ID, structured logging va PII redaction.

**Exit:** fake adapter bilan command → plan → approval → execution → audit E2E ishlaydi.

### Phase 2 — MCP platform

- [ ] MCP client/gateway va server registry.
- [ ] OAuth 2.1 + PKCE, resource indicators va token rotation.
- [ ] Tool manifest pinning, schema validation va trust tiers.
- [ ] Sandboxed worker, egress allowlist, timeout/rate limit.
- [ ] Prompt-injection test suite va malicious MCP fixtures.
- [ ] Health check, circuit breaker va provider fallback.

**Exit:** faqat tasdiqlangan capability/scope bilan remote tool bajariladi.

### Phase 3 — Mobile device bridge

- [ ] Expo development build; Expo Go’dan native build’ga o‘tish.
- [ ] Microphone + STT adapter va recording indicator.
- [ ] Android Photo Picker / iOS Photos Picker.
- [ ] Media processing background worker.
- [ ] Android Alarm/Clock intent; iOS App Intent/Shortcut.
- [ ] Deep link, share sheet va app-specific rasmiy integratsiyalar.
- [ ] Keychain/Keystore, biometric approval va device attestation.

**Exit:** real Android/iPhone’da media va alarm scenariylari denial holatlari bilan testdan o‘tadi.

### Phase 4 — Telegram va Instagram

- [ ] Telegram rasmiy auth/API yoki ishonchli MCP adapter.
- [ ] Recipient resolver va majburiy disambiguation.
- [ ] Instagram Publishing API eligibility va OAuth scope.
- [ ] Draft, caption, media preview va explicit publish confirmation.
- [ ] Rate limit, retry, idempotency va duplicate-post himoyasi.

**Exit:** noto‘g‘ri target/accountga yuborishni bloklovchi integration testlar o‘tadi.

### Phase 5 — Second brain

- [ ] User boshqaradigan memory capture.
- [ ] Encrypted semantic search va source provenance.
- [ ] Memory inspect/edit/delete/export.
- [ ] Context poisoning va cross-user leakage testlari.
- [ ] Tavsiya/workflow builder; default auto-execute yo‘q.

**Exit:** har bir eslangan fakt manbasi ko‘rsatiladi va o‘chiriladi.

### Phase 6 — Production hardening

- [ ] SAST, dependency scanning, secret scanning va SBOM.
- [ ] Penetration test va mobile security review.
- [ ] Backup/restore, disaster recovery va incident response.
- [ ] Store privacy labels va permission declarations.
- [ ] Closed beta va safety metrics.
- [ ] External security audit oldidan release freeze.

**Exit:** release checklist, rollback va incident runbook sinovdan o‘tgan.

## Maqsadli repository

```text
apps/
  api/          API va orchestration facade
  web/          Consent, history, integrations
  mobile/       Expo UI va native bridge
  worker/       Sandboxed execution worker
  desktop/      Tauri client (keyingi bosqich)
packages/
  contracts/    Versionlangan schemas
  policy-engine/
  mcp-gateway/
  device-bridge/
  audit/
  testing/
docs/
  ARCHITECTURE.md
  MASTER_PLAN.md
  SECURITY.md
  ADR/
```

## Engineering qoidalari

- Schema-first; barcha boundary’da runtime validation.
- Policy Engine pure va testable; LLM undan chetlab o‘ta olmaydi.
- Har tashqi write uchun idempotency key.
- Provider-specific kod faqat adapter ichida.
- Har yangi capability uchun threat review, permission map va audit event.
- Protected `main`, required CI, review va signed release.
- Unit + contract + integration + E2E + adversarial safety testlar.
- “Ishladi” — tashqi natija verify qilinganini anglatadi.

## Texnik qarorlar

- Backend: TypeScript, Fastify, PostgreSQL va job queue.
- Mobile: Expo/React Native development build.
- Web: Next.js.
- Desktop: Tauri, mobile oqimi barqarorlashgach.
- MCP: remote’da OAuth, lokalda OS-secured secrets.
- Media: imkon qadar lokal; cloud bo‘lsa explicit disclosure.
- AI provider adapter orqali almashinadi; raw credential modelga berilmaydi.

## Definition of Done

1. Happy path va permission-denied path ishlaydi.
2. Risk va approval policy belgilangan.
3. Audit yoziladi, sensitive qiymatlar maskalanadi.
4. Unit/contract/E2E testlar mavjud.
5. Android/iOS farqi hujjatlangan.
6. Revoke, cleanup va retention aniqlangan.
7. Cheklangan API’lar policy review’dan o‘tgan.

## Birinchi sprint

1. `Command`, `Plan`, `PlanStep`, `Capability`, `Grant`, `Execution` schemas.
2. Pure `policy-engine` va risk-matrix testlari.
3. Fake MCP server va local gateway proof-of-concept.
4. Web execution preview/approve ekrani.
5. Mobile push-to-talk va Photo Picker spike.
6. Telegram `send_message` fake adapter bilan E2E.
7. Threat model va 20 ta abuse-case test.

