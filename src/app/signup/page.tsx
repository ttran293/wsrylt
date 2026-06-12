"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
} from "@/lib/validation/username-constants";

type UsernameCheckResult = {
  error?: string;
  name: string;
  valid: boolean;
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const trimmedName = name.trim();
  const hasUsername = trimmedName.length > 0;
  const usernameLengthValid =
    trimmedName.length >= MIN_USERNAME_LENGTH &&
    trimmedName.length <= MAX_USERNAME_LENGTH;
  const currentUsernameCheck =
    usernameCheck?.name === trimmedName ? usernameCheck : null;
  const usernameChecking =
    hasUsername && usernameLengthValid && !currentUsernameCheck;
  const usernameValid =
    usernameLengthValid && currentUsernameCheck?.valid === true;
  const usernameFeedback = !hasUsername
    ? ""
    : !usernameLengthValid
      ? `Username must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters.`
      : usernameChecking
        ? "checking username..."
        : currentUsernameCheck?.valid
          ? "username is available"
          : currentUsernameCheck?.error ?? "Username is invalid.";
  const usernameFeedbackClass = currentUsernameCheck?.valid
    ? "text-accent"
    : usernameChecking
      ? "ui-muted"
      : "text-red-300";
  const emailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const passwordValid =
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    password === confirmPassword;

  useEffect(() => {
    if (!trimmedName || !usernameLengthValid) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/username?name=${encodeURIComponent(trimmedName)}`,
        );
        const data = (await response.json().catch(() => null)) as {
          valid?: boolean;
          error?: string;
        } | null;

        if (cancelled) {
          return;
        }

        if (!response.ok || !data?.valid) {
          setUsernameCheck({
            name: trimmedName,
            valid: false,
            error: data?.error ?? "Username is invalid.",
          });
          return;
        }

        setUsernameCheck({ name: trimmedName, valid: true });
      } catch {
        if (!cancelled) {
          setUsernameCheck({
            name: trimmedName,
            valid: false,
            error: "Could not check username.",
          });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedName, usernameLengthValid]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!usernameLengthValid) {
      setError(`Username must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters.`);
      return;
    }

    if (!usernameValid) {
      setError(usernameFeedback || "Username is invalid.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Signup failed.");
        return;
      }

      const result = await signIn("credentials", {
        name: trimmedName,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/post");
      router.refresh();
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="ui-panel p-8">
        <h1 className="ui-title text-2xl font-medium">sign up</h1>
        <p className="ui-muted mt-2 text-sm">
          create an account to share music with the community.
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
              minLength={MIN_USERNAME_LENGTH}
              maxLength={MAX_USERNAME_LENGTH}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="ui-input mt-1"
            />
            {usernameFeedback && (
              <p className={`mt-1 text-xs ${usernameFeedbackClass}`}>
                {usernameFeedback}
              </p>
            )}
          </div>

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

          <div>
            <label htmlFor="confirm" className="block text-sm">
              confirm password
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
            <li className={usernameLengthValid ? "text-accent" : ""}>
              username is {MIN_USERNAME_LENGTH}-{MAX_USERNAME_LENGTH} characters
            </li>
            <li className={usernameValid ? "text-accent" : ""}>
              username is allowed and available
            </li>
            <li className={password.length >= 6 ? "text-accent" : ""}>
              at least 6 characters
            </li>
            <li className={/[A-Z]/.test(password) ? "text-accent" : ""}>
              one uppercase letter
            </li>
            <li className={/[0-9]/.test(password) ? "text-accent" : ""}>
              one number
            </li>
            <li
              className={
                password === confirmPassword && confirmPassword
                  ? "text-accent"
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
            disabled={busy || !usernameValid || !emailValid || !passwordValid}
            className="ui-btn ui-btn-accent w-full"
          >
            {busy ? "[ creating account... ]" : "[ sign up ]"}
          </button>
        </form>

        <p className="ui-muted mt-6 text-center text-sm">
          already have an account?{" "}
          <Link href="/login" className="ui-link">
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}
