# Resumestan — Issues / Gaps (Tested)

Test date: 2026-11-25  
Scope: local (`127.0.0.1:3000`) + deployed (`https://resumestan.vercel.app`) + Vercel/Canva/Atlas setup checks.

## Working (verified)

- **Auth**: create-account, send-otp, verify-otp, login, protected route 401 behavior.
- **Dashboard**: loads, shows connected Canva account, resumes/stats, add resume modal.
- **Canva OAuth**: connect flow works (Resumestan Canva app consent, callback to dashboard with `?canva=connected`).
- **Canva import**: designs list loads, resume can be added.
- **Resume detail**: preview, analysis display, saved recommendations/guides display.
- **AI (Gemini)**: analyze, recommendations, full guide, edit guide APIs returned valid responses; edit guide worked on deployed UI.
- **DB**: Atlas connection works; deployed DB issue fixed by adding `0.0.0.0/0` to Atlas IP Access List.
- **Build/Lint**: `npm run lint` passes with 0 errors (4 `next/image` warnings); build previously verified passing.

## Issues / Gaps

### 1) Canva app is still in Draft (setup blocker for public use)
- **Status**: Not a code bug; Canva developer portal setup.
- **Observed**: Resumestan app in Canva is `Draft` with Public distribution selected.
- **Impact**: Public/general users may not be able to use it until Canva app submission/review requirements are completed as needed.
- **Fix**: Complete Canva app listing/security/testing requirements in Canva developer portal and submit/publish as required.

### 2) Canva redirect/env must match environment
- **Status**: Config-sensitive.
- **Observed**: Local `.env` uses `http://127.0.0.1:3000/api/canva/callback`; Vercel should use `https://resumestan.vercel.app/api/canva/callback`. Both must be registered in Canva Redirect URLs.
- **Impact**: Wrong redirect URI causes Canva OAuth failure.
- **Fix**: Keep Canva Redirect URLs and `CANVA_REDIRECT_URI`/`NEXT_PUBLIC_APP_URL` in sync for each environment before testing/deploy.

### 3) Analyze requires valid Canva token for the resume’s connected account
- **Status**: Expected behavior, but can confuse users.
- **Observed**: `/api/resumes/:id/analyze` returns 400 `"Canva account not connected or token missing"` when no valid token is available.
- **Impact**: User can’t analyze imported resume until Canva account is connected and token valid.
- **Fix**: Improve UI message/CTA to reconnect Canva; consider token refresh/clearer status.

### 4) Occasional frontend stuck/loading state observed during dev browser testing
- **Status**: Intermittent/UI robustness concern.
- **Observed**: Earlier, dashboard sections stayed on "Loading..." until hydration/effect fixes; one edit-guide UI action showed "Generating..." while API was fine. After fixes/reload, flows worked.
- **Impact**: Users may see stuck UI in edge cases.
- **Fix**: Audit client components for hydration-safe state, effect cleanup, and request state handling; add error/timeout UI for long AI requests.

### 5) Lint warnings (`@next/next/no-img-element`)
- **Status**: Non-blocking warning.
- **Observed**: 4 warnings in `app/page.js`, `components/dashboard/AddResumeModal.jsx`, `components/dashboard/ResumeCard.jsx`.
- **Impact**: Possible LCP/bandwidth optimization miss; no functional break.
- **Fix**: Replace `<img>` with `next/image` where appropriate, or intentionally suppress with justification.

### 6) Test data in shared DB
- **Status**: Cleanup item.
- **Observed**: A test resume (`Resume - Canva Test`) exists in the shared Atlas DB used by local/prod.
- **Impact**: Pollutes real workspace.
- **Fix**: Delete test resume/data if not needed.

## Environment notes

- Vercel project: `arps-projects-62d99403/resumestan` (`resumestan.vercel.app`).
- Atlas: `0.0.0.0/0` added to IP Access List to allow Vercel connectivity. Restrict later if moving to fixed egress/IP strategy.
- Secrets were not recorded in this file; check `.env`/Vercel env/Canva dashboard for actual values.
