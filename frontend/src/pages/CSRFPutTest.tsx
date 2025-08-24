/**
 * CSRFPutTest
 * A minimal, isolated tester that performs a PUT to /api/resource/ToDo/{name}
 * with explicit CSRF handling. Renders request/response so you can validate
 * headers and see Frappe's response body directly.
 *
 * Usage:
 * - Import and render this page temporarily from App.tsx to test:
 *     import { CSRFPutTest } from "./pages/CSRFPutTest";
 *     ...
 *     <CSRFPutTest />
 *
 * - Enter a valid ToDo name from your site (e.g., "T00001") and a new subject.
 * - Click "PUT Update". Check Network tab as well.
 */

import React from "react";
import Alert from "@mui/material/Alert";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
} from "@mui/material";



function getFrappeCSRFToken(): string | null {
  // Try cookie first, fallback to window.csrf_token
  try {
    const m = document.cookie.match(/(?:^|;\s*)frappe-csrf-token=([^;]+)/i);
    if (m && m[1]) return decodeURIComponent(m[1]);
  } catch {
    /* ignore */
  }
  try {
    const w = window as unknown as { csrf_token?: string };
    if (w?.csrf_token && w.csrf_token.length > 0) return w.csrf_token;
  } catch {
    /* ignore */
  }
  return null;
}

async function doPutWithCSRF(url: string, payload: unknown, addXHRHeader = true) {
  const csrf = getFrappeCSRFToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (addXHRHeader) headers["X-Requested-With"] = "XMLHttpRequest";
  if (csrf) headers["X-Frappe-CSRF-Token"] = csrf;

  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });
  const text = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text
  }
  return { ok: res.ok, status: res.status, statusText: res.statusText, text, data, headers: Object.fromEntries(res.headers.entries()) };
}

export function CSRFPutTest() {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("Test subject from CSRF tester");
  const [addXHRHeader, setAddXHRHeader] = React.useState(true);
  const [payloadRaw, setPayloadRaw] = React.useState(JSON.stringify({
    description: "Test subject from CSRF tester",
    status: "Open",
    priority: "Medium",
    allocated_to: null
  }, null, 2));

  const [result, setResult] = React.useState<null | {
    ok: boolean;
    status: number;
    statusText: string;
    text: string;
    data: unknown;
    headers: Record<string, string>;
    requestHeaders: Record<string, string>;
    csrfFromCookie: string | null;
  }>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const csrfCookie = getFrappeCSRFToken();

  const onRun = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      let payload: any;
      try {
        payload = JSON.parse(payloadRaw);
      } catch {
        payload = {
          description: subject,
          status: "Open",
          priority: "Medium",
          allocated_to: null,
        };
      }
      const url = `/api/resource/ToDo/${encodeURIComponent(name)}`;
      // Prepare the headers we intend to send (for on-screen echo)
      const intendedHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      if (addXHRHeader) intendedHeaders["X-Requested-With"] = "XMLHttpRequest";
      const csrf = getFrappeCSRFToken();
      if (csrf) intendedHeaders["X-Frappe-CSRF-Token"] = csrf;

      const res = await doPutWithCSRF(url, payload, addXHRHeader);
      setResult({
        ...res,
        requestHeaders: intendedHeaders,
        csrfFromCookie: csrfCookie,
      });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>CSRF PUT Test (ToDo)</Typography>
 
      <Stack spacing={2}>
        <Alert severity={csrfCookie ? "success" : "warning"}>
          {`CSRF token detected: ${csrfCookie ? "Yes (cookie/window)" : "No"}.`}
        </Alert>
 
        <TextField
          label="ToDo name (docname)"
          placeholder="e.g. T00001"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          size="small"
          fullWidth
        />
 
        <TextField
          label="Subject (description)"
          value={subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSubject(e.target.value);
            setPayloadRaw(JSON.stringify({
              description: e.target.value,
              status: "Open",
              priority: "Medium",
              allocated_to: null
            }, null, 2));
          }}
          size="small"
          fullWidth
        />
 
        <FormControlLabel
          control={<Checkbox checked={addXHRHeader} onChange={(_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => setAddXHRHeader(checked)} />}
          label='Send header: X-Requested-With: "XMLHttpRequest"'
        />
 
        <TextField
          label="Raw JSON payload (optional override)"
          value={payloadRaw}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayloadRaw(e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={4}
        />
 
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={onRun} disabled={loading || !name}>
            {loading ? "Running…" : "PUT Update"}
          </Button>
        </Stack>
 
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}
 
        {result && (
          <>
            <Divider />
            <Typography variant="subtitle1">Result</Typography>
            <Typography variant="body2">ok: {String(result.ok)} | status: {result.status} {result.statusText}</Typography>
 
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Request Headers (intended)</Typography>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result.requestHeaders, null, 2)}</pre>
 
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Response Headers</Typography>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result.headers, null, 2)}</pre>
 
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Response Body</Typography>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{result.text}</pre>
          </>
        )}
      </Stack>
    </Box>
  );
}