import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ExpenseReferencesProvider } from "@/providers/ExpenseReferencesProvider";
import { initWebVitals } from "@/lib/webVitals";
import "./index.css";
import App from "./App";

// Force cache refresh for production
if (import.meta.env.PROD) {
  // Clear any existing service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  // Initialize web vitals in production
  initWebVitals();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <ExpenseReferencesProvider>
                <App />
              </ExpenseReferencesProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
