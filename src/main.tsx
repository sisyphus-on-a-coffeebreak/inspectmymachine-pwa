import "./i18n";
// Import IndexedDB safe wrapper early to catch all errors
import "./lib/idb-safe";
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

// Emergency overlay fix - expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).fixStuckOverlay = () => {
    // Remove ALL fixed overlays with dark backgrounds or high z-index
    document.querySelectorAll<HTMLElement>('[style*="position: fixed"], [style*="position:fixed"]').forEach((el) => {
      const bgColor = el.style.backgroundColor || window.getComputedStyle(el).backgroundColor;
      const zIndex = parseInt(el.style.zIndex || window.getComputedStyle(el).zIndex || '0');
      const role = el.getAttribute('role');
      
      // Remove if it's a dark overlay or high z-index modal
      if (
        (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) ||
        (zIndex >= 8000 && role === 'dialog') ||
        (zIndex >= 99 && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)')
      ) {
        el.remove();
      }
    });
    
    // Remove all modals
    document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
    
    // Unlock body scroll - remove ALL inline styles
    document.body.style.cssText = '';
    document.documentElement.style.overflow = '';
    
    // Force remove any classes that might lock scroll
    document.body.classList.remove('keyboard-visible');
    
    console.log('✅ Stuck overlay cleared! Page should be usable now.');
    return true;
  };
  
  // Global Escape key handler - ALWAYS works, even when modals are stuck
  // This runs at the highest priority to catch Escape before anything else
  document.addEventListener('keydown', (e) => {
    // Only handle Escape key
    if (e.key !== 'Escape') return;
    
    // Don't prevent default for browser shortcuts (Cmd+Shift+R, etc.)
    // Only handle Escape to close modals
    const modals = document.querySelectorAll('[role="dialog"]');
    if (modals.length > 0) {
      // Find and click close buttons
      modals.forEach(modal => {
        const closeBtn = modal.querySelector('button[aria-label*="close" i], button[aria-label*="Close" i]') as HTMLButtonElement;
        if (closeBtn) {
          closeBtn.click();
        } else {
          // If no close button, try to find onClose handler or just remove
          const overlay = modal.closest('[style*="position: fixed"]');
          if (overlay) {
            overlay.remove();
          }
        }
      });
      
      // Also unlock body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }, { capture: true }); // Use capture phase to run before other handlers
  
  // Failsafe: Auto-detect and remove stuck overlays after 60 seconds
  if (import.meta.env.DEV) {
    setTimeout(() => {
      const stuckOverlays = document.querySelectorAll<HTMLElement>(
        '[style*="position: fixed"][style*="z-index"]'
      );
      
      stuckOverlays.forEach(overlay => {
        const bgColor = window.getComputedStyle(overlay).backgroundColor;
        const zIndex = parseInt(window.getComputedStyle(overlay).zIndex || '0');
        
        // If it's been there for a while and is blocking, remove it
        if ((bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) && zIndex >= 99) {
          const createdAt = overlay.dataset.createdAt;
          if (!createdAt) {
            overlay.dataset.createdAt = Date.now().toString();
          } else if (Date.now() - parseInt(createdAt) > 60000) {
            console.warn('Auto-removing stuck overlay after 60 seconds');
            overlay.remove();
            document.body.style.overflow = '';
            document.body.style.position = '';
          }
        }
      });
    }, 60000);
  }
}

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
  
  // Initialize web vitals in production (async, won't block render)
  initWebVitals().catch(() => {
    // Silently handle initialization errors
  });
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
