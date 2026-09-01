# Jravis security baseline

## Security invariants

1. LLM tool’ni bevosita bajarmaydi; Policy Engine majburiy.
2. Har bir capability deny-by-default.
3. Tashqi write actor, target, payload va approval bilan bog‘lanadi.
4. Credential faqat Secret Broker va adapter orasida ishlatiladi.
5. MCP server faqat o‘z resource audience’i uchun token oladi.
6. Tashqi kontent hech qachon system instruction bo‘lmaydi.
7. Audit append-only va tamper-evident bo‘ladi.

## Majburiy himoyalar

- OAuth 2.1 Authorization Code + PKCE
- TLS va certificate validation
- Keychain/Android Keystore/KMS
- Short-lived token va refresh-token rotation
- Input/output JSON Schema validation
- Tool allowlist va version pinning
- Timeout, rate limit va payload limit
- PII/token redaction
- L4 uchun biometric step-up confirmation
- Remote revoke va device-session list

## Abuse cases

- Rasm ichidagi prompt tool’ga buyruq bermoqchi.
- MCP tavsifi yangilanib, qo‘shimcha data talab qiladi.
- Bir xil ismli recipient noto‘g‘ri tanlanadi.
- Retry bir postni ikki marta chiqaradi.
- “Bugungi rasmlar” timezone/metadata sabab noto‘g‘ri tanlanadi.
- Background job approval muddati tugagach ishlamoqchi.
- MCP tokenni boshqa serverga uzatmoqchi.
- Root/jailbroken qurilmada secret o‘g‘irlanmoqchi.

Har holat security test plan’da bloklovchi testga aylantiriladi.

