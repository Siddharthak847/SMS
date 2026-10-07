"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  GraduationCap,
  UserCheck,
  UserPlus,
  Users,
  AlertCircle,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Clock,
  DollarSign,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useTheme } from "@/providers/ThemeProvider";

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data;
    },
  });

  const barColors = ["#2563eb", "#3b82f6", "#0284c7", "#0d9488", "#16a34a", "#d97706"];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Live Institution Pulse</span>
              </span>
              <span className="text-[var(--text-muted)] text-xs">• Academic Term 1</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
              Good morning, Administrator 👋
            </h1>
            <p className="text-xs lg:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Here is your school’s operational status across students, staff, active admissions, and class distribution today.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 relative z-10">
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-semibold shadow-sm hover:border-blue-500/40 transition"
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Refresh Metrics</span>
            </button>
            <Link
              href="/admissions"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Admission</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--text-secondary)] space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Synchronizing institution statistics...</span>
          </div>
        ) : error ? (
          <div className="p-5 status-badge-error rounded-2xl text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-600 dark:text-rose-200">Unable to connect to database</p>
              <p className="text-[11px] opacity-90">Please ensure the backend API and database server are running smoothly.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <div className="human-card-interactive p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Total Students</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                    {stats?.total_students || 0}
                  </h3>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{stats?.active_students || 0} Active</span>
                    </span>
                    <span className="text-[var(--text-muted)]">Enrolled</span>
                  </div>
                </div>
              </div>

              {/* Active Teachers */}
              <div className="human-card-interactive p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Faculty Staff</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                    {stats?.total_teachers || 0}
                  </h3>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>100% On Duty</span>
                    </span>
                    <span className="text-[var(--text-muted)]">Assigned</span>
                  </div>
                </div>
              </div>

              {/* New Admissions */}
              <div className="human-card-interactive p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">New Admissions</span>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-inner">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                    {stats?.new_admissions || 0}
                  </h3>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">Accepted Term 1</span>
                    <span className="text-[var(--text-muted)]">Enrolled</span>
                  </div>
                </div>
              </div>

              {/* Pending Admissions */}
              <div className="human-card-interactive p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Applications</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-heading font-extrabold text-[var(--text-primary)] tracking-tight">
                    {stats?.pending_admissions || 0}
                  </h3>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Under Review</span>
                    <span className="text-[var(--text-muted)]">Action Req.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Operational Shortcuts */}
            <div className="space-y-3">
              <h2 className="text-xs font-heading font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Frequent Operational Shortcuts
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link
                  href="/admissions"
                  className="p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-blue-500/40 transition-all group flex items-center space-x-3"
                >
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">New Admission</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Register new student</p>
                  </div>
                </Link>

                <Link
                  href="/attendance"
                  className="p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-emerald-500/40 transition-all group flex items-center space-x-3"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Attendance</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Take daily attendance</p>
                  </div>
                </Link>

                <Link
                  href="/fees"
                  className="p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-purple-500/40 transition-all group flex items-center space-x-3"
                >
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Fee Receipt</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Collect & print fees</p>
                  </div>
                </Link>

                <Link
                  href="/communication"
                  className="p-3.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-amber-500/40 transition-all group flex items-center space-x-3"
                >
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Noticeboard</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Publish school circular</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Main Content Split: Chart & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Class Enrollment Chart */}
              <div className="lg:col-span-2 human-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[var(--text-primary)]">Student Distribution by Class</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Headcount active across configured grade levels</p>
                  </div>
                  <Link
                    href="/academics/classes"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center space-x-1"
                  >
                    <span>Manage Classes</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="h-72 w-full">
                  {stats?.class_wise_student_counts?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.class_wise_student_counts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={resolvedTheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="class_name"
                          stroke={resolvedTheme === "dark" ? "#94a3b8" : "#64748b"}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: resolvedTheme === "dark" ? "#1e293b" : "#e2e8f0" }}
                        />
                        <YAxis
                          stroke={resolvedTheme === "dark" ? "#94a3b8" : "#64748b"}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: resolvedTheme === "dark" ? "#1e293b" : "#e2e8f0" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: resolvedTheme === "dark" ? "#111827" : "#ffffff",
                            borderColor: resolvedTheme === "dark" ? "#1f2937" : "#e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                            color: resolvedTheme === "dark" ? "#f8fafc" : "#0f172a",
                            fontSize: "12px",
                          }}
                          cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {stats.class_wise_student_counts.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-[var(--text-muted)] space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-[var(--text-muted)]" />
                      <span>No active class enrollment data configured yet.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* School Activity Timeline */}
              <div className="human-card p-6 rounded-3xl space-y-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                  <h3 className="text-base font-heading font-bold text-[var(--text-primary)]">Recent Updates</h3>
                  <span className="text-[10px] status-badge-success px-2 py-0.5 rounded-full font-medium">
                    Live System Log
                  </span>
                </div>

                <div className="flex-1 space-y-3.5 text-xs">
                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">New Student Registered</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Class 10-A • Admission #ADM-102</p>
                      <span className="text-[9px] text-[var(--text-muted)]">10 minutes ago</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Morning Attendance Completed</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Submitted for 12 sections</p>
                      <span className="text-[9px] text-[var(--text-muted)]">1 hour ago</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Fee Receipt #REC-884 Printed</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Term 1 Tuition Fee Collection</p>
                      <span className="text-[9px] text-[var(--text-muted)]">2 hours ago</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)]">
                  <Link
                    href="/audit-logs"
                    className="w-full text-center block py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition"
                  >
                    View All Audit Logs →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
