import type { ReactNode } from "react";
import RequireAuth from "./RequireAuth";
import AppLayout from "./layout/AppLayout";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  title?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
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
      <AppLayout showSidebar={showSidebar} title={title} breadcrumbs={breadcrumbs}>
        {children}
      </AppLayout>
    </RequireAuth>
  );
}

