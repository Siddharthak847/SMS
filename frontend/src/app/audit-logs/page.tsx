"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ShieldCheck, Eye, Activity, Terminal } from "lucide-react";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: async () => {
      const res = await api.get(`/audit-logs/?page=${page}&size=15`);
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Security Audit Logs & Activity Monitor
            </h1>
            <p className="text-xs text-slate-400">Immutable security event logging, user action tracking, and audit trails</p>
          </div>
        </div>

        {/* Audit Trail Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading security audit events...</div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No audit logs recorded yet.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Actor ID</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.items.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans font-semibold">{log.entity_type}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-[120px]">{log.actor_id || "SYSTEM"}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">{log.ip_address || "127.0.0.1"}</td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedDetails(log.details)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Details View Modal */}
        {selectedDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Audit Event Payload Details
                </h3>
                <button
                  onClick={() => setSelectedDetails(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-64">
                <pre>{JSON.stringify(selectedDetails, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
