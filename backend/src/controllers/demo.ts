import { Request, Response } from "express";
import { Transaction } from "../models/Transaction";

const merchants = [
  ["Swiggy", "Food"],
  ["Zomato", "Food"],
  ["Amazon", "Shopping"],
  ["Uber", "Transport"],
  ["Netflix", "Subscriptions"],
  ["Spotify", "Subscriptions"],
  ["Jio", "Utilities"],
  ["Blinkit", "Groceries"],
  ["Rent", "Rent"],
];

export async function loadDemo(req: Request, res: Response) {
  // Remove old demo data before loading new demo data
  await Transaction.deleteMany({
    userId: req.userId,
    isDemo: true,
  });

  const now = new Date();
  const docs: any[] = [];

  for (let m = 0; m < 6; m++) {
    for (let i = 0; i < 7; i++) {
      const [merchant, category] =
        merchants[(i + m) % merchants.length];

      docs.push({
        userId: req.userId,
        type: "expense",
        amount: Math.round(
          250 + ((i * 173 + m * 91) % 1600)
        ),
        category,
        merchant,
        description: `${merchant} demo transaction`,
        date: new Date(
          now.getFullYear(),
          now.getMonth() - m,
          2 + i * 3
        ),
        paymentMethod: i % 2 ? "upi" : "credit_card",
        source: "demo",

        // IMPORTANT
        isDemo: true,
      });
    }

    docs.push({
      userId: req.userId,
      type: "income",
      amount: 45000,
      category: "Salary",
      merchant: "Salary",
      description: "Monthly salary",
      date: new Date(
        now.getFullYear(),
        now.getMonth() - m,
        1
      ),
      paymentMethod: "bank_transfer",
      source: "demo",

      // IMPORTANT
      isDemo: true,
    });
  }

  await Transaction.insertMany(docs);

  res.json({
    count: docs.length,
    isDemo: true,
  });
}