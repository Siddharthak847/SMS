"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/layout/ThemeToggle";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleQuickFill = () => {
    setValue("username", "admin");
    setValue("password", "Admin123!");
    setErrorMessage(null);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      const token = res.data.access_token;
      if (!token) {
        throw new Error("No access token returned from server.");
      }
      localStorage.setItem("access_token", token);
      // Use window.location for a hard redirect so the new token is
      // guaranteed to be read by subsequent requests in DashboardLayout.
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Authentication failed. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Top Corner Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xl relative z-10 overflow-hidden">

        {/* Left Side: Brand & Institution Showcase */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-[var(--accent-bg-subtle)] border-r border-[var(--border-color)] flex flex-col justify-between relative overflow-hidden">

          {/* Logo & Brand Header */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center font-heading font-black text-white text-base shadow-md shadow-blue-500/20">
                SMS
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-[var(--text-primary)] tracking-wide">Horizon Academy</h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Enterprise School ERP System</p>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Next-Gen Academic Platform</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-heading font-extrabold text-[var(--text-primary)] leading-tight">
                Streamlining Education & Management
              </h1>
              <p className="text-xs lg:text-sm text-[var(--text-secondary)] leading-relaxed">
                Unified workspace for student records, attendance tracking, teacher schedules, printable report cards, and automated financial accounting.
              </p>
            </div>
          </div>

          {/* Key Features List */}
          <div className="space-y-3 pt-8 relative z-10 hidden sm:block">
            <div className="flex items-center space-x-3 text-xs text-[var(--text-secondary)]">
              <div className="p-1.5 rounded-lg status-badge-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Role-Based Access Control (Admin, Teacher, Student, Parent)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[var(--text-secondary)]">
              <div className="p-1.5 rounded-lg status-badge-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Printable Report Cards & Automated Grade Analytics</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[var(--text-secondary)]">
              <div className="p-1.5 rounded-lg status-badge-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Encrypted Authentication & Financial Auditing</span>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-[var(--text-muted)] border-t border-[var(--border-color)] relative z-10 flex items-center justify-between">
            <span>© 2026 Horizon Academic ERP</span>
            <span className="flex items-center space-x-1 status-badge-success px-2 py-0.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Operational</span>
            </span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] tracking-tight">Welcome Back 👋</h2>
            <p className="text-xs text-[var(--text-secondary)]">Please sign in to access your administrative workspace.</p>
          </div>

          {errorMessage && (
            <div className="flex items-start space-x-3 p-3.5 rounded-2xl status-badge-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  {...register("username")}
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
              {errors.username && <p className="text-[11px] text-rose-500 mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard →</span>
              )}
            </button>
          </form>

          {/* Click to Auto-fill Demo Credentials Button */}
          <div className="p-3.5 rounded-2xl bg-[var(--accent-bg-subtle)] border border-[var(--accent-border)] space-y-1.5 text-center">
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">Testing & Demonstration Access</p>
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Click to Auto-Fill Admin Demo Login</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
