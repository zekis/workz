// main.tsx
/**
 * Entry point for Workz ToDo Manager (Vite + React + TS)
 * - Wraps app with MUI ThemeProvider and CssBaseline
 * - Uses FrappeProvider for cookie-based auth (same origin)
 */
import React from "react";
import ReactDOM from "react-dom/client";

import { installFetchInterceptor } from "./lib/fetch-interceptor";
installFetchInterceptor(); // <-- do this first

import { FrappeProvider } from "frappe-react-sdk";
import { ThemeContextProvider } from "./contexts/ThemeContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <FrappeProvider url={window.location.origin}>
      <ThemeContextProvider>
        <App />
      </ThemeContextProvider>
    </FrappeProvider>
  </React.StrictMode>
);
