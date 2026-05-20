import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { apiPost } from "../../lib/api";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(!!token);

  useEffect(() => {
    async function verify() {
      if (!token) return;
      try {
        await apiPost("/auth/email/verify", { token });
        setMessage("✓ Email verified successfully! Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/buyer-dashboard";
        }, 2000);
      } catch (error) {
        setMessage(`✗ Verification failed: ${error.message}`);
        setIsVerifying(false);
      }
    }
    verify();
  }, [token]);

  return (
    <PageShell>
      <main className="mx-auto max-w-md px-4 py-12 lg:px-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft text-center">
          <h1 className="text-3xl font-black text-harvest-green mb-4">Email Verification</h1>

          {isVerifying && (
            <div className="space-y-4">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-harvest-green border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {message && (
            <div className={`rounded-xl p-4 text-sm ${message.includes("✓") ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
              {message}
            </div>
          )}

          {!token && !message && (
            <div className="text-gray-600">
              <p className="mb-4">Check your email for the verification link.</p>
              <p className="text-sm">If you don't see it, check your spam folder.</p>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
