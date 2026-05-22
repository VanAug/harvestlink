import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { apiPost } from "../../lib/api";
import { Input } from "../forms/Input";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [email, setEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [redirectPath, setRedirectPath] = useState("/login");

  useEffect(() => {
    const role = localStorage.getItem("harvestlink_role");
    if (role === "buyer") setRedirectPath("/buyer-dashboard");
    else if (role === "exporter") setRedirectPath("/exporter-dashboard");
    else if (role === "finance_partner") setRedirectPath("/financing");
    else if (role === "admin") setRedirectPath("/admin-dashboard");
    else setRedirectPath("/login");
  }, []);

  useEffect(() => {
    async function verify() {
      if (!token) return;
      try {
        await apiPost("/auth/email/verify", { token });
        setMessage("✓ Email verified successfully! Redirecting...");
        setIsVerifying(false);
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 2000);
      } catch (error) {
        setMessage(`✗ Verification failed: ${error.message}`);
        setIsVerifying(false);
      }
    }
    verify();
  }, [token, redirectPath]);

  async function requestVerificationLink(event) {
    event.preventDefault();
    setRequestMessage("");
    setRequestError("");
    if (!email) {
      setRequestError("Enter your email to request a verification link.");
      return;
    }
    setRequesting(true);
    try {
      const data = await apiPost("/auth/email/verify-request", { email });
      setRequestMessage(`Verification link sent to ${data.email}. Check your inbox.`);
      setEmail("");
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setRequesting(false);
    }
  }

  const showRequestForm = !token || (!isVerifying && message.includes("Verification failed"));

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

          {showRequestForm && (
            <form onSubmit={requestVerificationLink} className="mt-5 space-y-4">
              <Input
                required
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <button
                type="submit"
                disabled={requesting}
                className="w-full rounded-2xl bg-harvest-green px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {requesting ? "Sending..." : "Request verification link"}
              </button>
            </form>
          )}
          {!token && !message && !showRequestForm && (
            <div className="text-gray-600">
              <p className="mb-4">Check your email for the verification link.</p>
              <p className="text-sm">If you don't see it, check your spam folder.</p>
            </div>
          )}
          {requestMessage && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-900">
              {requestMessage}
            </div>
          )}
          {requestError && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900">
              {requestError}
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            Already have a verification token? Use the link from your email, or return to the{" "}
            <Link className="font-bold text-harvest-green" to="/login">
              login page
            </Link>.
          </div>
        </div>
      </main>
    </PageShell>
  );
}
