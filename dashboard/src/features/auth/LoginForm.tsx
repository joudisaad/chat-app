import React from "react";
import type { Theme } from "../../App";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  theme: Theme;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, theme }) => {
  const [email, setEmail] = React.useState("saad@example.com");
  const [password, setPassword] = React.useState("test1234");
  const isDark = theme === "dark";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        w-full max-w-sm mx-auto p-6 rounded-2xl
        shadow-xl border
        transition-colors duration-200
        flex flex-col gap-4
        backdrop-blur-sm
        ${isDark ? "bg-slate-900/60 border-slate-700" : "bg-white/70 border-slate-300"}
      `}
    >
      <h2
        className={`
          text-xl font-semibold text-center mb-2
          transition-colors
          ${isDark ? "text-slate-100" : "text-slate-900"}
        `}
      >
        Welcome Back
      </h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={`
          w-full px-4 py-2 rounded-xl
          border text-sm
          focus:ring-2 focus:outline-none
          transition
          ${isDark ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-white text-slate-900 border-slate-300"}
        `}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className={`
          w-full px-4 py-2 rounded-xl
          border text-sm
          focus:ring-2 focus:outline-none
          transition
          ${isDark ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-white text-slate-900 border-slate-300"}
        `}
      />

      <button
        type="submit"
        className="
          w-full py-2 rounded-xl font-medium
          bg-emerald-500 hover:bg-emerald-600 
          transition text-white
          shadow-sm
        "
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;