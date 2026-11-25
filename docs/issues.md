# Resumestan — Issues / Checks

Test date: 2026-11-25  
Scope: local (`127.0.0.1:3000`) + deployed (`https://resumestan.vercel.app`) + Vercel/Canva/Atlas setup.

## Checked / Working

- **Auth**: create-account, send-otp, verify-otp, login, protected-route 401 behavior.
- **Dashboard**: loads, shows connected Canva account, resumes/stats, add resume modal.
- **Canva OAuth**: connect flow works (Resumestan app consent, callback `?canva=connected`).
- **Canva import**: designs list loads, resume can be added.
- **Resume detail**: preview, analysis, saved recommendations/guides.
- **AI (Gemini)**: analyze, recommendations, full guide, edit-guide APIs return valid responses; edit-guide worked on deployed UI.
- **DB**: Atlas connection works; Vercel DB connectivity fixed by adding `0.0.0.0/0` in Atlas IP Access List.
- **Lint/Build**: `npm run lint` passes with 0 errors; build previously verified passing.
- **Config files**: `.env.example` added with required keys and local/prod redirect guidance.

## Issues (status)

### 1) Canva app is Draft — External/manual
- **Status**: ⚠️ External action required (not a code fix).
- **Observed**: Resumestan app in Canva developer portal is `Draft` (Public).
- **Impact**: Public/general distribution may require Canva review/submission depending on Canva requirements.
- **Action**: Complete Canva app listing/security/testing requirements and submit/publish in Canva Developer Portal.

### 2) Canva redirect/env mismatch — Fixed by config/docs
- **Status**: ✅ Mitigated in code/docs (still config-sensitive per environment).
- **Fix done**: Added `.env.example`; Vercel prod env set to `https://resumestan.vercel.app/api/canva/callback` and `https://resumestan.vercel.app`; Canva Redirect URLs include both localhost and prod callback.
- **Action**: Keep `CANVA_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, and Canva Redirect URLs in sync for each environment.

### 3) Analyze needs valid Canva token — Fixed UX
- **Status**: ✅ Improved.
- **Fix done**: Resume detail page now shows analyze error inline and displays a **Reconnect Canva** CTA when error indicates missing/disconnected Canva token.
- **Note**: Valid Canva connection/token is still required for Canva export+analyze.

### 4) Intermittent stuck/loading UI states — Fixed major cases
- **Status**: ✅ Major cases fixed; monitor.
- **Fix done**: Fixed SettingsMenu hydration mismatch; replaced fragile dashboard/accounts loading effects; lint passes. 
- **Note**: If any long AI request appears stuck, reload and check API response; consider adding global request timeout/toast fallback.

### 5) `next/image` lint warnings — Fixed
- **Status**: ✅ Fixed.
- **Fix done**: Replaced `<img>` with `next/image` in `app/page.js`, `components/dashboard/ResumeCard.jsx`, `components/dashboard/AddResumeModal.jsx`; added Canva remote image patterns in `next.config.mjs`.

### 6) Test data in shared DB — Fixed
- **Status**: ✅ Fixed.
- **Fix done**: Removed test resume `Resume - Canva Test` (`6b06bd09de47f36da22641b7`) from shared Atlas DB.

## Environment notes

- Vercel project: `arps-projects-62d99403/resumestan` (`https://resumestan.vercel.app`).
- Atlas: `0.0.0.0/0` present in IP Access List for Vercel access; tighten later if using fixed egress.
- Secrets are not stored in this file; use `.env` / Vercel env / Canva dashboard.
