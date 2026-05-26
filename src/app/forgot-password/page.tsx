"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not send reset link.");
        return;
      }

      setMessage(
        data.message ??
          "If an account exists for that email, a reset link has been sent.",
      );
      setSubmitted(true);
    } catch {
      setError("Could not send reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="ui-panel p-8">
        <h1 className="ui-title text-2xl font-medium">forgot password</h1>
        <p className="ui-muted mt-2 text-sm">
          enter the email on your account. with Resend test mode, emails only
          deliver to your verified Resend address.
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <p className="ui-banner px-3 py-2 text-sm">
              {message}
            </p>
            <p className="ui-muted text-xs">
              check your inbox and spam folder. reset links expire in 1 hour.
            </p>
            <Link href="/login" className="ui-link text-sm">
              back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm">
                email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ui-input mt-1"
              />
            </div>

            {error && (
              <p className="border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="ui-btn ui-btn-accent w-full"
            >
              {busy ? "[ sending... ]" : "[ send reset link ]"}
            </button>
          </form>
        )}

        <p className="ui-muted mt-6 text-center text-sm">
          remember your password?{" "}
          <Link href="/login" className="ui-link">
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}
