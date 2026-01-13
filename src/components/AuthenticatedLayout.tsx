import type { ReactNode } from "react";
import RequireAuth from "./RequireAuth";
import AppLayout from "./layout/AppLayout";
import { PageTransition } from "./ui/PageTransition";
import { usePermissionError } from "../hooks/usePermissionError";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  title?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

/**
 * Inner component that uses hooks (must be inside providers)
 */
function AuthenticatedLayoutInner({
  children,
  showSidebar = true,
  title,
  breadcrumbs,
}: AuthenticatedLayoutProps) {
  // Global permission error handling - shows toasts for 403 errors
  usePermissionError({ showToast: true });
  
  return (
    <AppLayout showSidebar={showSidebar} title={title} breadcrumbs={breadcrumbs}>
      <PageTransition variant="fade-slide" duration={250}>
        {children}
      </PageTransition>
    </AppLayout>
  );
}

/**
 * Wrapper component that combines RequireAuth and AppLayout
 * Ensures all authenticated pages have the sidebar navigation
 */
export default function AuthenticatedLayout({
  children,
  showSidebar = true,
  title,
  breadcrumbs,
}: AuthenticatedLayoutProps) {
  return (
    <RequireAuth>
      <AuthenticatedLayoutInner showSidebar={showSidebar} title={title} breadcrumbs={breadcrumbs}>
        {children}
      </AuthenticatedLayoutInner>
    </RequireAuth>
  );
}

