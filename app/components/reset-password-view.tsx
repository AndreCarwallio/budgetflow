"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "../lib/supabase/client";

export function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const hashParams =
        typeof window === "undefined"
          ? new URLSearchParams()
          : new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          if (typeof window !== "undefined" && window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (error) {
            throw error;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Your password reset link is invalid or has expired.");
        }

        if (isActive) {
          setIsReady(true);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Your password reset link is invalid or has expired."
          );
        }
      }
    }

    void prepareRecoverySession();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] px-5 py-10">
      <section className="w-full max-w-md rounded-[32px] border border-line bg-surface p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
          BudgetFlow
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Reset password
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Enter your new password below to finish resetting your account.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage("");
            setInfoMessage("");

            if (password !== confirmPassword) {
              setErrorMessage("Passwords do not match.");
              return;
            }

            startTransition(async () => {
              const supabase = createClient();
              const { error } = await supabase.auth.updateUser({
                password,
              });

              if (error) {
                setErrorMessage(error.message);
                return;
              }

              setInfoMessage("Your password has been updated. Redirecting to login...");

              setTimeout(() => {
                router.push("/auth/login");
                router.refresh();
              }, 1200);
            });
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">New password</span>
            <div className="relative">
              <input
                required
                disabled={!isReady || isPending}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 pr-20 text-sm text-slate-950 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Enter a new password"
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
              Confirm password
            </span>
            <div className="relative">
              <input
                required
                disabled={!isReady || isPending}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 pr-20 text-sm text-slate-950 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Confirm your new password"
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
            disabled={!isReady || isPending}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isPending ? "Saving..." : "Update password"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Remembered it?{" "}
          <Link href="/auth/login" className="font-semibold text-accent">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
