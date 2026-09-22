"use client";

import { Bell, Menu, Search, Plus, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function Topbar({
  onMenu,
  user,
  onLogout,
}: {
  onMenu?: () => void;
  user: User;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-7">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[var(--surface2)]"
          onClick={onMenu}
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] w-64">
          <Search size={16} />
          <span>Search FinSight...</span>
          <kbd className="ml-auto text-[10px] border rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/transactions?quick=1"
          className="hidden sm:flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition"
        >
          <Plus size={16} />
          Add
        </Link>

        <ThemeToggle />

        <button
          className="relative h-9 w-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] grid place-items-center"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center text-white text-xs font-bold"
            title={user.name}
          >
            {initials}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-2 z-50">
              <div className="px-3 py-3 border-b border-[var(--border)]">
                <p className="font-semibold truncate">{user.name}</p>

                <p className="text-xs text-[var(--muted)] truncate mt-1">
                  {user.email}
                </p>
              </div>

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm hover:bg-[var(--surface2)]"
              >
                <Settings size={16} />
                Settings
              </Link>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}