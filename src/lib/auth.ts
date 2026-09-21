// Edge-compatible session cookie helpers (used by middleware + login route).
// The cookie value is `payload.signature`, where signature is an HMAC-SHA256
// over the payload keyed by SESSION_SECRET. No DB lookup needed for a single user.

export const SESSION_COOKIE = "ath_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSWORD;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET (or APP_PASSWORD) must be set to sign session cookies."
    );
  }
  return secret;
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encode(text: string): Uint8Array<ArrayBuffer> {
  const u8 = new TextEncoder().encode(text);
  // Copy into a fresh ArrayBuffer-backed array so it satisfies BufferSource
  // under strict typed-array typings (Web Crypto expects ArrayBuffer, not
  // ArrayBufferLike).
  const out = new Uint8Array(u8.byteLength);
  out.set(u8);
  return out;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encode(payload));
  return base64url(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const payload = base64url(
    encode(JSON.stringify({ iat: Date.now() }))
  );
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload);
  if (!timingSafeEqual(sig, expected)) return false;

  try {
    const json = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0)
        )
      )
    );
    const iat = Number(json.iat);
    if (!Number.isFinite(iat)) return false;
    if (Date.now() - iat > MAX_AGE_SECONDS * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
