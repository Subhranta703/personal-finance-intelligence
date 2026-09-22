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
        <Topbar user={user} onLogout={logout} />

        {menu && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setMenu(false)}
          >
            <div
              className="w-72 h-full bg-[var(--surface)] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-bold text-lg mb-6">FinSight</div>

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
              ].map((x) => (
                <Link
                  key={x}
                  href={`/${x}`}
                  onClick={() => setMenu(false)}
                  className="block py-3 capitalize text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {x}
                </Link>
              ))}
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