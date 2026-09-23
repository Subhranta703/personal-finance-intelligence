type TransactionType = "income" | "expense" | "transfer";

type PaymentMethod =
  | "cash"
  | "upi"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "other";

type CategoryRule = {
  category: string;
  keywords: string[];
  confidence: number;
};

/* -------------------------------------------------------
   CATEGORY RULES
------------------------------------------------------- */

const categoryRules: CategoryRule[] = [
  {
    category: "Food",
    keywords: [
      "swiggy",
      "zomato",
      "restaurant",
      "cafe",
      "food",
      "lunch",
      "dinner",
      "breakfast",
      "pizza",
      "burger",
      "kfc",
      "dominos",
      "mcdonald",
      "starbucks",
    ],
    confidence: 0.98,
  },

  {
    category: "Shopping",
    keywords: [
      "amazon",
      "flipkart",
      "myntra",
      "ajio",
      "shopping",
      "mall",
      "meesho",
    ],
    confidence: 0.98,
  },

  {
    category: "Transport",
    keywords: [
      "uber",
      "ola",
      "rapido",
      "transport",
      "fuel",
      "petrol",
      "diesel",
      "bus",
      "train",
      "metro",
      "taxi",
      "parking",
      "auto",
    ],
    confidence: 0.96,
  },

  {
    category: "Entertainment",
    keywords: [
      "movie",
      "cinema",
      "game",
      "gaming",
      "entertainment",
      "youtube",
      "concert",
    ],
    confidence: 0.92,
  },

  {
    category: "Subscriptions",
    keywords: [
      "netflix",
      "spotify",
      "prime",
      "hotstar",
      "disney",
      "subscription",
      "membership",
    ],
    confidence: 0.98,
  },

  {
    category: "Groceries",
    keywords: [
      "grocery",
      "groceries",
      "blinkit",
      "zepto",
      "bigbasket",
      "instamart",
      "dmart",
      "vegetables",
      "vegetable",
      "milk",
    ],
    confidence: 0.96,
  },

  {
    category: "Rent",
    keywords: [
      "rent",
      "house rent",
      "room rent",
      "flat rent",
    ],
    confidence: 0.98,
  },

  {
    category: "Utilities",
    keywords: [
      "electricity",
      "electricity bill",
      "water bill",
      "internet",
      "wifi",
      "mobile bill",
      "phone bill",
      "recharge",
      "bill",
      "jio",
      "airtel",
      "vi",
    ],
    confidence: 0.94,
  },

  {
    category: "Healthcare",
    keywords: [
      "hospital",
      "doctor",
      "medicine",
      "medical",
      "pharmacy",
      "healthcare",
      "clinic",
      "apollo",
    ],
    confidence: 0.96,
  },

  {
    category: "Education",
    keywords: [
      "school",
      "college",
      "course",
      "education",
      "exam",
      "book",
      "books",
      "udemy",
      "coursera",
    ],
    confidence: 0.94,
  },

  {
    category: "Travel",
    keywords: [
      "flight",
      "hotel",
      "travel",
      "trip",
      "airbnb",
      "booking",
      "makemytrip",
    ],
    confidence: 0.94,
  },

  {
    category: "Salary",
    keywords: [
      "salary",
      "paycheck",
      "pay cheque",
      "monthly salary",
    ],
    confidence: 0.99,
  },
];

/* -------------------------------------------------------
   MERCHANT NORMALIZATION
------------------------------------------------------- */

const merchantAliases: Record<string, string> = {
  swiggy: "Swiggy",
  zomato: "Zomato",

  amazon: "Amazon",
  flipkart: "Flipkart",
  myntra: "Myntra",
  ajio: "Ajio",
  meesho: "Meesho",

  uber: "Uber",
  ola: "Ola",
  rapido: "Rapido",

  netflix: "Netflix",
  spotify: "Spotify",
  prime: "Prime",
  hotstar: "Hotstar",

  blinkit: "Blinkit",
  zepto: "Zepto",
  bigbasket: "BigBasket",
  instamart: "Instamart",
  dmart: "DMart",

  jio: "Jio",
  airtel: "Airtel",
  vi: "Vi",

  apollo: "Apollo",

  salary: "Salary",
};

/* -------------------------------------------------------
   COMMON KEYWORDS
------------------------------------------------------- */

const incomeKeywords = [
  "salary",
  "credited",
  "received",
  "receive",
  "income",
  "bonus",
  "freelance",
  "freelancing",
  "refund",
  "cashback",
  "reimbursement",
  "paycheck",
  "paid me",
  "got paid",
  "payment received",
];

const transferKeywords = [
  "transfer",
  "transferred",
  "bank transfer",
  "self transfer",
  "moved to",
  "moved from",
  "sent to savings",
  "sent to bank",
];

const paymentMethodRules: {
  method: PaymentMethod;
  keywords: string[];
  confidence: number;
}[] = [
  {
    method: "upi",
    keywords: [
      "upi",
      "gpay",
      "google pay",
      "googlepay",
      "phonepe",
      "phone pe",
      "paytm",
      "bhim",
    ],
    confidence: 0.98,
  },

  {
    method: "cash",
    keywords: ["cash", "in cash", "cash payment"],
    confidence: 0.98,
  },

  {
    method: "credit_card",
    keywords: [
      "credit card",
      "creditcard",
      "cc",
    ],
    confidence: 0.98,
  },

  {
    method: "debit_card",
    keywords: [
      "debit card",
      "debitcard",
      "dc",
    ],
    confidence: 0.98,
  },

  {
    method: "bank_transfer",
    keywords: [
      "bank transfer",
      "neft",
      "rtgs",
      "imps",
    ],
    confidence: 0.98,
  },
];

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i").test(
    text
  );
}

/* -------------------------------------------------------
   CATEGORY DETECTION
------------------------------------------------------- */

export function categorize(input: string) {
  const text = normalizeText(input);

  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (containsKeyword(text, keyword)) {
        return {
          category: rule.category,
          confidence: rule.confidence,
        };
      }
    }
  }

  // Generic fallbacks
  if (
    /food|lunch|dinner|restaurant|cafe|breakfast/.test(text)
  ) {
    return {
      category: "Food",
      confidence: 0.82,
    };
  }

  if (
    /travel|fuel|petrol|diesel|bus|metro|taxi|transport/.test(
      text
    )
  ) {
    return {
      category: "Transport",
      confidence: 0.80,
    };
  }

  if (/movie|game|entertainment|cinema/.test(text)) {
    return {
      category: "Entertainment",
      confidence: 0.78,
    };
  }

  if (/bill|internet|mobile|wifi|recharge/.test(text)) {
    return {
      category: "Utilities",
      confidence: 0.78,
    };
  }

  return {
    category: "Other",
    confidence: 0.4,
  };
}

/* -------------------------------------------------------
   TRANSACTION TYPE
------------------------------------------------------- */

function detectTransactionType(
  text: string
): {
  type: TransactionType;
  confidence: number;
} {
  // Transfer should be checked first because
  // "transferred ₹500 to savings" is not an expense.
  for (const keyword of transferKeywords) {
    if (text.includes(keyword)) {
      return {
        type: "transfer",
        confidence: 0.96,
      };
    }
  }

  for (const keyword of incomeKeywords) {
    if (text.includes(keyword)) {
      return {
        type: "income",
        confidence: 0.96,
      };
    }
  }

  return {
    type: "expense",
    confidence: 0.82,
  };
}

/* -------------------------------------------------------
   PAYMENT METHOD
------------------------------------------------------- */

function detectPaymentMethod(text: string): {
  method: PaymentMethod;
  confidence: number;
} {
  for (const rule of paymentMethodRules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return {
          method: rule.method,
          confidence: rule.confidence,
        };
      }
    }
  }

  // Existing FinSight behavior:
  // assume UPI when no payment method is mentioned.
  return {
    method: "upi",
    confidence: 0.55,
  };
}

/* -------------------------------------------------------
   AMOUNT
------------------------------------------------------- */

function extractAmount(text: string) {
  /*
    Supports:

    ₹450
    ₹1,200
    Rs 450
    Rs. 450
    rs 450
    450
    450.50
  */

  const match = text.match(
    /(?:₹|rs\.?\s*)?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/i
  );

  if (!match) {
    return 0;
  }

  return Number(match[1].replace(/,/g, ""));
}

/* -------------------------------------------------------
   MERCHANT EXTRACTION
------------------------------------------------------- */

function extractMerchant(text: string) {
  let merchant = text;

  // Remove amount
  merchant = merchant.replace(
    /(?:₹|rs\.?\s*)?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?/gi,
    " "
  );

  // Remove payment method phrases
  merchant = merchant.replace(
    /\b(?:via|using|through)\s+(?:upi|gpay|google pay|googlepay|phonepe|phone pe|paytm|bhim|cash|credit card|debit card|bank transfer|neft|rtgs|imps)\b/gi,
    " "
  );

  merchant = merchant.replace(
    /\b(?:upi|gpay|google pay|googlepay|phonepe|phone pe|paytm|bhim)\b/gi,
    " "
  );

  merchant = merchant.replace(
    /\b(?:cash|credit card|creditcard|debit card|debitcard|bank transfer|neft|rtgs|imps)\b/gi,
    " "
  );

  // Remove transaction-type filler
  merchant = merchant.replace(
    /\b(?:expense|spent|spend|paid|payment|buy|bought|purchase|for)\b/gi,
    " "
  );

  merchant = merchant.replace(
    /\b(?:income|credited|credit|received|receive|salary|bonus|refund|cashback|reimbursement|freelance|freelancing|paycheck|pay cheque)\b/gi,
    " "
  );

  merchant = merchant.replace(
    /\b(?:transfer|transferred|moved|sent)\b/gi,
    " "
  );

  merchant = merchant.replace(
    /\b(?:to|from|at)\b/gi,
    " "
  );

  merchant = merchant
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!merchant) {
    return "Unknown";
  }

  return normalizeMerchant(merchant);
}

/* -------------------------------------------------------
   MERCHANT NORMALIZATION
------------------------------------------------------- */

export function normalizeMerchant(raw: string) {
  let s = normalizeText(raw)
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!s) {
    return "Unknown";
  }

  for (const [key, value] of Object.entries(merchantAliases)) {
    if (s.includes(key)) {
      return value;
    }
  }

  return (
    s.replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Unknown"
  );
}

/* -------------------------------------------------------
   QUICK PARSER
------------------------------------------------------- */

export function parseQuick(text: string) {
  const normalized = normalizeText(text);

  const amount = extractAmount(normalized);

  const typeInfo = detectTransactionType(normalized);

  const paymentInfo = detectPaymentMethod(normalized);

  const categoryInfo = categorize(normalized);

  const merchant = extractMerchant(normalized);

  /*
    Overall confidence is weighted:

    Category  = 40%
    Type      = 30%
    Payment   = 30%
  */

  const confidence =
    categoryInfo.confidence * 0.4 +
    typeInfo.confidence * 0.3 +
    paymentInfo.confidence * 0.3;

  return {
    amount,

    merchant,

    category: categoryInfo.category,

    type: typeInfo.type,

    paymentMethod: paymentInfo.method,

    confidence: Number(confidence.toFixed(2)),
  };
}