"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
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
        setError("Invalid credentials. Could not log you in.");
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
          <div>
            <label htmlFor="name" className="block text-sm">
              username
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
