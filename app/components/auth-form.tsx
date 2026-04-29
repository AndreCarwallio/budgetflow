"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  savePendingStartingBalance,
} from "../lib/starting-balance-onboarding";
import { createClient } from "../lib/supabase/client";

type AuthMode = "login" | "signup";

const authContent = {
  login: {
    eyebrow: "BudgetFlow",
    title: "Welcome back",
    description: "Sign in to access your budgeting dashboard and transaction history.",
    submitLabel: "Log in",
    alternateLabel: "Need an account?",
    alternateHref: "/auth/sign-up",
    alternateAction: "Sign up",
  },
  signup: {
    eyebrow: "BudgetFlow",
    title: "Create your account",
    description: "Set up your account to start tracking budgets, transactions, and reports.",
    submitLabel: "Create account",
    alternateLabel: "Already have an account?",
    alternateHref: "/auth/login",
    alternateAction: "Log in",
  },
} as const;

function getFriendlyAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("password")) {
    return message;
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  return message;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [skipStartingBalance, setSkipStartingBalance] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const content = authContent[mode];

  const passwordInputType = isPasswordVisible ? "text" : "password";
  const parsedStartingBalance = Number.parseFloat(startingBalance);
  const normalizedStartingBalance = Number.isFinite(parsedStartingBalance)
    ? parsedStartingBalance
    : 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] px-5 py-10">
      <section className="w-full max-w-md rounded-[32px] border border-line bg-surface p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {content.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{content.description}</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage("");
            setInfoMessage("");

            if (isResetMode && mode === "login") {
              startTransition(async () => {
                const supabase = createClient();
                const resetResponse = await supabase.auth.resetPasswordForEmail(
                  email,
                  {
                    redirectTo:
                      typeof window === "undefined"
                        ? undefined
                        : `${window.location.origin}/auth/reset-password`,
                  }
                );

                if (resetResponse.error) {
                  setErrorMessage(
                    "We couldn’t send a password reset email right now. Please try again."
                  );
                  return;
                }

                setInfoMessage(
                  "If an account exists for that email, a password reset link has been sent."
                );
                setIsResetMode(false);
              });
              return;
            }

            if (mode === "signup" && password !== confirmPassword) {
              setErrorMessage("Passwords do not match.");
              return;
            }

            startTransition(async () => {
              const supabase = createClient();
              const authResponse =
                mode === "login"
                  ? await supabase.auth.signInWithPassword({
                      email,
                      password,
                    })
                  : await supabase.auth.signUp({
                      email,
                      password,
                    });

              if (authResponse.error) {
                setErrorMessage(getFriendlyAuthErrorMessage(authResponse.error.message));
                return;
              }

              if (mode === "signup") {
                savePendingStartingBalance({
                  amount:
                    skipStartingBalance || startingBalance.trim().length === 0
                      ? 0
                      : normalizedStartingBalance,
                  skipped:
                    skipStartingBalance || startingBalance.trim().length === 0,
                });
              }

              if (mode === "signup" && !authResponse.data.session) {
                setInfoMessage(
                  "Account created. Check your email to confirm your account before signing in."
                );
                return;
              }

              router.push("/");
              router.refresh();
            });
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              placeholder="you@example.com"
            />
          </label>

          {!isResetMode ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <input
                  required
                  type={passwordInputType}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 pr-20 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {isPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
            </label>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-muted">
              Enter your email address and we&apos;ll send a password reset link. If
              the account exists, the email will be sent.
            </div>
          )}

          {mode === "signup" ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Confirm password
                </span>
                <div className="relative">
                  <input
                    required
                    type={passwordInputType}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 pr-20 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {isPasswordVisible ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Starting balance
                </span>
                <input
                  type="number"
                  step="0.01"
                  disabled={skipStartingBalance}
                  value={startingBalance}
                  onChange={(event) => setStartingBalance(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="0.00"
                />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="text-muted">
                    You can enter this later in Settings.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSkipStartingBalance = !skipStartingBalance;
                      setSkipStartingBalance(nextSkipStartingBalance);

                      if (nextSkipStartingBalance) {
                        setStartingBalance("");
                      }
                    }}
                    className="font-semibold text-accent"
                  >
                    {skipStartingBalance ? "Use a balance" : "Skip"}
                  </button>
                </div>
              </label>
            </>
          ) : null}

          {errorMessage ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {infoMessage ? (
            <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {infoMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isPending
              ? "Working..."
              : isResetMode && mode === "login"
                ? "Send reset link"
                : content.submitLabel}
          </button>
        </form>

        {mode === "login" ? (
          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setInfoMessage("");
              setIsResetMode((current) => !current);
            }}
            className="mt-4 text-sm font-semibold text-accent"
          >
            {isResetMode ? "Back to login" : "Forgot password?"}
          </button>
        ) : null}

        <p className="mt-6 text-sm text-muted">
          {content.alternateLabel}{" "}
          <Link href={content.alternateHref} className="font-semibold text-accent">
            {content.alternateAction}
          </Link>
        </p>
      </section>
    </main>
  );
}
