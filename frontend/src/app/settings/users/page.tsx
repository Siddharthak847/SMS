"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, Search, ShieldCheck, Loader2 } from "lucide-react";

export default function UsersSettingsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const res = await api.get("/users/", { params: { search } });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-xs text-slate-400">Manage application user accounts, security roles, and active status</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search username, email, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-slate-400 space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading user accounts...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-semibold text-slate-200">
                      {u.first_name} {u.last_name}
                      <span className="block text-[10px] text-slate-400 font-normal">{u.email}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{u.username}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {u.roles?.[0]?.name || "User"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
