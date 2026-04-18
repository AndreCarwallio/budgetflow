"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const content = authContent[mode];

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
                setErrorMessage(authResponse.error.message);
                return;
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

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              required
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              placeholder="Enter your password"
            />
          </label>

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
            {isPending ? "Working..." : content.submitLabel}
          </button>
        </form>

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
