import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelect from "@/components/LanguageSelect";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container flex h-14 items-center justify-between gap-3">
          {/* Title (clickable) */}
          <Link
            to="/app/inspections/completed"
            className="font-semibold hover:opacity-90"
            aria-label={t("title")}
          >
            {t("title")}
          </Link>

          {/* Right side: small nav + actions */}
          <div className="flex items-center gap-2">
            {/* Lightweight nav */}
            <nav className="hidden sm:flex items-center gap-3 text-sm">
              <Link
                to="/app/inspections/completed"
                className={`hover:underline ${
                  isActive("/app/inspections/completed")
                    ? "font-semibold"
                    : "opacity-80"
                }`}
              >
                Completed
              </Link>
            </nav>

            {/* Primary CTA */}
            <Button asChild>
              <Link to="/app/inspections/new">New Inspection</Link>
            </Button>

            {/* Existing controls */}
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-6">{children}</main>
    </div>
  );
}
