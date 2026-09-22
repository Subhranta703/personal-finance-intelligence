
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "../../lib/api";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, don't show registration page.
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

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      toast.success("Account created successfully!");

      router.replace("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Registration failed."
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
      <div className="hidden lg:flex bg-gradient-to-br from-[#0B1220] via-[#111827] to-indigo-950 text-white p-12 flex-col justify-between">
        <div className="font-bold text-xl">
          ◈ FinSight
        </div>

        <div>
          <p className="text-indigo-300 font-semibold text-sm">
            START WITH YOUR DATA
          </p>

          <div className="mt-3 text-5xl font-black leading-tight">
            Build a clearer
            <br />
            financial picture.
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Your demo data is synthetic and removable.
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
            Create your account
          </h1>

          <p className="mt-2 text-[var(--muted)]">
            Start exploring your financial patterns.
          </p>

          {/* Name */}
          <label className="block mt-8 text-sm font-semibold">
            Name

            <input
              required
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          {/* Email */}
          <label className="block mt-5 text-sm font-semibold">
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
          <label className="block mt-5 text-sm font-semibold">
            Password

            <input
              required
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-500 py-3.5 text-white font-bold transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          <p className="mt-5 text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-500 font-semibold hover:text-indigo-600"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

