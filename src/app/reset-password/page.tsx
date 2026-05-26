"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const passwordValid =
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    password === confirmPassword;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setError("Could not reset password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-4">
        <p className="border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          Invalid or missing reset link.
        </p>
        <Link href="/forgot-password" className="ui-link text-sm">
          request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm">
          new password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="ui-input mt-1"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm">
          confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="ui-input mt-1"
        />
      </div>

      <ul className="ui-muted space-y-1 text-xs">
        <li className={password.length >= 6 ? "text-[var(--accent)]" : ""}>
          at least 6 characters
        </li>
        <li className={/[A-Z]/.test(password) ? "text-[var(--accent)]" : ""}>
          one uppercase letter
        </li>
        <li className={/[0-9]/.test(password) ? "text-[var(--accent)]" : ""}>
          one number
        </li>
        <li
          className={
            password === confirmPassword && confirmPassword
              ? "text-[var(--accent)]"
              : ""
          }
        >
          passwords match
        </li>
      </ul>

      {error && (
        <p className="border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !passwordValid}
        className="ui-btn ui-btn-accent w-full"
      >
        {busy ? "[ updating... ]" : "[ reset password ]"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="ui-panel p-8">
        <h1 className="ui-title text-2xl font-medium">reset password</h1>
        <p className="ui-muted mt-2 text-sm">
          choose a new password for your account.
        </p>

        <Suspense fallback={<p className="ui-muted mt-6 text-sm">loading...</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="ui-muted mt-6 text-center text-sm">
          <Link href="/login" className="ui-link">
            back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
