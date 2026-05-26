"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await signIn("credentials", {
        name,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("uh oh ~ we could not log you in");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="ui-panel p-8">
        <h1 className="ui-title text-2xl font-medium">log in</h1>
        <p className="ui-muted mt-2 text-sm">
          welcome back. sign in to share and interact.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {resetSuccess && (
            <p className="ui-banner px-3 py-2 text-sm">
              Password updated. Sign in with your username or email and new
              password.
            </p>
          )}

          <div>
            <label htmlFor="name" className="block text-sm">
              username or email
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ui-input mt-1"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm">
              password
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

          <p className="text-right text-sm">
            <Link href="/forgot-password" className="ui-link">
              forgot password?
            </Link>
          </p>

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
            {busy ? "[ logging in... ]" : "[ log in ]"}
          </button>
        </form>

        <p className="ui-muted mt-6 text-center text-sm">
          no account?{" "}
          <Link href="/signup" className="ui-link">
            sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md ui-panel p-8">loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
