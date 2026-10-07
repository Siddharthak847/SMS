"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TrendingUp, PieChart as PieIcon, BarChart3, Award, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-data"],
    queryFn: async () => (await api.get("/analytics/")).data,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Executive Analytics & Performance Insights
          </h1>
          <p className="text-xs text-slate-400">Real-time school performance, enrollment distribution, financial metrics, and grade trends</p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading executive analytics...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment by Class */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Class-wise Student Enrollment
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.enrollment_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Status Pie */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                Attendance Status Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.attendance_trends}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics?.attendance_trends?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Financial Collection Distribution
              </h3>
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans">Billed</span>
                  <p className="text-lg font-bold text-slate-100">${(analytics?.financial_overview?.total_billed || 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans">Collected</span>
                  <p className="text-lg font-bold text-emerald-400">${(analytics?.financial_overview?.collected || 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans">Pending</span>
                  <p className="text-lg font-bold text-amber-400">${(analytics?.financial_overview?.pending || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Academic Grade Distribution */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Academic Grade Performance Breakdown
              </h3>
              <div className="space-y-3">
                {analytics?.grade_distribution?.map((g: any) => (
                  <div key={g.grade} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{g.grade}</span>
                      <span className="font-mono text-indigo-400 font-bold">{g.count} student(s)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (g.count / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
