import React, { useState } from "react";
import { API_URL } from "../../lib/api";

type Step = "login" | "twofa";

interface LoginSuccessPayload {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
    publicKey?: string | null;
  } | null;
}

interface TwoFaResponse {
  twoFactorRequired: true;
  tempToken: string;
}

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Unable to log in");
      }

      // 2FA required: go to the second step
      if (
        (data as TwoFaResponse).twoFactorRequired &&
        (data as TwoFaResponse).tempToken
      ) {
        setTempToken((data as TwoFaResponse).tempToken);
        setStep("twofa");
        setTwoFaCode("");
        return;
      }

      // classic login success
      handleFinalLogin(data as LoginSuccessPayload);
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tempToken, code: twoFaCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invalid code");
      }

      handleFinalLogin(data as LoginSuccessPayload);
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalLogin = (payload: LoginSuccessPayload) => {
    // Persist token
    if (payload.accessToken) {
      localStorage.setItem("CHATAPP_TOKEN", payload.accessToken);
    }

    // Force a full reload so App.tsx re-reads the token and shows the dashboard
    window.location.reload();
  };

  const handleGoogleLogin = () => {
    // redirect to backend Google OAuth flow
    window.location.href = `${API_URL}/auth/google`;
  };

  const isLoginStep = step === "login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to ChatApp
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Use your account to access the inbox dashboard.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 rounded-2xl p-6 space-y-6">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white">
              <span className="text-xs">G</span>
            </span>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span>
              {isLoginStep ? "or sign in with email" : "2-step verification"}
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-500">
              {error}
            </div>
          )}

          {/* Step 1: email + password */}
          {isLoginStep && (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center items-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2.5 shadow-sm shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              {/* 👉 Link to register */}
              <p className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/register";
                  }}
                  className="text-emerald-500 hover:text-emerald-400 font-medium"
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Step 2: 2FA */}
          {!isLoginStep && (
            <form className="space-y-4" onSubmit={handleTwoFaSubmit}>
              <div className="space-y-1.5 text-center">
                <p className="text-sm font-medium">Enter the 6-digit code</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open your authenticator app and type the code for ChatApp.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Authentication code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={twoFaCode}
                  onChange={(e) =>
                    setTwoFaCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="tracking-[0.5em] text-center text-lg w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center items-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2.5 shadow-sm shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Verifying..." : "Verify & continue"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setTwoFaCode("");
                  setTempToken(null);
                  setError(null);
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mt-1"
              >
                ← Back to email login
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          By continuing you agree to the{" "}
          <span className="underline decoration-dotted decoration-slate-400">
            Terms of service
          </span>{" "}
          and{" "}
          <span className="underline decoration-dotted decoration-slate-400">
            Privacy policy
          </span>
          .
        </p>
      </div>
    </div>
  );
};

export default LoginPage;