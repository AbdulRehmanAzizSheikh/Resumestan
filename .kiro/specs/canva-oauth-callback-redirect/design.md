# Canva OAuth Callback Redirect Bugfix Design

## Overview

The Canva OAuth callback route (`app/api/canva/callback/route.js`) derives the app's base URL directly from `req.url`. On Vercel, the internal request routing exposes `localhost` as the host in `req.url`, even though the actual public-facing domain is `https://resume-wala-ai-20.vercel.app`. This causes all post-OAuth redirects to land on `localhost:3000/dashboard` in production, breaking the Canva account connection flow for every production user.

The fix is minimal: replace the single `appBase` derivation logic with a three-tier fallback — `x-forwarded-host` → `NEXT_PUBLIC_APP_URL` → `req.url` — while leaving every other part of the route untouched.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — `req.url` host resolves to `localhost` because Vercel's proxy does not expose the public host there, yet `x-forwarded-host` carries the correct value
- **Property (P)**: The desired behavior when the bug condition holds — `appBase` must resolve to the correct public production URL so redirects land on the right domain
- **Preservation**: All existing token-exchange logic, state validation, Canva account upsert, and local-dev redirect behavior must remain completely unchanged
- **`appBase`**: The computed base URL (`protocol + "://" + host`) used for every `NextResponse.redirect` call in `callback/route.js`
- **`x-forwarded-host`**: HTTP header injected by Vercel's edge proxy carrying the public hostname (e.g., `resume-wala-ai-20.vercel.app`)
- **`x-forwarded-proto`**: HTTP header injected by Vercel carrying the public protocol (`https`)
- **`NEXT_PUBLIC_APP_URL`**: Environment variable that can be set as a fallback app base URL

## Bug Details

### Bug Condition

The bug manifests when the Canva OAuth callback is processed on Vercel's infrastructure. The `GET` handler in `callback/route.js` derives `appBase` by parsing `req.url` — but Vercel's internal routing replaces the public host with `localhost` in that field, while still setting `x-forwarded-host` to the correct public domain. As a result, every redirect goes to `localhost:3000`.

**Formal Specification:**
```
FUNCTION isBugCondition(req)
  INPUT: req — Next.js Request object
  OUTPUT: boolean

  reqHost := new URL(req.url).host
  forwardedHost := req.headers.get("x-forwarded-host")

  RETURN reqHost IN ["localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"]
         AND forwardedHost IS NOT NULL
         AND forwardedHost != reqHost
END FUNCTION
```

### Examples

- **Production success redirect**: User connects Canva on Vercel → callback runs → `req.url` host is `localhost:3000` → redirect goes to `localhost:3000/dashboard?canva=connected` ❌ (expected: `https://resume-wala-ai-20.vercel.app/dashboard?canva=connected`)
- **Production failure redirect**: State mismatch on Vercel → redirect goes to `localhost:3000/dashboard?canva=failed` ❌ (expected: `https://resume-wala-ai-20.vercel.app/dashboard?canva=failed`)
- **Error param redirect**: Canva returns `error` query param on Vercel → redirect goes to `localhost:3000/dashboard?canva=failed` ❌ (expected: production URL)
- **Local development (non-buggy)**: `x-forwarded-host` is absent locally → `req.url` host is `localhost:3000` → redirect correctly goes to `localhost:3000/dashboard` ✅

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Local development redirects must continue to resolve to `localhost:3000/dashboard` (no regression for dev workflow)
- Canva token exchange HTTP call must use `CANVA_REDIRECT_URI` env var unchanged — not `appBase`
- User state validation (state match + expiry check) must remain identical
- Canva account upsert logic (find existing by `canvaUserId`, update or push) must remain identical
- `pendingCanvaState` clearing before save must remain identical
- All error paths (`canva=failed`) must remain identical — only the host in the redirect URL changes

**Scope:**
All logic that does NOT involve constructing `appBase` should be completely unaffected by this fix. This includes:
- The token exchange `fetch` call and its body/headers
- MongoDB user queries and mutations
- Canva profile fetch and `canvaUserId` / `accountName` extraction
- The `searchParams` extraction of `code`, `state`, and `error`

## Hypothesized Root Cause

Based on the bug description and Vercel's documented request routing behavior:

1. **Vercel Internal Proxy Rewrites `req.url`**: Vercel routes traffic through an internal proxy that forwards requests to the Node.js runtime with `localhost` as the host in the request URL. The public domain is preserved only in the `x-forwarded-host` header. This is a known Vercel behavior and the primary cause.

2. **No Forwarded-Header Fallback in Current Code**: The existing `appBase` derivation (`new URL(req.url).protocol + "//" + new URL(req.url).host`) has no fallback to `x-forwarded-host`, so it will always produce `localhost` on Vercel.

3. **Missing `NEXT_PUBLIC_APP_URL` Env Check**: No secondary fallback to an explicitly configured app URL exists, which would otherwise allow teams to override the derived base even without forwarded headers.

4. **Same Pattern in `app/api/auth/canva/route.js`**: The auth initiation route has the identical `appBase` derivation pattern and may have the same issue for its `/login` redirect paths (though it primarily redirects to Canva, not back to the app).

## Correctness Properties

Property 1: Bug Condition - Forwarded Host Takes Priority for appBase

_For any_ request where `x-forwarded-host` header is present (isBugCondition returns true), the fixed `GET` handler SHALL construct `appBase` as `${x-forwarded-proto || "https"}://${x-forwarded-host}`, ensuring all redirects go to the correct public production URL rather than `localhost`.

**Validates: Requirements 2.1, 2.4**

Property 2: Preservation - Non-Forwarded Environments Unaffected

_For any_ request where `x-forwarded-host` is absent and `NEXT_PUBLIC_APP_URL` is not set (isBugCondition returns false — i.e., local development), the fixed handler SHALL derive `appBase` from `req.url` exactly as the original code does, preserving local development redirect behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `app/api/canva/callback/route.js`

**Function**: `GET(req)`

**Specific Changes**:

1. **Replace `appBase` derivation** (lines 10–11 in current file): Swap the two-line direct `req.url` parse with the three-tier fallback logic.

   ```js
   // BEFORE
   const reqUrl = new URL(req.url);
   const appBase = `${reqUrl.protocol}//${reqUrl.host}`;

   // AFTER
   const forwardedHost = req.headers.get("x-forwarded-host");
   const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
   const appBase = forwardedHost
     ? `${forwardedProto}://${forwardedHost}`
     : process.env.NEXT_PUBLIC_APP_URL ||
       (() => { const u = new URL(req.url); return `${u.protocol}//${u.host}`; })();
   ```

2. **No other changes**: All other logic in the file remains byte-for-byte identical.

3. **Note on `app/api/auth/canva/route.js`**: This file has the same `appBase` derivation pattern. However, it only uses `appBase` for redirecting to `/login` (error paths), not for the success flow. It should be considered for the same fix to be consistent, but it is out of scope for this minimal bugfix.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code using simulated Vercel-like request conditions; then verify the fix works correctly and that local-dev behavior is fully preserved.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause that `req.url` host is `localhost` on Vercel even when `x-forwarded-host` is set to the production domain.

**Test Plan**: Create unit tests that construct mock `Request` objects with `x-forwarded-host` set to a production domain but `req.url` pointing to `localhost`. Run on UNFIXED code to observe that the redirect goes to `localhost` instead of the production domain.

**Test Cases**:
1. **Vercel Success Redirect Test**: Mock request with `x-forwarded-host: resume-wala-ai-20.vercel.app`, `req.url: http://localhost:3000/api/canva/callback?code=abc&state=xyz` → assert redirect goes to `localhost:3000` (will demonstrate bug on unfixed code)
2. **Vercel Error Redirect Test**: Same mock but with `?error=access_denied` → assert redirect goes to `localhost:3000` (will demonstrate bug on unfixed code)
3. **Vercel State-Mismatch Test**: Valid headers but no matching user in DB → assert redirect goes to `localhost:3000` (will demonstrate bug on unfixed code)

**Expected Counterexamples**:
- Redirect URL host is `localhost:3000` instead of `resume-wala-ai-20.vercel.app`
- Root cause confirmed: `new URL(req.url).host` returns `localhost` when `x-forwarded-host` is ignored

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (`x-forwarded-host` is present), the fixed function redirects to the correct production domain.

**Pseudocode:**
```
FOR ALL req WHERE isBugCondition(req) DO
  response := GET_fixed(req)
  redirectUrl := new URL(response.headers.get("Location"))
  ASSERT redirectUrl.host = req.headers.get("x-forwarded-host")
  ASSERT redirectUrl.protocol = req.headers.get("x-forwarded-proto") + ":"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (no `x-forwarded-host`, no `NEXT_PUBLIC_APP_URL`), the fixed function redirects to the same host as the original function.

**Pseudocode:**
```
FOR ALL req WHERE NOT isBugCondition(req) DO
  ASSERT GET_original(req).headers.get("Location") 
       = GET_fixed(req).headers.get("Location")
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it can generate many combinations of query params (`code`, `state`, `error`, missing fields) and verify that redirect behavior is unchanged across all of them for the local-dev case.

**Test Plan**: Observe that local-dev redirects work on unfixed code (they do — `localhost:3000` is correct locally), then write property-based tests that assert the same redirect host for all non-buggy requests after the fix.

**Test Cases**:
1. **Local Dev Success Path Preservation**: No `x-forwarded-host`, no `NEXT_PUBLIC_APP_URL` → verify redirect host is still `localhost:3000` after fix
2. **`NEXT_PUBLIC_APP_URL` Fallback**: No `x-forwarded-host` but `NEXT_PUBLIC_APP_URL=https://custom.app` → verify redirect host is `custom.app`
3. **Token Exchange Preservation**: Verify `CANVA_REDIRECT_URI` is still used in token exchange body (not `appBase`) after fix
4. **Error Path Preservation**: `?error=access_denied` with no forwarded headers → still redirects with `canva=failed` to `localhost:3000`

### Unit Tests

- Test `appBase` derivation with `x-forwarded-host` present → uses forwarded host
- Test `appBase` derivation with no forwarded headers but `NEXT_PUBLIC_APP_URL` set → uses env var
- Test `appBase` derivation with nothing set → falls back to `req.url` host
- Test that `CANVA_REDIRECT_URI` in the token exchange body is never replaced by `appBase`

### Property-Based Tests

- Generate random valid `x-forwarded-host` values and verify `appBase` always equals `${proto}://${host}`
- Generate random request URLs with `localhost` host and random forwarded-host headers and verify the redirect URL never contains `localhost` when a forwarded host is present
- Generate random combinations of `code`/`state`/`error` query params with no forwarded headers and verify redirect host matches `req.url` host (preservation)

### Integration Tests

- Simulate the full OAuth flow on a mock Vercel-like environment with forwarded headers and verify the user is redirected to the production dashboard URL
- Simulate local development flow with no forwarded headers and verify the user is still redirected to `localhost:3000/dashboard`
- Verify the Canva account is successfully saved to the DB in both environments (forwarded vs non-forwarded)
