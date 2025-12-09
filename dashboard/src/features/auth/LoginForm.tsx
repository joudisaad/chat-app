// src/loginForm.tsx
import React from "react";
import type { Theme } from "./App";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  theme: Theme;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, theme }) => {
  const [email, setEmail] = React.useState("saad@example.com");
  const [password, setPassword] = React.useState("test1234");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* super simple, since main one is inside App.tsx */}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginForm;