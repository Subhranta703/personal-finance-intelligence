import { Request, Response } from "express";
import { Types } from "mongoose";
import { Transaction } from "../models/Transaction";
import { Budget } from "../models/Budget";
import { anomalies, overview } from "../services/analytics";
import { detectRecurring } from "../algorithms/recurring";
import { movingAverage, weightedMovingAverage } from "../utils/stats";
import { parseIntent } from "../algorithms/assistant";





export async function getOverview(
  req: Request,
  res: Response
) {
  res.json(await overview(req.userId!));
}

export async function getAnomalies(
  req: Request,
  res: Response
) {
  res.json(await anomalies(req.userId!));
}

export async function getRecurring(
  req: Request,
  res: Response
) {
  const tx = await Transaction.find({
    userId: req.userId,
    type: "expense",
  }).lean();

  res.json(
    detectRecurring(
      tx.map((x) => ({
        merchant: x.merchant,
        amount: x.amount,
        date: x.date,
      }))
    )
  );
}

export async function getForecast(
  req: Request,
  res: Response
) {
  const tx = await Transaction.find({
    userId: req.userId,
    type: "expense",
  }).lean();

  const monthly = new Map<string, number>();

  for (const t of tx) {
    const d = new Date(t.date);

    const key = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;

    monthly.set(
      key,
      (monthly.get(key) || 0) + t.amount
    );
  }

  const values = [...monthly.entries()]
    .sort()
    .slice(-6);

  const nums = values.map((x) => x[1]);

  res.json({
    history: values.map(
      ([month, value]) => ({
        month,
        value,
      })
    ),

    nextMonth: Math.round(
      movingAverage(nums)
    ),

    weightedNext: Math.round(
      weightedMovingAverage(nums)
    ),

    method:
      "Moving average / weighted moving average",
  });
}

/*
 * ================================
 * BUDGETS
 * ================================
 */

export async function getBudgets(req: Request, res: Response) {
  try {
    const month = String(
      req.query.month || new Date().toISOString().slice(0, 7)
    );

    const [year, monthNumber] = month.split("-").map(Number);

    if (
      !year ||
      !monthNumber ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return res.status(400).json({
        message: "Invalid month. Use YYYY-MM",
      });
    }

    const start = new Date(year, monthNumber - 1, 1);
    const end = new Date(year, monthNumber, 1);

    /*
     * IMPORTANT:
     * MongoDB stores userId as ObjectId.
     * req.userId is a string.
     */
    const userId = new Types.ObjectId(req.userId);

    // Get budgets for this user/month
    const budgets = await Budget.find({
      userId,
      month,
    })
      .sort({ category: 1 })
      .lean();

    // Calculate actual spending by category
    const spending = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: {
            $gte: start,
            $lt: end,
          },
        },
      },
      {
        $group: {
          _id: "$category",
          spent: {
            $sum: "$amount",
          },
        },
      },
    ]);

    /*
     * Convert aggregation result into:
     *
     * Food -> 6200
     * Transport -> 2600
     */
    const spendingMap = new Map<string, number>();

    for (const item of spending) {
      spendingMap.set(
        String(item._id),
        Number(item.spent || 0)
      );
    }

    /*
     * Combine budget + actual spending
     */
    const result = budgets.map((budget: any) => {
      const spent =
        spendingMap.get(String(budget.category)) || 0;

      const limit = Number(budget.amount);

      const percentage =
        limit > 0
          ? (spent / limit) * 100
          : 0;

      const remaining =
        Math.max(limit - spent, 0);

      let status:
        | "healthy"
        | "warning"
        | "over" = "healthy";

      if (spent > limit) {
        status = "over";
      } else if (
        percentage >= Number(budget.threshold || 80)
      ) {
        status = "warning";
      }

      return {
        _id: budget._id,
        category: budget.category,
        month: budget.month,

        // Budget limit
        amount: limit,

        // Actual spending
        spent,

        // Remaining budget
        remaining,

        // Percentage used
        percentage:
          Math.round(percentage * 10) / 10,

        threshold: Number(
          budget.threshold || 80
        ),

        status,

        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Get budgets error:", error);

    res.status(500).json({
      message: "Failed to load budgets",
    });
  }
}

export async function assistant(
  req: Request,
  res: Response
) {
  const q = String(
    req.body.question || ""
  );

  const p = parseIntent(q);

  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const tx = await Transaction.find({
    userId: req.userId,
    type: "expense",
    date: {
      $gte: start,
    },
  }).lean();

  if (
    p.intent === "CATEGORY_SPENDING" &&
    p.category
  ) {
    const amount = tx
      .filter(
        (t) =>
          t.category.toLowerCase() ===
          p.category!.toLowerCase()
      )
      .reduce(
        (s, t) => s + t.amount,
        0
      );

    return res.json({
      answer: `You spent ₹${Math.round(
        amount
      ).toLocaleString(
        "en-IN"
      )} on ${
        p.category
      } this month.`,

      intent: p,
    });
  }

  if (
    p.intent ===
    "LARGEST_EXPENSES"
  ) {
    const top = [...tx]
      .sort(
        (a, b) =>
          b.amount - a.amount
      )
      .slice(0, 5);

    return res.json({
      answer: top.length
        ? `Your largest expense this month was ₹${top[0].amount.toLocaleString(
            "en-IN"
          )} at ${
            top[0].merchant
          }.`
        : "No expense data yet.",

      items: top,
    });
  }

  return res.json({
    answer:
      "I can answer questions about category spending, largest expenses, subscriptions, month comparisons, and savings scenarios.",

    intent: p,
  });
}