// src/lib/fetch-interceptor.ts
import { getCsrfToken, setCsrfToken } from "./csrf";

export function installFetchInterceptor() {
  if ((window as any).__WORKZ_FETCH_INTERCEPTOR_INSTALLED__) return;
  (window as any).__WORKZ_FETCH_INTERCEPTOR_INSTALLED__ = true;

  const origFetch = window.fetch;
  console.log("[Workz] Installing fetch interceptor");

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === "string" ? input : (input as Request).url,
      window.location.origin
    );
    const method =
      (init?.method ??
        (typeof input !== "string" ? (input as Request).method : "GET")
      ).toUpperCase();

    const sameOrigin = url.origin === window.location.origin;
    const isApi = url.pathname.startsWith("/api/");
    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);

    // Merge headers: Request headers first, then init headers (caller's override wins)
    const headers = new Headers(
      typeof input !== "string" ? (input as Request).headers : undefined
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));

    // Always send cookies
    const baseInit: RequestInit = { ...init, credentials: "include", headers };

    if (sameOrigin && isApi && isWrite) {
      const token = await getCsrfToken();
      if (token) {
        headers.set("X-Frappe-CSRF-Token", token);
        console.log("[CSRF] attached", method, url.pathname);
      } else {
        console.warn("[CSRF] missing token", method, url.pathname);
      }
      headers.set("X-Requested-With", "XMLHttpRequest");
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
    } else {
      // Helpful trace to prove why it's not attaching
      console.debug(
        "[CSRF] not attaching",
        { method, path: url.pathname, sameOrigin, isApi, isWrite }
      );
    }

    let resp = await origFetch(url.toString(), baseInit);

    // Retry once on CSRF failure
    if (sameOrigin && isApi && isWrite && resp.status === 403) {
      try {
        setCsrfToken(null);
        const fresh = await getCsrfToken();
        if (fresh) {
          headers.set("X-Frappe-CSRF-Token", fresh);
          console.warn("[CSRF] retrying with fresh token", method, url.pathname);
          resp = await origFetch(url.toString(), { ...baseInit, headers });
        }
      } catch { /* ignore */ }
    }

    return resp;
  };
}
