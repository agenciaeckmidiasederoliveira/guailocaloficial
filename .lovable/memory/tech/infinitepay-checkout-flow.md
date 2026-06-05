---
name: InfinitePay Checkout Flow
description: Pagamento Premium R$ 19,90 vitalício via checkout integrado InfinitePay (handle ederoliveiradigital). Asaas mantido como legado.
type: feature
---
**Provedor padrão**: InfinitePay (handle: `ederoliveiradigital`).
**Preço**: R$ 19,90 vitalício (1990 centavos).
**Edge functions**:
- `criar-checkout-infinitepay` (com JWT): cria registro `pagamentos` pendente, gera link via `POST https://api.infinitepay.io/invoices/public/checkout/links` usando `pagamentos.id` como `order_nsu`.
- `webhook-infinitepay` (público, `verify_jwt = false`): recebe confirmação, marca pagamento como `confirmado` e promove `empresas.plano = 'premium'`.

**Webhook URL p/ painel InfinitePay**: `https://cogcidjnhnjlgvmbbgab.supabase.co/functions/v1/webhook-infinitepay`

**Asaas (legado)**: `criar-checkout-asaas` e `webhook-asaas` permanecem ativos no projeto, mas não são mais o fluxo padrão. Podem ser reativados a qualquer momento.

**Constants**: `PREMIUM_PRICE`, `PREMIUM_PRICE_CENTS`, `INFINITEPAY_HANDLE` em `src/lib/constants.ts`.
