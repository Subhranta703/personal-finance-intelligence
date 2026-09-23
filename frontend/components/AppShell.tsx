"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import { api } from "../lib/api";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response = await api.get("/auth/me");

        if (mounted) {
          setUser(response.data.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  }

  // Don't render protected application pages
  // until authentication has been checked.
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[var(--bg)] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center text-white font-black animate-pulse">
            F
          </div>

          <p className="text-sm text-[var(--muted)]">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  // Prevent protected UI from flashing before redirect.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Topbar
  user={user}
  onLogout={logout}
  onMenu={() => setMenu(true)}
/>

        {menu && (
  <div
    className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
    onClick={() => setMenu(false)}
  >
    <div
      className="w-72 max-w-[85vw] h-full bg-[var(--surface)] border-r border-[var(--border)] shadow-2xl p-5 animate-[slideIn_0.2s_ease-out]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center text-white font-black">
            F
          </div>

          <span className="font-bold text-lg">
            FinSight
          </span>
        </div>

        <button
          onClick={() => setMenu(false)}
          className="h-9 w-9 rounded-lg grid place-items-center hover:bg-[var(--surface2)]"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {[
          "dashboard",
          "transactions",
          "budgets",
          "subscriptions",
          "insights",
          "forecast",
          "reports",
          "assistant",
          "settings",
        ].map((x) => {
          const href = `/${x}`;
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`);

          return (
            <Link
              key={x}
              href={href}
              onClick={() => setMenu(false)}
              className={`block px-4 py-3 rounded-xl capitalize text-sm font-medium transition ${
                active
                  ? "bg-indigo-500/10 text-indigo-500"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]"
              }`}
            >
              {x}
            </Link>
          );
        })}
      </nav>
    </div>
  </div>
)}

        <main className="px-4 md:px-7 py-6 pb-24 md:pb-8 max-w-[1600px] mx-auto">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}