 "use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, GraduationCap, DollarSign, Bell, CheckCircle2 } from "lucide-react";

export default function ParentPortalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["parent-portal"],
    queryFn: async () => {
      const res = await api.get("/dashboard/parent-portal");
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Parent / Guardian Portal</span>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome, {data?.parent_name || "Parent"}
            </h1>
            <p className="text-xs text-slate-400">Contact: {data?.email || "parent@gmail.com"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
            {data?.parent_name?.[0] || "P"}
          </div>
        </div>

        {/* Linked Children List */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Wards & Linked Children
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full p-8 text-center text-slate-400 text-sm">Loading ward details...</div>
            ) : !data?.children || data.children.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 text-sm">No linked children records found.</div>
            ) : (
              data.children.map((child: any) => (
                <div key={child.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{child.name}</h4>
                      <p className="text-[10px] text-slate-400">{child.student_id_number} • Relationship: {child.relationship}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Active Student
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Outstanding Balance:</span>
                    <span className="font-bold text-amber-400">${child.due_fees.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* School Notices */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            School Announcements & Circulars
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
