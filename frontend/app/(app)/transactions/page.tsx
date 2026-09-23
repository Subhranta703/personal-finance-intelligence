"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../../../lib/api";
import FeaturePage from "../../../components/FeaturePage";
import { FadeIn } from "../../../components/Motion";

import {
  Plus,
  Search,
  Trash2,
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Loader2,
  Pencil,
} from "lucide-react";

import { toast } from "sonner";

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

type QuickPreview = {
  amount: number;
  merchant: string;
  category: string;
  type: "income" | "expense" | "transfer";
  paymentMethod:
    | "cash"
    | "upi"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "other";
  confidence: number;
};

type EditForm = {
  type: "income" | "expense" | "transfer";
  amount: string;
  category: string;
  merchant: string;
  description: string;
  date: string;
  paymentMethod:
    | "cash"
    | "upi"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "other";
};

const categories = [
  "Food",
  "Shopping",
  "Transport",
  "Entertainment",
  "Groceries",
  "Rent",
  "Utilities",
  "Subscriptions",
  "Health",
  "Healthcare",
  "Education",
  "Travel",
  "Salary",
  "Other",
];

const PAGE_SIZE = 20;

export default function Transactions() {
  const [items, setItems] = useState<Transaction[]>([]);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* Quick Add */
  const [quick, setQuick] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] =
    useState<QuickPreview | null>(null);
  const [previewLoading, setPreviewLoading] =
    useState(false);

  /* Edit */
  const [editing, setEditing] =
    useState<Transaction | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm>({
      type: "expense",
      amount: "",
      category: "Other",
      merchant: "",
      description: "",
      date: "",
      paymentMethod: "upi",
    });

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  /* =====================================================
     LOAD TRANSACTIONS
  ===================================================== */

  async function load(targetPage = page) {
    setFetching(true);

    try {
      const r = await api.get("/transactions", {
        params: {
          q: q.trim() || undefined,
          type: type || undefined,
          category: category || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        },
      });

      setItems(r.data.items || []);
      setTotal(Number(r.data.total || 0));
      setTotalPages(Number(r.data.totalPages || 0));
      setPage(Number(r.data.page || targetPage));
    } catch {
      setItems([]);
      setTotal(0);
      setTotalPages(0);

      toast.error("Could not load transactions");
    } finally {
      setFetching(false);
    }
  }

  /* =====================================================
     SEARCH / FILTER CHANGE
  ===================================================== */

  useEffect(() => {
    setPage(1);

    const timer = setTimeout(() => {
      load(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [q, type, category]);

  /* =====================================================
     QUICK PREVIEW
  ===================================================== */

  useEffect(() => {
    if (!quick) {
      return;
    }

    const value = text.trim();

    if (!value) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);

      try {
        const response = await api.post(
          "/transactions/quick/preview",
          {
            text: value,
          }
        );

        setPreview(
          response.data.preview || null
        );
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [text, quick]);

  /* =====================================================
     QUICK ADD
  ===================================================== */

  function openQuickAdd() {
    setText("");
    setPreview(null);
    setQuick(true);
  }

  function closeQuickAdd() {
    if (loading) return;

    setQuick(false);
    setText("");
    setPreview(null);
  }

  async function add(e: FormEvent) {
    e.preventDefault();

    const value = text.trim();

    if (!value) {
      toast.error("Enter a transaction");
      return;
    }

    if (!preview) {
      toast.error(
        "Enter something like ₹450 Swiggy"
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/transactions/quick", {
        text: value,
      });

      toast.success("Transaction added");

      closeQuickAdd();

      setPage(1);

      await load(1);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Could not add transaction"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     EDIT TRANSACTION
  ===================================================== */

  function openEdit(transaction: Transaction) {
    const date = new Date(transaction.date);

    const localDate =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;

    setEditing(transaction);

    setEditForm({
      type: transaction.type,
      amount: String(transaction.amount),
      category: transaction.category || "Other",
      merchant: transaction.merchant || "",
      description: transaction.description || "",
      date: localDate,
      paymentMethod:
        (transaction.paymentMethod as EditForm["paymentMethod"]) ||
        "upi",
    });
  }

  function closeEdit() {
    if (savingEdit) return;

    setEditing(null);
  }

  function updateEditField(
    field: keyof EditForm,
    value: string
  ) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveEdit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!editing) return;

    const amount = Number(editForm.amount);

    if (!editForm.merchant.trim()) {
      toast.error("Merchant is required");
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Amount must be greater than 0"
      );
      return;
    }

    if (!editForm.category) {
      toast.error("Select a category");
      return;
    }

    if (!editForm.date) {
      toast.error("Select a date");
      return;
    }

    setSavingEdit(true);

    try {
      await api.put(
        `/transactions/${editing._id}`,
        {
          type: editForm.type,
          amount,
          category: editForm.category,
          merchant: editForm.merchant.trim(),
          description:
            editForm.description.trim() || undefined,
          date: new Date(
            `${editForm.date}T12:00:00`
          ).toISOString(),
          paymentMethod:
            editForm.paymentMethod,
        }
      );

      toast.success(
        "Transaction updated successfully"
      );

      closeEdit();

      await load(page);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Could not update transaction"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function del(id: string) {
    try {
      await api.delete(
        `/transactions/${id}`
      );

      toast.success(
        "Transaction deleted"
      );

      if (
        items.length === 1 &&
        page > 1
      ) {
        changePage(page - 1);
      } else {
        load(page);
      }
    } catch {
      toast.error(
        "Could not delete"
      );
    }
  }

  /* =====================================================
     CHANGE PAGE
  ===================================================== */

  function changePage(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      fetching
    ) {
      return;
    }

    setPage(nextPage);

    load(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  function clearFilters() {
    setQ("");
    setType("");
    setCategory("");
  }

  const hasFilters = Boolean(
    q || type || category
  );

  /* =====================================================
     SUMMARY
  ===================================================== */

  const summary = useMemo(() => {
    const income = items
      .filter(
        (t) => t.type === "income"
      )
      .reduce(
        (sum, t) =>
          sum + Number(t.amount),
        0
      );

    const expense = items
      .filter(
        (t) => t.type === "expense"
      )
      .reduce(
        (sum, t) =>
          sum + Number(t.amount),
        0
      );

    return {
      income,
      expense,
      count: items.length,
    };
  }, [items]);

  /* =====================================================
     PAGE NUMBERS
  ===================================================== */

  function getPageNumbers() {
    if (totalPages <= 1) {
      return [];
    }

    const pages: (
      | number
      | "..."
    )[] = [];

    if (totalPages <= 7) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (page > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      page - 1
    );

    const end = Math.min(
      totalPages - 1,
      page + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (
      page <
      totalPages - 2
    ) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }

  const pageNumbers =
    getPageNumbers();

  const startItem =
    total === 0
      ? 0
      : (page - 1) *
          PAGE_SIZE +
        1;

  const endItem = Math.min(
    page * PAGE_SIZE,
    total
  );

  /* =====================================================
     QUICK ADD HELPERS
  ===================================================== */

  function getConfidenceLabel(
    confidence: number
  ) {
    if (confidence >= 0.8) {
      return "High confidence";
    }

    if (confidence >= 0.5) {
      return "Medium confidence";
    }

    return "Low confidence";
  }

  function getConfidenceWidth(
    confidence: number
  ) {
    return `${Math.max(
      10,
      Math.min(
        100,
        confidence * 100
      )
    )}%`;
  }

  function formatPaymentMethod(
    value: string
  ) {
    const map: Record<
      string,
      string
    > = {
      upi: "UPI",
      cash: "Cash",
      credit_card:
        "Credit Card",
      debit_card:
        "Debit Card",
      bank_transfer:
        "Bank Transfer",
      other: "Other",
    };

    return (
      map[value?.toLowerCase()] ||
      value ||
      "UPI"
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <FeaturePage
      eyebrow="Money movement"
      title="Transactions"
      description="Capture, search and understand every transaction with transparent categorization logic."
      action={
        <button
          onClick={openQuickAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
        >
          <Plus size={16} />
          Add transaction
        </button>
      }
    >
      {/* =================================================
          QUICK ADD MODAL
      ================================================= */}

      {quick && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeQuickAdd();
            }
          }}
        >
          <FadeIn>
            <form
              onSubmit={add}
              className="card w-full max-w-xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                      <Sparkles size={18} />
                    </div>

                    <h2 className="text-xl font-bold">
                      Quick add
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Type naturally and FinSight
                    will automatically extract
                    the transaction details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeQuickAdd}
                  className="rounded-xl p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Transaction
                </label>

                <div className="relative mt-2">
                  <input
                    autoFocus
                    value={text}
                    onChange={(e) =>
                      setText(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="₹450 Swiggy"
                    disabled={loading}
                  />

                  {previewLoading && (
                    <Loader2
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500"
                    />
                  )}
                </div>

                <div className="text-xs text-slate-500">
  Try:
  <span className="ml-1 text-slate-400">
    ₹450 Swiggy
  </span>

  <span className="ml-2 text-slate-400">
    ₹1200 Amazon via UPI
  </span>

  <span className="ml-2 text-slate-400">
    ₹300 Uber cash
  </span>

  <span className="ml-2 text-slate-400">
    ₹50000 salary credited
  </span>
</div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Parsed preview
                  </span>

                  {preview && (
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2
                        size={14}
                      />
                      Ready to add
                    </span>
                  )}
                </div>

                {previewLoading ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface2)] p-5">
                    <div className="flex items-center gap-3">
                      <Loader2
                        size={20}
                        className="animate-spin text-indigo-500"
                      />

                      <div>
                        <div className="text-sm font-semibold">
                          Understanding
                          transaction...
                        </div>

                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Detecting amount,
                          merchant and category
                        </div>
                      </div>
                    </div>
                  </div>
                ) : preview ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface2)] p-5">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <WalletCards size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-bold">
                          {preview.merchant}
                        </div>

                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {preview.category} ·{" "}
                          {preview.type}
                        </div>
                      </div>

                      <div className="text-lg font-bold">
                        -₹
                        {preview.amount.toLocaleString(
                          "en-IN"
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          Category
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {preview.category}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          <CreditCard size={12} />
                          Payment
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {formatPaymentMethod(
                            preview.paymentMethod
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          Type
                        </div>

                        <div className="mt-1 text-sm font-semibold capitalize">
                          {preview.type}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--muted)]">
                          Parsing confidence
                        </span>

                        <span className="font-semibold">
                          {getConfidenceLabel(
                            preview.confidence
                          )}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{
                            width:
                              getConfidenceWidth(
                                preview.confidence
                              ),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : text.trim() ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />

                      <div>
                        <div className="text-sm font-semibold">
                          Couldn't understand
                          this transaction
                        </div>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Include an amount and
                          merchant, for example:
                          <span className="font-medium">
                            {" "}
                            ₹450 Swiggy
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface2)] p-6 text-center">
                    <Sparkles
                      size={22}
                      className="mx-auto text-indigo-500"
                    />

                    <div className="mt-2 text-sm font-semibold">
                      Start typing
                    </div>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Example: ₹450 Swiggy
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  disabled={loading}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--surface2)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    loading ||
                    previewLoading ||
                    !preview
                  }
                  className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {loading
                    ? "Adding..."
                    : "Add transaction"}
                </button>
              </div>
            </form>
          </FadeIn>
        </div>
      )}

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeEdit();
            }
          }}
        >
          <FadeIn>
            <form
              onSubmit={saveEdit}
              className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
            >
              {/* Header */}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                      <Pencil size={17} />
                    </div>

                    <h2 className="text-xl font-bold">
                      Edit transaction
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Correct the transaction details
                    below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--surface2)]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                {/* Type */}

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Type
                  </label>

                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      updateEditField(
                        "type",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="expense">
                      Expense
                    </option>

                    <option value="income">
                      Income
                    </option>

                    <option value="transfer">
                      Transfer
                    </option>
                  </select>
                </div>

                {/* Amount */}

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) =>
                      updateEditField(
                        "amount",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Merchant */}

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Merchant
                  </label>

                  <input
                    value={editForm.merchant}
                    onChange={(e) =>
                      updateEditField(
                        "merchant",
                        e.target.value
                      )
                    }
                    placeholder="Swiggy"
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category */}

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Category
                  </label>

                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      updateEditField(
                        "category",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    {categories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Date */}

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Date
                  </label>

                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      updateEditField(
                        "date",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Payment */}

                <div>
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Payment method
                  </label>

                  <select
                    value={
                      editForm.paymentMethod
                    }
                    onChange={(e) =>
                      updateEditField(
                        "paymentMethod",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="upi">
                      UPI
                    </option>

                    <option value="cash">
                      Cash
                    </option>

                    <option value="credit_card">
                      Credit Card
                    </option>

                    <option value="debit_card">
                      Debit Card
                    </option>

                    <option value="bank_transfer">
                      Bank Transfer
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                {/* Description */}

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Description
                  </label>

                  <textarea
                    value={
                      editForm.description
                    }
                    onChange={(e) =>
                      updateEditField(
                        "description",
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Optional description..."
                    className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Actions */}

              <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-5">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={savingEdit}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--surface2)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  disabled={savingEdit}
                  className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  {savingEdit && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {savingEdit
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </form>
          </FadeIn>
        </div>
      )}

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="card overflow-hidden">

        {/* Search + Filters */}

        <div className="border-b border-[var(--border)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            <div className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
              <Search
                size={17}
                className="shrink-0 text-[var(--muted)]"
              />

              <input
                value={q}
                onChange={(e) =>
                  setQ(e.target.value)
                }
                placeholder="Search merchant, category or description…"
                className="flex-1 bg-transparent text-sm outline-none"
              />

              {q && (
                <button
                  onClick={() => setQ("")}
                  className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface2)]"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">

              <div className="relative">
                <SlidersHorizontal
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />

                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target.value
                    )
                  }
                  className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-9 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">
                    All types
                  </option>

                  <option value="expense">
                    Expense
                  </option>

                  <option value="income">
                    Income
                  </option>

                  <option value="transfer">
                    Transfer
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
              </div>

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 pr-9 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">
                    All categories
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
              </div>

              {hasFilters && (
                <button
                  onClick={
                    clearFilters
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface2)]"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span>
              {fetching
                ? "Loading transactions…"
                : total > 0
                ? `Showing ${startItem}-${endItem} of ${total} transactions`
                : "0 transactions"}
            </span>

            {hasFilters && (
              <div className="flex flex-wrap gap-2">
                {q && (
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-500">
                    Search: {q}
                  </span>
                )}

                {type && (
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 capitalize text-indigo-500">
                    Type: {type}
                  </span>
                )}

                {category && (
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-500">
                    Category:{" "}
                    {category}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}

        {items.length > 0 && (
          <div className="grid grid-cols-2 border-b border-[var(--border)] sm:grid-cols-3">
            <div className="p-4">
              <div className="text-xs text-[var(--muted)]">
                This page
              </div>

              <div className="mt-1 text-lg font-bold">
                {summary.count}
              </div>
            </div>

            <div className="border-l border-[var(--border)] p-4">
              <div className="text-xs text-[var(--muted)]">
                Income
              </div>

              <div className="mt-1 text-lg font-bold text-emerald-500">
                +₹
                {summary.income.toLocaleString(
                  "en-IN"
                )}
              </div>
            </div>

            <div className="col-span-2 border-t border-[var(--border)] p-4 sm:col-span-1 sm:border-l sm:border-t-0">
              <div className="text-xs text-[var(--muted)]">
                Expenses
              </div>

              <div className="mt-1 text-lg font-bold">
                -₹
                {summary.expense.toLocaleString(
                  "en-IN"
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transaction list */}

        <div className="divide-y divide-[var(--border)]">
          {fetching ? (
            <div className="p-14 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

              <p className="mt-4 text-sm text-[var(--muted)]">
                Loading transactions...
              </p>
            </div>
          ) : items.length ? (
            items.map((t) => (
              <div
                key={t._id}
                className="flex items-center gap-3 p-4 transition hover:bg-[var(--surface2)]"
              >
                {/* Icon */}

                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    t.type ===
                    "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : t.type ===
                        "transfer"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-indigo-500/10 text-indigo-500"
                  }`}
                >
                  {t.type ===
                  "income" ? (
                    <ArrowDownLeft
                      size={18}
                    />
                  ) : t.type ===
                    "transfer" ? (
                    <ArrowUpRight
                      size={18}
                    />
                  ) : (
                    <WalletCards
                      size={18}
                    />
                  )}
                </div>

                {/* Details */}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {t.merchant}
                  </div>

                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {t.category} ·{" "}
                    {new Date(
                      t.date
                    ).toLocaleDateString()}
                  </div>

                  {t.description &&
                    t.description !==
                      t.merchant && (
                      <div className="mt-1 truncate text-xs text-[var(--muted)]">
                        {t.description}
                      </div>
                    )}
                </div>

                {/* Amount */}

                <div
                  className={`shrink-0 text-sm font-semibold ${
                    t.type ===
                    "income"
                      ? "text-emerald-500"
                      : t.type ===
                        "transfer"
                      ? "text-amber-500"
                      : "text-[var(--text)]"
                  }`}
                >
                  {t.type ===
                  "income"
                    ? "+"
                    : t.type ===
                      "expense"
                    ? "-"
                    : ""}
                  ₹
                  {Number(
                    t.amount
                  ).toLocaleString(
                    "en-IN"
                  )}
                </div>

                {/* Edit */}

                <button
                  onClick={() =>
                    openEdit(t)
                  }
                  className="shrink-0 rounded-lg p-2 text-[var(--muted)] transition hover:bg-indigo-500/10 hover:text-indigo-500"
                  aria-label="Edit transaction"
                  title="Edit transaction"
                >
                  <Pencil
                    size={16}
                  />
                </button>

                {/* Delete */}

                <button
                  onClick={() =>
                    del(t._id)
                  }
                  className="shrink-0 rounded-lg p-2 text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Delete transaction"
                  title="Delete transaction"
                >
                  <Trash2
                    size={16}
                  />
                </button>
              </div>
            ))
          ) : (
            <div className="p-14 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <WalletCards />
              </div>

              <h3 className="mt-4 font-bold">
                {hasFilters
                  ? "No matching transactions"
                  : "No transactions yet"}
              </h3>

              <p className="mt-1 text-sm text-[var(--muted)]">
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Add your first transaction to get started."}
              </p>

              {hasFilters && (
                <button
                  onClick={
                    clearFilters
                  }
                  className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              disabled={
                page === 1 ||
                fetching
              }
              onClick={() =>
                changePage(
                  page - 1
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface2)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft
                size={16}
              />
              Previous
            </button>

            <div className="flex items-center justify-center gap-1">
              {pageNumbers.map(
                (item, index) =>
                  item === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="px-2 text-sm text-[var(--muted)]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() =>
                        changePage(
                          item
                        )
                      }
                      disabled={
                        fetching
                      }
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition ${
                        page === item
                          ? "bg-indigo-500 text-white"
                          : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                      }`}
                    >
                      {item}
                    </button>
                  )
              )}
            </div>

            <button
              disabled={
                page ===
                  totalPages ||
                fetching
              }
              onClick={() =>
                changePage(
                  page + 1
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface2)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight
                size={16}
              />
            </button>
          </div>
        )}
      </div>
    </FeaturePage>
  );
}