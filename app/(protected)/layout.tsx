import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../components/app-shell";
import { TransactionsProvider } from "../components/transactions-provider";
import { createClient } from "../lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect("/auth/login");
  }

  return (
    <TransactionsProvider userId={data.claims.sub}>
      <AppShell>{children}</AppShell>
    </TransactionsProvider>
  );
}
