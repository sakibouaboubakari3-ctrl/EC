# EspaceCredit — Master Prompt (Claude Code)

> Copy everything below into Claude Code (e.g. as `CLAUDE.md` at the root of a new
> repo, or paste directly into the first message) to kick off the build.

---

## 1. Project overview

Build **EspaceCredit**, an online lending platform: a bilingual (French/English)
web application that lets a borrower submit a loan application online, upload
supporting documents, sign the contract electronically, and track their loan —
while giving the lending team a back-office to manage applications, scoring,
approvals, payments and collections, with automations handling reminders and
routine communication.

This is a **standard, reusable build** (not tied to one specific client) —
keep naming, copy and configuration generic/brandable so it can be
white-labeled later if needed.

Loan amounts range from **2 000 to 20 000** (currency-agnostic in code — keep
it a configurable constant, not hardcoded in multiple places).

---

## 2. Suggested tech stack

Use this unless you have a strong reason to deviate — flag it if so, don't
silently swap:

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (email/password + 2FA for admin accounts)
- **File storage:** S3-compatible bucket (KYC documents, signed contracts)
- **E-signature:** pluggable provider interface (e.g. stub now, wire to a real
  provider like DocuSign/SignRequest later)
- **Payments/collections:** pluggable provider interface — default stub,
  designed to slot in **Paymely or an equivalent** without rework
- **Notifications:** email via a transactional provider (e.g. Resend/SendGrid),
  SMS via a provider abstraction (e.g. Twilio-compatible)
- **i18n:** next-intl or next-i18next, FR default / EN secondary, every
  user-facing string translated from day one — don't hardcode French strings
  and "translate later"

If any of these conflict with constraints you discover in the repo/environment,
prefer consistency with what's already there and note the deviation.

---

## 3. Brand starting point

Use this as the default visual identity; treat it as easily reconfigurable
(design tokens / CSS variables, not hardcoded):

- Navy `#06171E` (primary dark)
- Neon green `#80FF4E` (accent)
- Headings: a serif such as Century Schoolbook / Georgia
- Body: a clean sans such as Calibri / Inter
- Tone: clean, confident, minimal — rounded cards, generous whitespace, no
  clutter

---

## 4. Core scope

### 4.1 Client-facing (espace client)

- Multi-step loan application form (progressive, autosave, real-time
  validation)
- Loan simulator / calculator — amount selectable between **2 000 and
  20 000** (slider + input, validate bounds client- and server-side), term,
  rate → estimated payments
- Secure document upload (KYC: ID, proof of income, bank statement)
- Electronic signature of the loan contract (timestamped, archived)
- Client dashboard: loan status, payment schedule, history
- Automatic notifications (SMS + email) at key milestones

### 4.2 Back-office (admin)

- Centralized case management (search, filter, all applications in one view)
- Scoring & approval workflow (configurable rules, approve/reject in a few
  clicks)
- Payment/collection platform integration (built against a provider interface;
  default/stub implementation, swappable for Paymely or equivalent)
- User & role management (agent / supervisor / admin, scoped permissions)
- KPI dashboards & reports (application volume, approval rate, average time
  to decision, loan amount distribution across the 2 000–20 000 range)
- Full action history / audit trail

### 4.3 Automations

- Automatic SMS/email reminders (before due date, on due date, overdue) —
  vary phrasing across messages so it doesn't read as robotic; **never
  reveal internal collection/payday-timing strategy in outbound copy**
- Automated approval workflow routing based on scoring rules
- FAQ chatbot / virtual assistant (basic scripted or LLM-backed, 24/7)
- CRM sync (contact + status updates)
- Scheduled report generation and delivery

### 4.4 Security & compliance

- SSL/TLS end-to-end
- 2FA for admin/staff accounts
- Anti-fraud / anti-bot protections (rate limiting, CAPTCHA on public forms,
  basic WAF-style input hardening)
- Encrypted storage for KYC documents and signed contracts
- Initial secure backup at launch
- Access logging for sensitive actions (who viewed/edited what, when)
- Data protection: no client data leaves the system via unofficial channels,
  no personal-device storage of client data, breach-reporting process
  documented, clauses survive contract end (mirror this in any ToS/DPA
  copy you draft)

### 4.5 Bilingual

- Full FR/EN parity across every client-facing and admin screen, including
  transactional SMS/email templates
- Formal register ("vous") in all French client-facing copy — no "tu"

---

## 5. Explicitly out of scope

- Domain purchase/registration and hosting setup — not part of this build
- New feature development beyond what's listed above

---

## 6. UI direction

- Minimal, confident, fintech-clean — not playful, not cluttered
- Loan amount is the hero input on the simulator: make it feel effortless to
  adjust (slider synced with a numeric field, live payment estimate updating
  as the user drags)
- Multi-step forms: persistent progress indicator, one clear primary action
  per step, autosave state so a refresh doesn't lose progress
- Back-office: dense, scannable tables for case lists; a focused detail view
  per application (not everything crammed on one screen)
- Mobile-first for the client-facing flow (most applicants will be on phone);
  back-office can assume desktop
- Respect the design tokens in §3 — no ad hoc colors/fonts introduced per
  component

---

## 7. What to do first

1. Scaffold the repo with the stack in §2 (Next.js + TS + Tailwind + Prisma).
2. Propose a Prisma schema covering: users/roles, applications (with amount
   constrained to 2 000–20 000), documents, loan terms/schedule, payments,
   notifications log, audit log.
3. Set up FR/EN i18n scaffolding before building screens, not after.
4. Build a minimal end-to-end slice first (submit an application → see it in
   the back-office → approve it → client dashboard reflects the update)
   before fleshing out every screen — confirm this slice works before going
   wide.
5. Ask before making irreversible infra choices (hosting target, payment
   provider credentials, SMS/email provider) — stub these behind interfaces
   until real credentials are provided.
