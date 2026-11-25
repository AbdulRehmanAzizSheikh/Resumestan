import crypto from "crypto";

// Random code verifier — 43-128 chars of URL-safe chars per PKCE spec
export function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

// Code challenge = BASE64URL(SHA256(verifier)) — no padding
export async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  // Convert buffer to base64url without padding
  return hash.toString("base64url");
}
