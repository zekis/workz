// src/lib/csrf.ts
let cached: string | null = null;

export async function getCsrfToken(): Promise<string | null> {
  // Use cached token if present
  if (cached) return cached;

  // Optional: if you inject boot in index.html, prefer that first
  const boot = (window as any).__WORKZ_BOOT__;
  if (boot?.csrf_token) {
    cached = boot.csrf_token;
    return cached;
  }

  // Fallback: call server
  const res = await fetch("/api/method/workz.api.security.csrf_token", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) return null;
  const j = await res.json();
  cached = j?.message?.csrf_token ?? null;
  return cached;
}

export function setCsrfToken(token: string | null) {
  cached = token;
}
