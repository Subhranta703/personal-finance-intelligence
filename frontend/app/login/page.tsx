
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "../../lib/api";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, don't show the login page.
  useEffect(() => {
    async function checkAuth() {
      try {
        await api.get("/auth/me");
        router.replace("/dashboard");
      } catch {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      toast.success("Welcome back!");

      router.replace("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-sm text-[var(--muted)]">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Section */}
      <div className="hidden lg:flex bg-[#0B1220] text-white p-12 flex-col justify-between">
        <div className="font-bold text-xl">
          ◈ FinSight
        </div>

        <div>
          <div className="text-5xl font-black tracking-tight leading-tight">
            Your money,
            <br />
            <span className="text-cyan-400">decoded.</span>
          </div>

          <p className="mt-5 text-slate-400 max-w-md leading-relaxed">
            A transparent finance intelligence workspace built with
            deterministic algorithms.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          No paid AI dependency · MERN · TypeScript
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={submit}
          className="w-full max-w-md"
        >
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Back
          </Link>

          <h1 className="mt-10 text-3xl font-black">
            Welcome back
          </h1>

          <p className="mt-2 text-[var(--muted)]">
            Sign in to your FinSight workspace.
          </p>

          {/* Email */}
          <label className="block mt-8 text-sm font-semibold">
            Email

            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          {/* Password */}
          <label className="block mt-4 text-sm font-semibold">
            Password

            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-500 py-3.5 text-white font-bold transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-[var(--muted)]">
            New here?{" "}
            <Link
              href="/register"
              className="text-indigo-500 font-semibold hover:text-indigo-600"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

