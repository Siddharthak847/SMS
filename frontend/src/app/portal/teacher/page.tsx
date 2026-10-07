"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { UserCheck, Clock, BookOpen, FileSpreadsheet, Plus } from "lucide-react";
import Link from "next/link";

export default function TeacherPortalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-portal"],
    queryFn: async () => {
      const res = await api.get("/dashboard/teacher-portal");
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">Teacher Workspace</span>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome, {data?.teacher_name || "Faculty Member"}
            </h1>
            <p className="text-xs text-slate-400">Department: {data?.department || "Mathematics"} • Employee ID: {data?.employee_id || "EMP-2026-101"}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/attendance"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" /> Take Attendance
            </Link>
          </div>
        </div>

        {/* Assigned Timetable Periods */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            Assigned Period Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full p-8 text-center text-slate-400 text-sm">Loading periods...</div>
            ) : !data?.timetable_slots || data.timetable_slots.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 text-sm">No period slots assigned for today.</div>
            ) : (
              data.timetable_slots.map((slot: any) => (
                <div key={slot.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">Period {slot.period_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {slot.day_of_week}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {slot.start_time} - {slot.end_time}
                  </div>
                  <p className="text-[11px] text-slate-400">Room: {slot.room_number || "Main Building"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
