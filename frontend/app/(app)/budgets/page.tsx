"use client";

import { useEffect, useMemo, useState } from "react";
import FeaturePage from "../../../components/FeaturePage";
import { FadeIn } from "../../../components/Motion";
import {
BarChart3,
PieChart,
Trash2,
Pencil,
Plus,
AlertTriangle,
CheckCircle2,
CircleDollarSign,
} from "lucide-react";
import {
ResponsiveContainer,
BarChart,
Bar,
PieChart as RechartsPieChart,
Pie,
Cell,
Tooltip,
XAxis,
YAxis,
} from "recharts";
import { api } from "../../../lib/api";
import { toast } from "sonner";

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

const COLORS = [
"#F59E0B",
"#06B6D4",
"#10B981",
"#6366F1",
"#F43F5E",
"#14B8A6",
"#F97316",
];

const DEFAULT_CATEGORIES = [
"Food",
"Shopping",
"Transport",
"Entertainment",
"Groceries",
"Rent",
"Utilities",
"Subscriptions",
"Health",
"Education",
"Travel",
"Other",
];

export default function Budgets() {
const [budgets, setBudgets] = useState<Budget[]>([]);
const [loading, setLoading] = useState(true);

const [showForm, setShowForm] = useState(false);

const [category, setCategory] = useState("");
const [amount, setAmount] = useState("");
const [threshold, setThreshold] = useState("80");

const [editingId, setEditingId] = useState<string | null>(
null
);

const [chartType, setChartType] = useState<
"bar" | "pie" | "donut"

> ("bar");

const [saving, setSaving] = useState(false);

const currentMonth = new Date()
.toISOString()
.slice(0, 7);

async function loadBudgets() {
try {
setLoading(true);


  const response = await api.get(
    `/budgets?month=${currentMonth}`
  );

  setBudgets(response.data || []);
} catch (error) {
  console.error("Failed to load budgets:", error);

  toast.error("Unable to load budgets");
} finally {
  setLoading(false);
}


}

useEffect(() => {
loadBudgets();
}, []);

function resetForm() {
setCategory("");
setAmount("");
setThreshold("80");
setEditingId(null);
setShowForm(false);
}

function editBudget(budget: Budget) {
setCategory(budget.category);
setAmount(String(budget.amount));
setThreshold(String(budget.threshold));
setEditingId(budget._id);
setShowForm(true);
}

async function saveBudget(
event: React.FormEvent
) {
event.preventDefault();


if (!category) {
  toast.error("Please select a category");
  return;
}

if (!amount || Number(amount) <= 0) {
  toast.error("Enter a valid monthly budget");
  return;
}

try {
  setSaving(true);

  await api.post("/budgets", {
    category,
    month: currentMonth,
    amount: Number(amount),
    threshold: Number(threshold),
  });

  toast.success(
    editingId
      ? "Budget updated"
      : "Budget created"
  );

  resetForm();
  await loadBudgets();
} catch (error: any) {
  console.error("Save budget error:", error);

  toast.error(
    error?.response?.data?.message ||
      "Failed to save budget"
  );
} finally {
  setSaving(false);
}


}

async function deleteBudget(id: string) {
const confirmed = window.confirm(
"Delete this budget?"
);


if (!confirmed) return;

try {
  await api.delete(`/budgets/${id}`);

  toast.success("Budget deleted");

  await loadBudgets();
} catch (error) {
  console.error("Delete budget error:", error);

  toast.error("Failed to delete budget");
}


}

const chartData = useMemo(() => {
return budgets.map((budget) => ({
category: budget.category,
spent: Math.round(budget.spent),
budget: Math.round(budget.amount),
remaining: Math.round(
Math.max(budget.amount - budget.spent, 0)
),
}));
}, [budgets]);

const totalBudget = budgets.reduce(
(sum, budget) => sum + budget.amount,
0
);

const totalSpent = budgets.reduce(
(sum, budget) => sum + budget.spent,
0
);

const totalRemaining = Math.max(
totalBudget - totalSpent,
0
);

return ( <FeaturePage
   eyebrow="Guardrails"
   title="Budgets"
   description="Set category limits and see how much of your plan has been used."
 >
{/* =========================
SUMMARY
========================== */}

  <div className="grid sm:grid-cols-3 gap-4 mb-5">
    <FadeIn>
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 grid place-items-center">
            <CircleDollarSign
              size={19}
              className="text-indigo-500"
            />
          </div>

          <div>
            <p className="text-xs text-[var(--muted)]">
              Total budget
            </p>

            <p className="mt-1 text-xl font-black">
              ₹
              {Math.round(
                totalBudget
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.05}>
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 grid place-items-center">
            <BarChart3
              size={19}
              className="text-orange-500"
            />
          </div>

          <div>
            <p className="text-xs text-[var(--muted)]">
              Total spent
            </p>

            <p className="mt-1 text-xl font-black">
              ₹
              {Math.round(
                totalSpent
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.1}>
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center">
            <CheckCircle2
              size={19}
              className="text-emerald-500"
            />
          </div>

          <div>
            <p className="text-xs text-[var(--muted)]">
              Remaining
            </p>

            <p className="mt-1 text-xl font-black">
              ₹
              {Math.round(
                totalRemaining
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  </div>

  {/* =========================
      ADD / EDIT BUDGET
  ========================== */}

  <FadeIn>
    <div className="card p-5 mb-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">
            {editingId
              ? "Edit budget"
              : "Set your monthly budgets"}
          </h2>

          <p className="text-xs text-[var(--muted)] mt-1">
            Decide how much you want to spend in each
            category.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition"
          >
            <Plus size={16} />
            Add budget
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={saveBudget}
          className="mt-5 grid md:grid-cols-4 gap-3"
        >
          <div>
            <label className="text-xs font-semibold text-[var(--muted)]">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">
                Select category
              </option>

              {DEFAULT_CATEGORIES.map(
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

          <div>
            <label className="text-xs font-semibold text-[var(--muted)]">
              Monthly limit
            </label>

            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="₹5000"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)]">
              Alert at %
            </label>

            <input
              type="number"
              min="1"
              max="100"
              value={threshold}
              onChange={(e) =>
                setThreshold(e.target.value)
              }
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Save"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  </FadeIn>

  {/* =========================
      BUDGET CARDS
  ========================== */}

  {loading ? (
    <div className="grid lg:grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-48 rounded-2xl bg-[var(--surface2)] animate-pulse"
        />
      ))}
    </div>
  ) : budgets.length === 0 ? (
    <div className="card p-10 text-center">
      <CircleDollarSign
        size={34}
        className="mx-auto text-[var(--muted)]"
      />

      <h3 className="mt-4 font-bold">
        No budgets yet
      </h3>

      <p className="mt-1 text-sm text-[var(--muted)]">
        Create a monthly budget for categories you
        want to control.
      </p>

      <button
        onClick={() => setShowForm(true)}
        className="mt-5 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition"
      >
        Create your first budget
      </button>
    </div>
  ) : (
    <div className="grid lg:grid-cols-2 gap-5">
      {budgets.map((budget, i) => {
        const percentage = Math.min(
          budget.percentage,
          100
        );

        const color =
          budget.status === "over"
            ? "bg-rose-500"
            : budget.status === "warning"
              ? "bg-amber-500"
              : "bg-emerald-500";

        return (
          <FadeIn
            key={budget._id}
            delay={i * 0.05}
          >
            <div className="card p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold">
                      {budget.category}
                    </div>

                    {budget.status ===
                      "warning" && (
                      <AlertTriangle
                        size={15}
                        className="text-amber-500"
                      />
                    )}

                    {budget.status ===
                      "over" && (
                      <AlertTriangle
                        size={15}
                        className="text-rose-500"
                      />
                    )}
                  </div>

                  <div className="text-xs text-[var(--muted)] mt-1">
                    Monthly limit
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold">
                    ₹
                    {Math.round(
                      budget.spent
                    ).toLocaleString("en-IN")}{" "}
                    / ₹
                    {Math.round(
                      budget.amount
                    ).toLocaleString("en-IN")}
                  </div>

                  <div
                    className={`text-[11px] mt-1 font-semibold ${
                      budget.status === "over"
                        ? "text-rose-500"
                        : budget.status ===
                            "warning"
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {budget.status ===
                    "over"
                      ? "Over budget"
                      : budget.status ===
                          "warning"
                        ? "Near limit"
                        : "On track"}
                  </div>
                </div>
              </div>

              <div className="mt-5 h-3 rounded-full bg-[var(--surface2)] overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-[var(--muted)]">
                <span>
                  {Math.round(
                    budget.percentage
                  )}
                  % used
                </span>

                <span>
                  ₹
                  {Math.round(
                    budget.remaining
                  ).toLocaleString("en-IN")}{" "}
                  remaining
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() =>
                    editBudget(budget)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface2)] transition"
                >
                  <Pencil size={13} />
                  Edit
                </button>

                <button
                  onClick={() =>
                    deleteBudget(budget._id)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </FadeIn>
        );
      })}
    </div>
  )}

  {/* =========================
      CHARTS
  ========================== */}

  {budgets.length > 0 && (
    <FadeIn delay={0.2}>
      <div className="card p-5 mt-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">
              Spending visualization
            </h2>

            <p className="text-xs text-[var(--muted)] mt-1">
              Compare your actual spending with your
              monthly limits.
            </p>
          </div>

          <div className="flex rounded-xl border border-[var(--border)] p-1">
            <button
              onClick={() =>
                setChartType("bar")
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                chartType === "bar"
                  ? "bg-indigo-500 text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface2)]"
              }`}
            >
              <BarChart3 size={14} />
              Bar
            </button>

            <button
              onClick={() =>
                setChartType("pie")
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                chartType === "pie"
                  ? "bg-indigo-500 text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface2)]"
              }`}
            >
              <PieChart size={14} />
              Pie
            </button>

            <button
              onClick={() =>
                setChartType("donut")
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                chartType === "donut"
                  ? "bg-indigo-500 text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface2)]"
              }`}
            >
              <PieChart size={14} />
              Donut
            </button>
          </div>
        </div>

        <div className="mt-7 h-[350px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <XAxis
                  dataKey="category"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value: any) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Bar
                  dataKey="budget"
                  name="Budget"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="spent"
                  name="Spent"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : (
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  dataKey="spent"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={
                    chartType === "donut"
                      ? 70
                      : 0
                  }
                  paddingAngle={3}
                  label
                >
                  {chartData.map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(value: any) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />
              </RechartsPieChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-center text-xs text-[var(--muted)]">
          {chartType === "bar"
            ? "Budget vs actual spending by category"
            : "Actual spending distribution by category"}
        </div>
      </div>
    </FadeIn>
  )}
</FeaturePage>


);
}
