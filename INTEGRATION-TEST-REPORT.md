# SupportKit [Sprint 4.3] Integration Test Report
**Date:** 2026-03-02  
**Auditor:** Sage (ThreeStack)  
**Commit baseline:** fd32019  
**Fixes commit:** f63fce8

---

## Results Summary
| Category | PASS | PARTIAL | FAIL |
|---|---|---|---|
| A. Auth Flow | 3 | 0 | 0 |
| B. Workspace & Ticket | 3 | 1 | 0 |
| C. Email Inbound | 3 | 0 | 0 |
| D. AI Draft | 2 | 0 | 0 |
| E. Stripe Billing | 3 | 0 | 0 |
| F. Widget | 2 | 1 | 0 |
| G. UI Integration | 2 | 0 | 0 |
| **Total** | **18** | **2** | **0** |

**🟢 DEPLOYMENT READY** — All P0 blockers resolved in this audit.

---

## Detailed Results

### A. Auth Flow
1. **POST /api/auth/signup** → ✅ PASS  
   Zod-validated (name/email/password), bcrypt-hashed password (cost 12), atomic user + default workspace + free subscription creation. Conflicts return 409.

2. **Login + session** → ✅ PASS  
   NextAuth v5 credentials provider with JWT strategy. Session callbacks augment token/session with `userId`. `maxAge: 30 days`.

3. **/dashboard/* protected** → ✅ PASS  
   Middleware matches `/dashboard/:path*`, checks `req.auth`, redirects unauthenticated requests to `/login`. Correct matcher pattern.

### B. Workspace & Ticket Flow
4. **Create workspace** → 🟡 PARTIAL  
   No `POST /api/workspaces` endpoint. Workspace auto-created at signup only. Tier defines 1/3/unlimited workspace limits but UI/API for additional workspaces is not implemented. _P1 gap._

5. **Widget sends ticket** → ✅ PASS  
   `POST /api/widget/message` accepts `{widgetKey, email, name, subject, body}`, validates with Zod, finds-or-creates contact, creates ticket (source=widget) + first message. Full CORS headers present.

6. **Ticket appears in inbox** → ✅ PASS _(fixed in this audit)_  
   New `/dashboard/tickets` page added: server component queries tickets + contacts join from DB, filtered by status, ordered by `updatedAt desc`.

7. **Agent reply** → ✅ PASS  
   `POST /api/tickets/[id]/reply` verifies workspace ownership, creates agent message, optionally sends email reply via Resend. New `/dashboard/tickets/[id]` UI added with reply form and status controls.

### C. Email Inbound
8. **Email inbound endpoint present** → ✅ PASS  
   `POST /api/email/inbound` exists with full implementation.

9. **Handles Resend webhook format** → ✅ PASS  
   Processes `{from, to, subject, text, html, headers, messageId}`. Extracts email/name from RFC 5322 headers. Creates contact (find-or-create), routes to workspace, threads by messageId and subject fallback.

10. **Resend signature verification** → ✅ PASS  
    Full svix-based HMAC-SHA256 verification (Standard Webhooks spec). Checks `svix-id`, `svix-timestamp`, `svix-signature`. Replay prevention: rejects timestamps >5 minutes old. Uses `timingSafeEqual()`. Added in commit fd32019.

### D. AI Draft
11. **AI draft endpoint present** → ✅ PASS  
    `POST /api/ai/draft` exists.

12. **Accepts ticket context + returns draft** → ✅ PASS  
    Tier-gated to Pro plan (`canUseDraftAI`). Fetches last 5 messages, builds conversation transcript, calls `gpt-4o-mini`. Falls back to sensible mock draft if no `OPENAI_API_KEY`.

### E. Stripe Billing
13. **/api/stripe/checkout present** → ✅ PASS  
    Auth-gated. Validates tier (`indie`/`pro`). Creates Stripe checkout session with metadata `{userId, tier}`. Requires `STRIPE_INDIE_PRICE_ID` / `STRIPE_PRO_PRICE_ID` env vars.

14. **/api/stripe/webhook with sig verification** → ✅ PASS  
    `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`. Handles `checkout.session.completed` (upsert subscription), `customer.subscription.updated` (sync status), `customer.subscription.deleted` (downgrade to free).

15. **Plan limits enforced** → ✅ PASS _(fixed in this audit)_  
    New `canCreateTicket(workspaceId)` in `tier.ts`: counts tickets in current calendar month via SQL aggregate, checks against `getTierLimits().ticketsPerMonth` (free=50, indie/pro=∞). Applied to both `POST /api/tickets` and `POST /api/widget/message`.

### F. Widget
16. **Widget JS served** → 🟡 PARTIAL  
    `GET /api/cdn/widget.js` route exists with `Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=86400`. Tries to read `packages/widget/dist/widget.js`; falls back to stub if not built. **Widget dist is gitignored** — deployment must run `pnpm --filter @supportkit/widget build` before starting app. _P1 deployment note._

17. **Widget CORS headers** → ✅ PASS  
    `Access-Control-Allow-Origin: *` on `/api/cdn/widget.js`, `/api/widget/config`, `/api/widget/message`. OPTIONS preflight handlers implemented on all widget endpoints.

18. **Widget sends messages to backend** → ✅ PASS  
    `packages/widget/src/widget.ts` POSTs `{widgetKey, email, name, subject, body}` to `${apiBase}/api/widget/message` with JSON headers. Handles success/failure states with UI feedback.

### G. UI Integration
19. **Dashboard calls real API routes (no mocks)** → ✅ PASS  
    Dashboard is a Next.js 14 server component that queries Drizzle ORM directly — correct pattern, no fake/hardcoded data.

20. **Ticket inbox populated from DB** → ✅ PASS _(fixed in this audit)_  
    New `/dashboard/tickets` page: `innerJoin(contacts)` query with status filter. `/dashboard/tickets/[id]` loads full ticket + messages thread via `GET /api/tickets/[id]`.

---

## Bugs Fixed in This Audit

### BUG-001 (P0) — Email Inbound: Broken Slug Extraction
**File:** `apps/web/src/app/api/email/inbound/route.ts`  
**Before:** `toEmail.split("@")[0]?.replace(/^support\./, "")`  
For `support@jane-abc123.supportkit.io`, this returned `"support"` (no workspace found → 404 on every inbound email).  
**After:** Extract slug from hostname subdomain: `hostname.split(".")[0]`  
Correctly returns `"jane-abc123"`. Email inbound routing now works.

### BUG-002 (P0) — Ticket Limits Not Enforced
**File:** `apps/web/src/lib/tier.ts`, `apps/web/src/app/api/tickets/route.ts`, `apps/web/src/app/api/widget/message/route.ts`  
`getTierLimits()` defined limits but nothing checked them. Free plan users could create unlimited tickets.  
Added `canCreateTicket(workspaceId)` + enforcement in both ticket creation endpoints.

### BUG-003 (P0) — No Ticket Inbox UI
**Files:** `apps/web/src/app/(dashboard)/dashboard/tickets/page.tsx` (new), `apps/web/src/app/(dashboard)/dashboard/tickets/[id]/page.tsx` (new)  
Dashboard only showed ticket counts with no way to view/manage individual tickets.  
Added full ticket inbox with status filters, ticket detail view, reply form, and status controls.

---

## Remaining Issues (Not Fixed)

| Severity | Issue | Location |
|---|---|---|
| P1 | Widget dist not in repo — must run `pnpm --filter @supportkit/widget build` pre-deploy | `packages/widget/` |
| P1 | No `POST /api/workspaces` to create additional workspaces (tier limits unused) | missing route |
| P2 | No rate limiting on widget message / email inbound endpoints | `api/widget/message`, `api/email/inbound` |
| P2 | No workspace settings management (rename, change primary color, support email) | missing route |
| P2 | AI draft hard-coded to Pro only; `canUseDraftAI` should perhaps allow Indie tier | `lib/tier.ts` |

---

## Deployment Checklist
- [ ] Set all env vars from `.env.example`
- [ ] Run DB migrations: `pnpm --filter @supportkit/db db:push`
- [ ] **Build widget: `pnpm --filter @supportkit/widget build`** ← REQUIRED before deploy
- [ ] Configure Resend inbound domain: `support@{slug}.supportkit.io` → POST to `/api/email/inbound`
- [ ] Configure Stripe webhook → `/api/stripe/webhook` (events: checkout.session.completed, customer.subscription.*)
- [ ] Set `RESEND_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_INDIE_PRICE_ID`, `STRIPE_PRO_PRICE_ID`
