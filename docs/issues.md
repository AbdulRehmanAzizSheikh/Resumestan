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

### 1) Canva app is Draft — Manual completion required

- **Status**: ⚠️ External/manual action required.
- **Portal**: [Canva Developer Portal](https://www.canva.com/developers/apps) → **Your apps** → **Resumestan** (`AAHOGLTFD8w`) → **App status**.
- **Current state**: App is `Draft` (Public). App status checklist still shows required actions; some already-filled items may need re-save/validation on Canva side.

#### Already completed by agent (verify once)

- **Security information**: Privacy/data management, retention, removal, scope rationales (`asset:read`, `design:content:read`, `design:meta:read`), security requirement checkboxes, security contact email `mail@abdulrehman.sbs` — saved.
- **Testing instructions**: “About your app or platform”, “Testing steps”, “Additional details” filled — saved.
- **App listing details**:
  - **Text**: App name/short description/description filled.
  - **Media**: App icon and featured image uploaded.
  - **Behavior**: Outside Canva selected, destination URL `https://resumestan.vercel.app/dashboard`.
  - **Links**: Company/website `https://resumestan.vercel.app`, Terms `https://resumestan.vercel.app/terms`, Privacy `https://resumestan.vercel.app/privacy`, Support `https://resumestan.vercel.app/support`.
- **Your details**: Individual selected, name/email filled, authority/compliance checkboxes checked. **Please confirm these legal checkboxes are accurate before submitting.**

#### Manual steps you must do (task by task)

1. **Confirm deployed legal/support pages are live**
   - Open: `https://resumestan.vercel.app/privacy`, `https://resumestan.vercel.app/terms`, `https://resumestan.vercel.app/support`.
   - If any page is missing, wait for Vercel deploy from latest `main` (`77673a2`) or redeploy Vercel project `arps-projects-62d99403/resumestan`.

2. **Create a public app walkthrough video (required)**
   - Record a short screen video showing the full flow: sign up/login → verify OTP → connect Canva → add resume → analyze resume → view recommendations/guide → Edit in Canva.
   - Upload it to a public URL that does **not** require sign-in/permission (YouTube unlisted/public, Loom public, Google Drive public link, etc.).
   - In Canva portal: **Release → App listing details / Testing instructions** (open **Testing instructions** page) → paste the URL into **App walkthrough video link**.
   - Make sure the link opens in an incognito window.

3. **Provide login details for Canva review (required)**
   - Create a dedicated reviewer test account on `https://resumestan.vercel.app` using an email you can access.
   - Complete OTP verification for that account.
   - Connect a Canva account that has at least one resume design (or ensure the reviewer can use `integrations-support@canva.com` flow if applicable; prefer giving a working test account).
   - In Canva portal: **Testing instructions → Login details**.
     - Fill **Email or username** and **Password** for the Resumestan test account.
     - In **Additional details**, include any needed notes: OTP already verified, no 2FA, where to find sample resume design, and that Canva connection is required before Analyze.
   - Do **not** put real personal passwords you use elsewhere; use a dedicated test password.

4. **Complete “Your details” verification fields (required)**
   - In Canva portal: **Manage → Developer profile → Your details**.
   - Fill all required fields: **Full name / Company name** (as applicable), **Email**, **Phone**, **Address**.
   - Upload **Identification** document if requested (max 5MB, as shown in portal).
   - Fill **Registration number** or other official ID if applicable.
   - Review and confirm checkboxes:
     - “I confirm that I have the authority to sign legal agreements…” 
     - “I agree that the app complies with all applicable laws and regulations.”
   - Only check these if they are true for you/your organization.

5. **Clear stale checklist items by re-saving**
   - App status currently lists some items you already filled. Open each listed section and click/save/confirm fields are present:
     - **App listing details → Text**: confirm Short description and Description.
     - **App listing details → Behavior**: confirm Outside Canva destination URL is selected.
     - **App listing details → Links**: confirm Company/Website, Terms, Privacy, Support URLs.
     - **Security information**: confirm all Privacy/data management, Security requirements, and Security practices fields are complete.
     - **Testing instructions**: confirm About/Testing steps/video/login details.
   - Go back to **App status** and refresh. Required actions count should decrease.

6. **Final pre-submission check**
   - In **App status**, confirm **Required actions** is 0 / no blocking items.
   - Verify Canva Redirect URLs still include: `https://resumestan.vercel.app/api/canva/callback` and `http://127.0.0.1:3000/api/canva/callback` (**Outside Canva → Redirect URLs**).
   - Verify app scopes are only: `asset:read`, `design:content:read`, `design:meta:read`.
   - Optional: run Canva CLI doctor locally if you use Canva app tooling: `npx @canva/cli@latest apps doctor`.

7. **Submit for review**
   - In **App status**, click **Submit app for review** (only when enabled).
   - Turn on Jira/email notifications for review follow-ups if Canva prompts.
   - After submission, monitor Canva review messages and respond with any requested fixes. Record any reviewer feedback/blocker in this file.

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
