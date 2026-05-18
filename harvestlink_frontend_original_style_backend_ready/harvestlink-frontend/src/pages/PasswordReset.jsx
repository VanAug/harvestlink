import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiPost } from "../lib/api";

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [step, setStep] = useState(token ? "confirm" : "request");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function handleRequest(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      await apiPost("/auth/password-reset/request", { email: form.email });
      setMessage("If an account exists with that email, a reset link will be sent.");
      setForm({ email: "", password: "", confirmPassword: "" });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      await apiPost("/auth/password-reset/confirm", {
        token,
        new_password: form.password,
      });
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-md px-4 py-12 lg:px-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-black text-harvest-green mb-2">Reset Password</h1>
          <p className="text-gray-600 mb-6">
            {step === "request" ? "Enter your email to receive a reset link" : "Enter your new password"}
          </p>

          {message && (
            <div className={`mb-6 rounded-xl p-3 text-sm ${message.includes("Error") || message.includes("not match") ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"}`}>
              {message}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter new password"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </PageShell>
  );
}
