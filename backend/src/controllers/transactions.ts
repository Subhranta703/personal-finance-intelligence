import { Request, Response } from "express";
import { Transaction } from "../models/Transaction";
import {
  parseQuick,
  categorize,
  normalizeMerchant,
} from "../algorithms/categorize";
import { z } from "zod";

const input = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive(),
  category: z.string().min(1).optional(),
  merchant: z.string().min(1),
  description: z.string().optional(),
  date: z.coerce.date(),
  paymentMethod: z
    .enum([
      "cash",
      "upi",
      "credit_card",
      "debit_card",
      "bank_transfer",
      "other",
    ])
    .default("upi"),
  notes: z.string().optional(),
});

/* =========================================================
   LIST TRANSACTIONS
========================================================= */

export async function list(req: Request, res: Response) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "").trim();
    const category = String(req.query.category || "").trim();

    const filter: any = {
      userId: req.userId,
    };

    if (q) {
      const escapedQuery = q.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        {
          merchant: {
            $regex: escapedQuery,
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedQuery,
            $options: "i",
          },
        },
        {
          category: {
            $regex: escapedQuery,
            $options: "i",
          },
        },
      ];
    }

    if (
      type === "income" ||
      type === "expense" ||
      type === "transfer"
    ) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Transaction.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List transactions error:", error);

    res.status(500).json({
      message: "Failed to load transactions",
    });
  }
}

/* =========================================================
   QUICK PREVIEW

   IMPORTANT:
   This uses the SAME parseQuick() function as quick().
   Therefore the preview represents what will actually
   be saved.
========================================================= */

export async function quickPreview(req: Request, res: Response) {
  try {
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({
        message: "Enter a transaction",
      });
    }

    const parsed = parseQuick(text);

    if (!parsed.amount) {
      return res.status(422).json({
        message: "Could not detect an amount",
        preview: null,
      });
    }

    const amount = Number(parsed.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(422).json({
        message: "Invalid transaction amount",
        preview: null,
      });
    }

    res.json({
      preview: {
        amount,
        merchant: parsed.merchant,
        category: parsed.category,
        type: parsed.type,
        paymentMethod: parsed.paymentMethod,
        confidence: parsed.confidence,
      },
    });
  } catch (error) {
    console.error("Quick preview error:", error);

    res.status(500).json({
      message: "Could not generate preview",
    });
  }
}

/* =========================================================
   CREATE TRANSACTION
========================================================= */

export async function create(
  req: Request,
  res: Response
) {
  try {
    const p = input.parse(req.body);

    const cat =
      p.category ||
      categorize(
        `${p.merchant} ${p.description || ""}`
      ).category;

    const merchant = normalizeMerchant(p.merchant);

    const hasDemoData = await Transaction.exists({
      userId: req.userId,
      isDemo: true,
    });

    if (hasDemoData) {
      await Transaction.deleteMany({
        userId: req.userId,
        isDemo: true,
      });
    }

    const t = await Transaction.create({
      ...p,
      userId: req.userId,
      category: cat,
      merchant,
      isDemo: false,
    });

    res.status(201).json(t);
  } catch (error) {
    console.error("Create transaction error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid transaction data",
        errors: error.flatten(),
      });
    }

    res.status(500).json({
      message: "Failed to create transaction",
    });
  }
}

/* =========================================================
   QUICK ADD
========================================================= */

export async function quick(req: Request, res: Response) {
  try {
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(422).json({
        message: "Enter a transaction",
      });
    }

    const parsed = parseQuick(text);

    if (!parsed.amount) {
      return res.status(422).json({
        message: "Enter an amount, e.g. ₹450 Swiggy",
      });
    }

    const hasDemoData = await Transaction.exists({
      userId: req.userId,
      isDemo: true,
    });

    if (hasDemoData) {
      await Transaction.deleteMany({
        userId: req.userId,
        isDemo: true,
      });
    }

    const t = await Transaction.create({
      userId: req.userId,

      type: parsed.type,

      amount: parsed.amount,

      category: parsed.category,

      merchant: parsed.merchant,

      description: text,

      date: new Date(),

      paymentMethod: parsed.paymentMethod,

      source: "quick-add",

      confidence: parsed.confidence,

      isDemo: false,
    });

    res.status(201).json(t);
  } catch (error) {
    console.error("Quick transaction error:", error);

    res.status(500).json({
      message: "Failed to add transaction",
    });
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function update(
  req: Request,
  res: Response
) {
  try {
    const p = input.partial().parse(req.body);

    const t = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      p,
      {
        new: true,
      }
    );

    if (!t) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(t);
  } catch (error) {
    console.error("Update transaction error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid transaction data",
        errors: error.flatten(),
      });
    }

    res.status(500).json({
      message: "Failed to update transaction",
    });
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function remove(
  req: Request,
  res: Response
) {
  try {
    const t = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!t) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Deleted",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

    res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
}