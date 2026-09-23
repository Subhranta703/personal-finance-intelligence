"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import AnimatedNumber from "../../../components/AnimatedNumber";
import { FadeIn, HoverCard } from "../../../components/Motion";
import {
  ArrowUpRight,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

type User = {
  name: string;
  email?: string;
};

type Transaction = {
  _id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  category: string;
  merchant: string;
  description?: string;
  date: string;
  paymentMethod?: string;
};

type Budget = {
  _id: string;
  category: string;
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  threshold: number;
  status: "healthy" | "warning" | "over";
};

export default function Dashboard() {
  const [data, setData] = useState<any | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";

    return "Good night";
  }

  /*
   * Get current month using local time.
   *
   * We intentionally do NOT use toISOString()
   * because that uses UTC.
   */
  function getCurrentMonth() {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  async function load() {
    try {
      setLoading(true);
      setError(false);
      setBudgetError(false);

      const currentMonth = getCurrentMonth();

      const [
        overview,
        anomalyData,
        userData,
        transactionData,
        budgetData,
      ] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/anomalies"),
        api.get("/auth/me"),
        api.get("/transactions?limit=5"),
        api.get<Budget[]>(
          `/budgets?month=${currentMonth}`
        ),
      ]);

      setData(overview.data);
      setAnomalies(anomalyData.data);
      setUser(userData.data);

      setTransactions(
        transactionData.data?.items ||
          transactionData.data?.transactions ||
          []
      );

      setBudgets(budgetData.data || []);
    } catch (error: any) {
      console.error(
        "Dashboard loading failed:",
        error
      );

      /*
       * If the dashboard APIs fail completely,
       * show the dashboard error state.
       */
      if (
        !error?.config?.url?.includes("/budgets")
      ) {
        setError(true);
        setData(null);
        setTransactions([]);
      }

      /*
       * If only the budget request failed,
       * keep the rest of the dashboard working.
       */
      if (
        error?.config?.url?.includes("/budgets")
      ) {
        console.error(
          "Budget loading failed:",
          error
        );

        setBudgetError(true);
        setBudgets([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /*
   * ================================
   * LOADING STATE
   * ================================
   */

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-64 rounded-xl bg-[var(--surface2)] animate-pulse" />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 rounded-2xl bg-[var(--surface2)] animate-pulse"
            />
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.6fr_1fr] gap-5">
          <div className="h-80 rounded-2xl bg-[var(--surface2)] animate-pulse" />
          <div className="h-80 rounded-2xl bg-[var(--surface2)] animate-pulse" />
        </div>
      </div>
    );
  }

  /*
   * ================================
   * ERROR STATE
   * ================================
   */

  if (error || !data) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-orange-500/10 grid place-items-center">
            <AlertTriangle
              size={24}
              className="text-orange-500"
            />
          </div>

          <h2 className="mt-4 text-lg font-bold">
            Unable to load your dashboard
          </h2>

          <p className="mt-2 text-sm text-[var(--muted)]">
            We couldn't load your financial data.
            Please try again.
          </p>

          <button
            onClick={load}
            className="mt-5 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /*
   * ================================
   * CATEGORY DATA
   * ================================
   */

  const cats = Object.entries(
    data.byCategory || {}
  )
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 5);

  const maxCategoryValue = Number(
    cats[0]?.[1] || 1
  );

  const topCategoryTotal = cats.reduce(
    (sum, [, value]) => sum + Number(value),
    0
  );

  const greeting = getGreeting();

  /*
   * ================================
   * DATE FORMATTER
   * ================================
   */

  function formatRelativeDate(date: string) {
    const transactionDate = new Date(date);
    const now = new Date();

    const diffMs =
      now.getTime() -
      transactionDate.getTime();

    const diffDays = Math.floor(
      diffMs / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7)
      return `${diffDays} days ago`;

    return transactionDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  /*
   * ================================
   * TRANSACTION ICON COLOR
   * ================================
   */

  function getTransactionColor(type: string) {
    if (type === "income") {
      return "text-emerald-500";
    }

    if (type === "transfer") {
      return "text-indigo-500";
    }

    return "text-orange-500";
  }

  /*
   * ================================
   * BUDGET HELPERS
   * ================================
   */

  function getBudgetColor(
    status: Budget["status"]
  ) {
    if (status === "over") {
      return "bg-rose-500";
    }

    if (status === "warning") {
      return "bg-amber-500";
    }

    return "bg-emerald-500";
  }

  function getBudgetTextColor(
    status: Budget["status"]
  ) {
    if (status === "over") {
      return "text-rose-500";
    }

    if (status === "warning") {
      return "text-amber-500";
    }

    return "text-emerald-500";
  }

  function getBudgetStatusText(
    budget: Budget
  ) {
    if (budget.status === "over") {
      const exceeded = Math.max(
        budget.spent - budget.amount,
        0
      );

      return `₹${exceeded.toLocaleString(
        "en-IN"
      )} over`;
    }

    if (budget.status === "warning") {
      return `${Math.round(
        budget.percentage
      )}% used`;
    }

    return `${Math.round(
      budget.percentage
    )}% used`;
  }

  return (
    <div>
      {/* =========================
          HEADER
      ========================== */}

      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-[.18em] text-indigo-500 uppercase">
              Overview
            </div>

            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
              {greeting}
              {user?.name
                ? `, ${user.name}`
                : ""}
              .
            </h1>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Here’s the financial picture from
              your latest data.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* =========================
          FINANCIAL SUMMARY
      ========================== */}

      <div className="mt-7 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          [
            "Net savings",
            data.savings,
            "teal",
            "Current",
          ],
          [
            "Income",
            data.income,
            "emerald",
            "This month",
          ],
          [
            "Expenses",
            data.expenses,
            "coral",
            "This month",
          ],
          [
            "Savings rate",
            data.savingsRate,
            "indigo",
            "Current",
          ],
        ].map(
          ([label, val, tone, meta], i) => (
            <FadeIn
              key={String(label)}
              delay={i * 0.05}
            >
              <HoverCard className="card p-5">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[var(--muted)]">
                    {label as string}
                  </span>

                  <span
                    className={`h-8 w-8 rounded-lg grid place-items-center ${
                      tone === "teal"
                        ? "bg-teal-500/10 text-teal-500"
                        : tone === "emerald"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : tone === "coral"
                        ? "bg-orange-500/10 text-orange-500"
                        : "bg-indigo-500/10 text-indigo-500"
                    }`}
                  >
                    {i === 0 ? (
                      <TrendingUp size={15} />
                    ) : i === 1 ? (
                      <ArrowUpRight size={15} />
                    ) : i === 2 ? (
                      <WalletCards size={15} />
                    ) : (
                      <Sparkles size={15} />
                    )}
                  </span>
                </div>

                <div className="mt-4 text-2xl font-black">
                  {i === 3 ? (
                    `${Number(val).toFixed(
                      1
                    )}%`
                  ) : (
                    <AnimatedNumber
                      value={Number(val)}
                    />
                  )}
                </div>

                <div className="mt-1 text-xs text-[var(--muted)]">
                  {meta as string}
                </div>
              </HoverCard>
            </FadeIn>
          )
        )}
      </div>

      {/* =========================
          SPENDING + BUDGET
      ========================== */}

      <div className="mt-5 grid xl:grid-cols-[1.6fr_1fr] gap-5">
        {/* =========================
            SPENDING OVERVIEW
        ========================== */}

        <FadeIn delay={0.2}>
          <div className="card p-5 h-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-bold">
                  Spending overview
                </h2>

                <p className="text-xs text-[var(--muted)] mt-1">
                  Where your money is going this
                  month
                </p>
              </div>

              <Link
                href="/insights"
                className="text-xs font-semibold text-indigo-500"
              >
                Details →
              </Link>
            </div>

            {/* BAR CHART */}

            {cats.length > 0 ? (
              <div className="mt-7">
                <div className="flex items-end gap-4 h-56">
                  {cats.map(
                    ([name, value]) => {
                      const numericValue =
                        Number(value);

                      const percentage =
                        (numericValue /
                          maxCategoryValue) *
                        100;

                      return (
                        <div
                          key={name}
                          className="flex-1 h-full flex flex-col items-center justify-end gap-2 group"
                        >
                          <div className="text-[10px] font-bold text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition">
                            ₹
                            {numericValue.toLocaleString(
                              "en-IN"
                            )}
                          </div>

                          <div className="relative w-full max-w-16 h-44 flex items-end">
                            <div className="absolute inset-0 rounded-t-xl bg-[var(--surface2)] opacity-60" />

                            <div
                              className="
                                relative
                                w-full
                                rounded-t-xl
                                bg-gradient-to-t
                                from-rose-600
                                via-red-500
                                to-white
                                border
                                border-red-400/40
                                shadow-[0_0_18px_rgba(239,68,68,0.25)]
                                transition-all
                                duration-500
                                ease-out
                                group-hover:shadow-[0_0_28px_rgba(239,68,68,0.45)]
                                group-hover:scale-[1.03]
                              "
                              style={{
                                height: `${Math.max(
                                  12,
                                  percentage
                                )}%`,
                              }}
                            />
                          </div>

                          <span className="text-[10px] font-medium text-[var(--muted)] truncate max-w-full text-center">
                            {name}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="mt-1 border-t border-[var(--border)]" />

                <div className="mt-4 flex justify-between text-[10px] text-[var(--muted)]">
                  <span>
                    Top {cats.length} categories
                  </span>

                  <span className="font-semibold">
                    ₹
                    {Math.round(
                      topCategoryTotal
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-7 h-56 flex flex-col items-center justify-center rounded-xl bg-[var(--surface2)]">
                <WalletCards
                  size={28}
                  className="text-[var(--muted)]"
                />

                <p className="mt-3 text-sm font-semibold">
                  No spending data yet
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Add transactions to see your
                  spending breakdown.
                </p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* =========================
            REAL BUDGET HEALTH
        ========================== */}

        <FadeIn delay={0.25}>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">
                  Budget health
                </h2>

                <p className="text-xs text-[var(--muted)] mt-1">
                  Current month
                </p>
              </div>

              <CalendarDays
                size={18}
                className="text-indigo-500"
              />
            </div>

            {/* Budget API error */}
            {budgetError ? (
              <div className="mt-6 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                  <AlertTriangle size={14} />
                  Unable to load budgets
                </div>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  Your dashboard is working, but
                  budget data could not be loaded.
                </p>

                <button
                  onClick={load}
                  className="mt-3 text-xs font-semibold text-indigo-500 hover:text-indigo-400"
                >
                  Try again
                </button>
              </div>
            ) : budgets.length > 0 ? (
              <div className="mt-6 space-y-5">
                {budgets
                  .slice(0, 4)
                  .map((budget) => {
                    const percentage =
                      Number(
                        budget.percentage
                      ) || 0;

                    return (
                      <div
                        key={budget._id}
                      >
                        {/* Category + amount */}
                        <div className="flex justify-between items-center text-xs mb-2 gap-3">
                          <div className="min-w-0">
                            <span className="font-medium truncate block">
                              {budget.category}
                            </span>

                            <span
                              className={`text-[10px] ${getBudgetTextColor(
                                budget.status
                              )}`}
                            >
                              {getBudgetStatusText(
                                budget
                              )}
                            </span>
                          </div>

                          <span className="text-[var(--muted)] whitespace-nowrap">
                            ₹
                            {Number(
                              budget.spent
                            ).toLocaleString(
                              "en-IN"
                            )}{" "}
                            / ₹
                            {Number(
                              budget.amount
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getBudgetColor(
                              budget.status
                            )}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  percentage
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              /* No budgets */
              <div className="mt-6 rounded-xl bg-[var(--surface2)] p-5 text-center">
                <CalendarDays
                  size={25}
                  className="mx-auto text-[var(--muted)]"
                />

                <p className="mt-3 text-sm font-semibold">
                  No budgets set
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Create category budgets to track
                  your spending limits.
                </p>
              </div>
            )}

            {/* Manage budgets */}
            <Link
              href="/budgets"
              className="mt-6 flex items-center justify-between rounded-xl bg-[var(--surface2)] p-3 text-xs font-semibold hover:bg-[var(--surface2)]/80 transition"
            >
              Manage budgets
              <ChevronRight size={15} />
            </Link>
          </div>
        </FadeIn>
      </div>

      {/* =========================
          ACTIVITY + INTELLIGENCE
      ========================== */}

      <div className="mt-5 grid xl:grid-cols-[1.35fr_1fr] gap-5">
        {/* =========================
            RECENT ACTIVITY
        ========================== */}

        <FadeIn delay={0.3}>
          <div className="card p-5">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">
                  Recent activity
                </h2>

                <p className="text-xs text-[var(--muted)] mt-1">
                  Your latest financial events
                </p>
              </div>

              <Link
                href="/transactions"
                className="text-xs font-semibold text-indigo-500"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[var(--border)]">
              {transactions.length > 0 ? (
                transactions.map(
                  (transaction) => {
                    const isIncome =
                      transaction.type ===
                      "income";

                    const isTransfer =
                      transaction.type ===
                      "transfer";

                    return (
                      <div
                        key={transaction._id}
                        className="py-3 flex items-center gap-3"
                      >
                        <div
                          className={`h-9 w-9 rounded-xl bg-[var(--surface2)] grid place-items-center ${getTransactionColor(
                            transaction.type
                          )}`}
                        >
                          {isIncome
                            ? "↑"
                            : isTransfer
                            ? "↔"
                            : "•"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {
                              transaction.merchant
                            }
                          </div>

                          <div className="text-[11px] text-[var(--muted)]">
                            {
                              transaction.category
                            }{" "}
                            ·{" "}
                            {formatRelativeDate(
                              transaction.date
                            )}
                          </div>
                        </div>

                        <div
                          className={`text-sm font-bold ${
                            isIncome
                              ? "text-emerald-500"
                              : isTransfer
                              ? "text-indigo-500"
                              : ""
                          }`}
                        >
                          {isIncome
                            ? "+"
                            : isTransfer
                            ? ""
                            : "-"}
                          ₹
                          {Number(
                            transaction.amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="py-10 text-center">
                  <WalletCards
                    size={28}
                    className="mx-auto text-[var(--muted)]"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    No transactions yet
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Add your first transaction to
                    get started.
                  </p>

                  <Link
                    href="/transactions"
                    className="inline-flex mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition"
                  >
                    Add transaction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* =========================
            INTELLIGENCE
        ========================== */}

        <FadeIn delay={0.35}>
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Sparkles
                size={17}
                className="text-indigo-500"
              />

              <h2 className="font-bold">
                Intelligence signals
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {anomalies.length ? (
                anomalies
                  .slice(0, 3)
                  .map((a) => (
                    <div
                      key={String(a._id)}
                      className="rounded-xl bg-orange-500/8 border border-orange-500/15 p-3"
                    >
                      <div className="flex gap-2 text-xs font-bold text-orange-500">
                        <AlertTriangle
                          size={14}
                        />
                        Unusual spending
                      </div>

                      <div className="mt-1 text-sm">
                        ₹
                        {a.amount?.toLocaleString(
                          "en-IN"
                        )}{" "}
                        at {a.merchant}
                      </div>

                      <div className="mt-1 text-[11px] text-[var(--muted)]">
                        Score{" "}
                        {a.anomalyScore} ·
                        indicator only
                      </div>
                    </div>
                  ))
              ) : (
                <>
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-3">
                    <div className="text-xs font-bold text-emerald-500">
                      ↗ Savings pattern
                    </div>

                    <div className="mt-1 text-sm">
                      Your savings rate is{" "}
                      {Number(
                        data.savingsRate
                      ).toFixed(1)}
                      % this month.
                    </div>
                  </div>

                  <div className="rounded-xl bg-cyan-500/8 border border-cyan-500/15 p-3">
                    <div className="text-xs font-bold text-cyan-500">
                      ◌ Data ready
                    </div>

                    <div className="mt-1 text-sm">
                      {data.transactionCount}{" "}
                      transactions are
                      available for analysis.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}