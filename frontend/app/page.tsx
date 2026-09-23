
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* =========================
          HEADER
      ========================== */}

      <header className="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center text-white">
            ◈
          </div>

          <b>FinSight</b>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/login"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition"
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-[var(--text)] text-[var(--bg)] px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* =========================
          HERO
      ========================== */}

      <section className="relative grid-pattern">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 pt-20 pb-28 grid lg:grid-cols-2 gap-14 items-center">
          {/* Hero content */}

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-xs font-semibold text-indigo-500">
              <Sparkles size={14} />

              Intelligence without paid AI APIs
            </div>

            <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-[-.05em] leading-[.95]">
              See where your money{" "}
              <span className="text-cyan-500">
                actually goes.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
              FinSight turns transactions into clear patterns,
              budgets, recurring expenses, anomaly signals and
              forecasts using transparent TypeScript algorithms.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-white font-semibold shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 hover:bg-indigo-600 transition"
              >
                Explore FinSight

                <ArrowRight size={17} />
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 font-semibold hover:-translate-y-0.5 transition"
              >
                View dashboard
              </Link>
            </div>

            <div className="mt-8 flex gap-6 text-xs text-[var(--muted)]">
              <span className="flex gap-2 items-center">
                <ShieldCheck
                  size={15}
                  className="text-emerald-500"
                />

                Privacy-first
              </span>

              <span className="flex gap-2 items-center">
                <Zap
                  size={15}
                  className="text-amber-500"
                />

                Fast
              </span>

              <span className="flex gap-2 items-center">
                <BarChart3
                  size={15}
                  className="text-cyan-500"
                />

                Data-backed
              </span>
            </div>
          </div>

          {/* =========================
              DASHBOARD PREVIEW
          ========================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              rotate: 1,
            }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-emerald-500/20 blur-3xl rounded-full" />

            <div className="relative card overflow-hidden p-4 md:p-5">
              <div className="rounded-2xl bg-[var(--surface2)] p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-[var(--muted)]">
                      Total balance
                    </div>

                    <div className="text-3xl font-black mt-1">
                      ₹84,520
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 text-emerald-500 px-3 py-1 text-xs font-bold">
                    +12.4%
                  </div>
                </div>

                <div className="mt-7 h-44 flex items-end gap-2">
                  {[
                    35,
                    50,
                    43,
                    72,
                    55,
                    82,
                    67,
                    92,
                    76,
                    100,
                    88,
                    96,
                  ].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{
                        height: `${h}%`,
                      }}
                      transition={{
                        delay: i * 0.04,
                        duration: 0.5,
                      }}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-500 to-cyan-400 opacity-80"
                    />
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--muted)]">
                      Income
                    </div>

                    <b className="text-emerald-500">
                      ₹45K
                    </b>
                  </div>

                  <div className="rounded-xl bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--muted)]">
                      Expenses
                    </div>

                    <b>₹31K</b>
                  </div>

                  <div className="rounded-xl bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--muted)]">
                      Savings
                    </div>

                    <b className="text-teal-500">
                      ₹13K
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================== */}

      <section className="max-w-7xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-indigo-500">
            BUILT FOR CLARITY
          </p>

          <h2 className="mt-2 text-3xl md:text-4xl font-black">
            One place for the patterns behind your spending.
          </h2>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            [
              WalletCards,
              "Transactions",
              "Fast entry, merchant normalization and category rules.",
            ],
            [
              TrendingUp,
              "Intelligence",
              "Recurring detection, anomaly signals and forecasts.",
            ],
            [
              ShieldCheck,
              "Transparent",
              "No paid AI dependency. Core calculations are your own data and algorithms.",
            ],
          ].map(([Icon, title, desc], i) => {
            const I = Icon as any;

            return (
              <motion.div
                whileHover={{ y: -5 }}
                key={String(title)}
                className="card p-6"
              >
                <div
                  className={`h-11 w-11 rounded-xl grid place-items-center ${
                    i === 0
                      ? "bg-cyan-500/10 text-cyan-500"
                      : i === 1
                        ? "bg-indigo-500/10 text-indigo-500"
                        : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  <I size={20} />
                </div>

                <h3 className="mt-5 font-bold text-lg">
                  {title as string}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {desc as string}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        FinSight · Personal Finance Intelligence Platform
      </footer>
    </div>
  );
}

