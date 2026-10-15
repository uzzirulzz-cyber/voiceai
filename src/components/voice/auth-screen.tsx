"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Shield, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface AuthScreenProps {
  onSuccess: (user: {
    id: string;
    email: string;
    name: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "USER";
    status: string;
  }) => void;
  onBack: () => void;
}

export function AuthScreen({ onSuccess, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "register" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      toast.success(data.message || `Welcome, ${data.user.name || data.user.email}!`);
      onSuccess(data.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />
      </div>

      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              boxShadow: "0 8px 24px rgba(79,140,255,0.4)",
            }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Voice AI</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to coordinate five AI engines on your most important work
          </p>
        </div>

        {/* Auth card */}
        <div className="voice-card-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold">Secure Access</span>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "register" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs text-muted-foreground">Name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full mt-1 px-3 py-2 rounded-md bg-input border border-border text-sm focus:outline-none focus:border-primary"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full mt-1 px-3 py-2 rounded-md bg-input border border-border text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
                  className="w-full px-3 py-2 pr-9 rounded-md bg-input border border-border text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-voice w-full mt-4 flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>

            {mode === "register" && (
              <p className="text-[10px] text-muted-foreground text-center">
                The first account becomes the Super Admin
              </p>
            )}
          </form>
        </div>

        <div className="text-center mt-4 text-[10px] text-muted-foreground">
          By continuing, you agree to Voice AI's Terms of Service and Privacy Policy.
        </div>
      </motion.div>
    </div>
  );
}
