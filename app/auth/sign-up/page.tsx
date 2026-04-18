import { redirect } from "next/navigation";
import { AuthForm } from "../../components/auth-form";
import { createClient } from "../../lib/supabase/server";

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/");
  }

  return <AuthForm mode="signup" />;
}
