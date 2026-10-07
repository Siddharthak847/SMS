"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GraduationCap, Clock, DollarSign, Bell, Award, Calendar, BookOpen } from "lucide-react";

export default function StudentPortalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-portal"],
    queryFn: async () => {
      const res = await api.get("/dashboard/student-portal");
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-900/40 to-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">Student Portal</span>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome back, {data?.name || "Student"}!
            </h1>
            <p className="text-xs text-slate-400">ID Number: {data?.student_id_number || "STU-2026-1001"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xl">
            {data?.name?.[0] || "S"}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Attendance Percentage</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {isLoading ? "..." : `${data?.attendance_percentage || 100}%`}
            </p>
            <p className="text-[10px] text-slate-500">Threshold requirement: 75%</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Fee Balance Due</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {isLoading ? "..." : `$${(data?.total_due_fees || 0).toFixed(2)}`}
            </p>
            <p className="text-[10px] text-slate-500">{data?.invoices_count || 0} active invoice(s)</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Academic Standing</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-400">Grade A (3.8 GPA)</p>
            <p className="text-[10px] text-slate-500">Midterm 2026 Evaluation</p>
          </div>
        </div>

        {/* Announcements Stream */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            School Noticeboard Updates
          </h3>
          <div className="space-y-3">
            {data?.announcements?.map((a: any) => (
              <div key={a.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{a.title}</span>
                  <span className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
