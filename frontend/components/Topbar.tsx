
"use client";

import {
  Bell,
  Menu,
  Search,
  Plus,
  LogOut,
  Settings,
  X,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  email: string;
};

type SearchResult = {
  title: string;
  description: string;
  href: string;
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /*
   * Global FinSight search destinations.
   *
   * Later we can replace this with real transaction
   * and analytics search results from the backend.
   */
  const searchItems: SearchResult[] = [
    {
      title: "Dashboard",
      description: "Overview of your financial health",
      href: "/dashboard",
    },
    {
      title: "Transactions",
      description: "View and manage your transactions",
      href: "/transactions",
    },
    {
      title: "Budgets",
      description: "Manage your monthly budgets",
      href: "/budgets",
    },
    {
      title: "Insights",
      description: "Financial intelligence and patterns",
      href: "/insights",
    },
    {
      title: "Forecast",
      description: "View your financial forecast",
      href: "/forecast",
    },
    {
      title: "Settings",
      description: "Manage your FinSight account",
      href: "/settings",
    },
  ];

  const filteredResults = search.trim()
    ? searchItems.filter((item) =>
        `${item.title} ${item.description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : searchItems;

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearch("");
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  function openSearch() {
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-7">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--surface2)]"
            onClick={onMenu}
          >
            <Menu size={20} />
          </button>

          {/* Search trigger */}
          <button
            onClick={openSearch}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] w-64 hover:border-indigo-500/40 hover:text-[var(--foreground)] transition"
          >
            <Search size={16} />

            <span>Search FinSight...</span>

            <kbd className="ml-auto text-[10px] border border-[var(--border)] rounded px-1.5 py-0.5">
              {typeof navigator !== "undefined" &&
              /Mac/i.test(navigator.platform)
                ? "⌘K"
                : "Ctrl K"}
            </kbd>
          </button>

          {/* Mobile search button */}
          <button
            onClick={openSearch}
            className="sm:hidden h-9 w-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] grid place-items-center"
          >
            <Search size={17} />
          </button>
        </div>

        {/* Right */}
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
            aria-label="Notifications"
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
                  <p className="font-semibold truncate">
                    {user.name}
                  </p>

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

      {/* ================================
          GLOBAL SEARCH MODAL
      ================================= */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeSearch();
            }
          }}
        >
          <div className="mx-auto mt-[10vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search
                size={20}
                className="text-[var(--muted)] shrink-0"
              />

              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search FinSight..."
                className="flex-1 bg-transparent py-4 text-sm outline-none"
              />

              <button
                onClick={closeSearch}
                className="rounded-lg p-1.5 hover:bg-[var(--surface2)]"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredResults.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    {search.trim() ? "Search results" : "Quick navigation"}
                  </div>

                  {filteredResults.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSearch}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-[var(--surface2)] transition"
                    >
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-500 grid place-items-center">
                        <Search size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {item.title}
                        </p>

                        <p className="text-xs text-[var(--muted)] truncate">
                          {item.description}
                        </p>
                      </div>

                      <ArrowRight
                        size={16}
                        className="text-[var(--muted)] opacity-0 group-hover:opacity-100 transition"
                      />
                    </Link>
                  ))}
                </>
              ) : (
                <div className="py-12 text-center">
                  <Search
                    size={28}
                    className="mx-auto text-[var(--muted)]"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Try searching for transactions, budgets, insights,
                    or settings.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-4 py-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
              <span>
                Press <kbd className="border rounded px-1">ESC</kbd> to close
              </span>

              <span>
                {filteredResults.length} result
                {filteredResults.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

