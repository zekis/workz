/**
 * api.ts
 * Minimal JSON helpers for same-origin Frappe calls with CSRF handling.
 *
 * - Uses credentials: "include" so session cookies (sid) are sent.
 * - For mutating requests (POST/PUT/PATCH/DELETE) attaches:
 *    - X-Frappe-CSRF-Token (fetched via csrf.ts with cookie/window/server fallback)
 *    - X-Requested-With: XMLHttpRequest
 *    - Content-Type, Accept: application/json
 *
 * Usage:
 *   import { putJSON, postJSON, delJSON, getJSON } from "../lib/api";
 *   await putJSON(`/api/resource/ToDo/${encodeURIComponent(name)}`, { description: "Updated" });
 */

import { getCsrfToken } from "./csrf";

type Json = Record<string, any> | Array<any> | null;

function isMutating(method: string) {
  const m = method.toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

async function requestJSON<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toString().toUpperCase();
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");

  // Attach JSON Content-Type if body provided and not already set
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // For mutating requests, add CSRF and AJAX headers
  if (isMutating(method)) {
    const csrf = await getCsrfToken();
    headers.set("X-Requested-With", "XMLHttpRequest");
    if (csrf) headers.set("X-Frappe-CSRF-Token", csrf);
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  const text = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave as text
  }

  if (!res.ok) {
    const detail = text || res.statusText;
    throw new Error(`${method} ${res.status} ${res.statusText}: ${detail}`);
  }

  // Frappe often wraps in { message: ... }
  return (data && typeof data === "object" && "message" in data ? (data.message as T) : (data as T));
}

export async function getJSON<T = any>(url: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
  let qs = "";
  if (params) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined) search.set(k, String(v));
    }
    const q = search.toString();
    if (q) qs = (url.includes("?") ? "&" : "?") + q;
  }
  return requestJSON<T>(url + qs, { method: "GET" });
}

export async function postJSON<T = any>(url: string, body: Json): Promise<T> {
  return requestJSON<T>(url, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export async function putJSON<T = any>(url: string, body: Json): Promise<T> {
  return requestJSON<T>(url, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export async function patchJSON<T = any>(url: string, body: Json): Promise<T> {
  return requestJSON<T>(url, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export async function delJSON<T = any>(url: string, body?: Json): Promise<T> {
  return requestJSON<T>(url, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}