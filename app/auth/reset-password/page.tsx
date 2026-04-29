import { Suspense } from "react";
import { ResetPasswordView } from "../../components/reset-password-view";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordView />
    </Suspense>
  );
}
