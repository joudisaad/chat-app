import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface RegisterResponseOk {
  accessToken: string;
  user: { id: string; email: string; name: string };
  team: { id: string; name: string; publicKey?: string | null } | null;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);

    if (!name.trim()) {
      setFormError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!password) {
      setPasswordError("Please choose a password.");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password should be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = (await res.json().catch(() => null)) as
        | RegisterResponseOk
        | { message?: string }
        | null;

      if (!res.ok) {
        const msg = data?.message || "Unable to create your account. Please try again.";
        if (msg.toLowerCase().includes("email already in use")) {
          setEmailError("This email is already in use. Try logging in instead.");
        } else {
          setFormError(msg);
        }
        return;
      }

      const okData = data as RegisterResponseOk;

      // Store token (same key as login page uses)
      if (okData.accessToken) {
        localStorage.setItem("CHATAPP_TOKEN", okData.accessToken);
      }

      // Optional: you could also persist user/team in localStorage if your app expects it

      // Redirect to dashboard
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Register error", err);
      setFormError("Unexpected error while creating your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              CHAT APP
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-50">Create your workspace</h1>
          <p className="mt-2 text-sm text-slate-400">
            One account to manage all your conversations, agents and inboxes.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl shadow-emerald-500/10 p-6">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 hover:border-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="bg-white rounded-full p-1">
              <svg
                className="w-4 h-4"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6 1.54 7.38 2.83l5.42-5.3C33.64 3.8 29.4 2 24 2 14.82 2 7.09 7.99 4.24 16.17l6.91 5.37C12.41 14.26 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.5 24.5c0-1.57-.14-3.08-.4-4.5H24v9h12.7c-.55 2.83-2.18 5.23-4.65 6.84l7.33 5.69C43.96 37.35 46.5 31.39 46.5 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M11.15 28.04A14.5 14.5 0 0 1 10 24c0-1.4.22-2.76.6-4.04l-6.9-5.37A21.9 21.9 0 0 0 2 24c0 3.56.85 6.92 2.35 9.9l6.8-5.86z"
                />
                <path
                  fill="#34A853"
                  d="M24 46c5.4 0 9.93-1.78 13.24-4.84l-7.33-5.69C28.28 36.62 26.3 37.5 24 37.5c-6.26 0-11.57-4.74-12.85-11.04l-6.91 5.37C7.1 40.02 14.82 46 24 46z"
                />
              </svg>
            </span>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">
                or create with email
              </span>
            </div>
          </div>

          {formError && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Full name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Saad"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Work email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full rounded-xl border bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                  emailError
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/80"
                    : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
                }`}
                placeholder="you@company.com"
              />
              {emailError && (
                <p className="text-[11px] text-red-300 mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full rounded-xl border bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                  passwordError
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/80"
                    : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
                }`}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`block w-full rounded-xl border bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 ${
                  passwordError
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/80"
                    : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
                }`}
                placeholder="Repeat your password"
              />
              {passwordError && (
                <p className="text-[11px] text-red-300 mt-1">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating your workspace..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
