import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { env } from "../config/env";

/* -------------------------------------------------------
   VALIDATION
------------------------------------------------------- */

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

/* -------------------------------------------------------
   COOKIE OPTIONS
------------------------------------------------------- */

const isProduction = env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,

  /*
   * Local:
   *   sameSite = lax
   *
   * Production:
   *   Vercel → Render
   *   requires cross-site cookie support.
   */
  sameSite: isProduction ? ("none" as const) : ("lax" as const),

  secure: isProduction,

  maxAge: 7 * 24 * 60 * 60 * 1000,

  path: "/",
};

/* -------------------------------------------------------
   REGISTER
------------------------------------------------------- */

export async function register(
  req: Request,
  res: Response
) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message:
          parsed.error.issues[0]?.message ||
          "Invalid registration details",
      });
    }

    const { name, email, password } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists. Please log in instead.",
        code: "EMAIL_EXISTS",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign(
      {
        id: user._id.toString(),
      },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie(
      "finsight_token",
      token,
      cookieOptions
    );

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message:
        "Unable to create your account right now. Please try again.",
    });
  }
}

/* -------------------------------------------------------
   LOGIN
------------------------------------------------------- */

export async function login(
  req: Request,
  res: Response
) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message:
          parsed.error.issues[0]?.message ||
          "Invalid login details",
      });
    }

    const { email, password } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message:
          "No account was found with this email address.",
        code: "USER_NOT_FOUND",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message:
          "Incorrect password. Please try again or reset your password.",
        code: "INVALID_PASSWORD",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
      },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie(
      "finsight_token",
      token,
      cookieOptions
    );

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message:
        "Unable to log you in right now. Please try again.",
    });
  }
}

/* -------------------------------------------------------
   LOGOUT
------------------------------------------------------- */

export function logout(
  _req: Request,
  res: Response
) {
  res.clearCookie(
    "finsight_token",
    cookieOptions
  );

  return res.json({
    message: "Logged out successfully",
  });
}

/* -------------------------------------------------------
   CURRENT USER
------------------------------------------------------- */

export async function me(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }

    const user = await User.findById(
      req.userId
    ).select("name email");

    if (!user) {
      return res.status(404).json({
        message: "User account no longer exists.",
        code: "USER_NOT_FOUND",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message:
        "Unable to verify your session. Please try again.",
    });
  }
}