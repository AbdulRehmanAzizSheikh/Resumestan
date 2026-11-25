# Bugfix Requirements Document

## Introduction

After a successful Canva OAuth token exchange on Vercel, the final redirect sends the user to `localhost:3000/dashboard?canva=failed` (or `canva=connected`) instead of the production URL `https://resume-wala-ai-20.vercel.app/dashboard`. This breaks the Canva account connection flow for all production users. The root cause is that `callback/route.js` derives the app base URL from `req.url`, which contains `localhost` as the host on Vercel due to its internal request routing — even though `x-forwarded-host` and `NEXT_PUBLIC_APP_URL` carry the correct public domain.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Canva OAuth callback is received on Vercel AND `req.url` host is `localhost` THEN the system redirects the user to `localhost:3000/dashboard?canva=connected` instead of the production domain

1.2 WHEN the Canva OAuth callback encounters any error on Vercel (missing code/state, failed token exchange, no matching user) AND `req.url` host is `localhost` THEN the system redirects the user to `localhost:3000/dashboard?canva=failed` instead of the production domain

1.3 WHEN `callback/route.js` constructs `appBase` THEN the system uses only `reqUrl.protocol` and `reqUrl.host` from `req.url`, ignoring the `x-forwarded-host` and `x-forwarded-proto` headers set by Vercel's proxy

### Expected Behavior (Correct)

2.1 WHEN the Canva OAuth callback is received on Vercel AND `x-forwarded-host` header is present THEN the system SHALL derive `appBase` from `x-forwarded-proto` and `x-forwarded-host` headers, redirecting the user to the correct production URL

2.2 WHEN the Canva OAuth callback is received AND `x-forwarded-host` header is absent BUT `NEXT_PUBLIC_APP_URL` env var is set THEN the system SHALL use `NEXT_PUBLIC_APP_URL` as `appBase`

2.3 WHEN the Canva OAuth callback is received AND neither `x-forwarded-host` nor `NEXT_PUBLIC_APP_URL` is available THEN the system SHALL fall back to deriving `appBase` from `req.url` host

2.4 WHEN `appBase` is correctly resolved to the production URL THEN the system SHALL redirect the user to `https://resume-wala-ai-20.vercel.app/dashboard?canva=connected` on success and `https://resume-wala-ai-20.vercel.app/dashboard?canva=failed` on error

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the callback runs in local development AND `x-forwarded-host` is absent AND `NEXT_PUBLIC_APP_URL` is not set THEN the system SHALL CONTINUE TO derive `appBase` from `req.url`, redirecting to `localhost:3000/dashboard` as before

3.2 WHEN the Canva OAuth token exchange succeeds THEN the system SHALL CONTINUE TO upsert the Canva account into the user's `canvaAccounts` array and clear `pendingCanvaState` before redirecting

3.3 WHEN the state parameter does not match any user or is expired THEN the system SHALL CONTINUE TO redirect with `canva=failed`

3.4 WHEN the token exchange API call returns an error THEN the system SHALL CONTINUE TO redirect with `canva=failed`

3.5 WHEN `CANVA_REDIRECT_URI` is used for the token exchange body THEN the system SHALL CONTINUE TO use the env var value unchanged (not derived from `appBase`)
