// main.tsx
/**
 * Entry point for Workz ToDo Manager (Vite + React + TS)
 * - Wraps app with MUI ThemeProvider and CssBaseline
 * - Uses FrappeProvider for cookie-based auth (same origin)
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import { installFetchInterceptor } from "./lib/fetch-interceptor";
installFetchInterceptor(); // <-- do this first

import { FrappeProvider } from "frappe-react-sdk";
import App from "./App";


const theme = createTheme({ palette: { mode: "light" } });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <FrappeProvider url={window.location.origin}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </FrappeProvider>
  </React.StrictMode>
);
