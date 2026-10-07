"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { UserCheck, Plus, Check, X, Clock, GraduationCap, Briefcase, Filter } from "lucide-react";

export default function LeavesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "STUDENT" | "TEACHER">("ALL");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicantType, setApplicantType] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [leaveType, setLeaveType] = useState("SICK");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  // Fetch Leave applications with optional applicant_type filter
  const { data: leaves, isLoading } = useQuery({
    queryKey: ["leave-applications", activeTab],
    queryFn: async () => {
      const params: any = {};
      if (activeTab !== "ALL") {
        params.applicant_type = activeTab;
      }
      const res = await api.get("/leaves/", { params });
      return res.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return api.post("/leaves/", {
        applicant_type: applicantType,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      setShowApplyModal(false);
      setReason("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to submit leave application");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ leaveId, status }: { leaveId: string; status: string }) => {
      return api.patch(`/leaves/${leaveId}/review`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Review action failed");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-400" />
              Leave Management Portal
            </h1>
            <p className="text-xs text-slate-400">Review student and teacher leave requests with administrative workflows</p>
          </div>
          <button
            onClick={() => {
              setApplicantType(activeTab === "TEACHER" ? "TEACHER" : "STUDENT");
              setShowApplyModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Tab Selection Filter */}
        <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All Requests</span>
          </button>

          <button
            onClick={() => setActiveTab("STUDENT")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "STUDENT"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Leave Requests</span>
          </button>

          <button
            onClick={() => setActiveTab("TEACHER")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "TEACHER"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Teacher Leave Requests</span>
          </button>
        </div>

        {/* Leave Requests Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading leave applications...</div>
          ) : !leaves || leaves.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No {activeTab !== "ALL" ? activeTab.toLowerCase() : ""} leave applications found.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaves.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      {l.applicant_name || "Applicant Record"}
                    </td>
                    <td className="px-4 py-3">
                      {l.applicant_type === "TEACHER" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Teacher
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Student
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">{l.leave_type}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {l.start_date} to {l.end_date}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{l.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          l.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : l.status === "REJECTED"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.status === "PENDING" && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => reviewMutation.mutate({ leaveId: l.id, status: "APPROVED" })}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30"
                            title="Approve Leave"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ leaveId: l.id, status: "REJECTED" })}
                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/30"
                            title="Reject Leave"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
                Submit Leave Application
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Applicant Role Category</label>
                  <select
                    value={applicantType}
                    onChange={(e) => setApplicantType(e.target.value as "STUDENT" | "TEACHER")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="STUDENT">Student Leave Request</option>
                    <option value="TEACHER">Teacher Leave Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Leave Category</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="SICK">Sick Leave</option>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="EMERGENCY">Emergency Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Reason for Leave</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyMutation.mutate()}
                  disabled={!reason || applyMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
