"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileText, Download, Printer, Filter, DollarSign, GraduationCap, Users, Clock } from "lucide-react";

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("students");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => (await api.get("/reports/summary")).data,
  });

  const exportCSV = (type: string) => {
    let csvData = "";
    if (type === "students") {
      csvData = "Report,Total Students,Active Students\nStudent Summary," + (summary?.students?.total || 0) + "," + (summary?.students?.active || 0);
    } else if (type === "financial") {
      csvData = "Report,Billed Amount,Collected Amount,Pending Amount\nFinancial Summary," + (summary?.financials?.total_billed || 0) + "," + (summary?.financials?.total_collected || 0) + "," + (summary?.financials?.total_pending || 0);
    } else {
      csvData = "Report,Total Teachers,Pending Leaves\nTeacher & Operations," + (summary?.teachers?.total || 0) + "," + (summary?.leaves?.pending || 0);
    }

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `school_erp_${type}_report.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Centralized Reporting System
            </h1>
            <p className="text-xs text-slate-400">Generate, filter, print, and export student, financial, academic, and administrative reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportCSV(activeReport)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Report Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveReport("students")}
            className={`p-5 rounded-2xl border text-left space-y-2 transition ${
              activeReport === "students"
                ? "bg-indigo-600/20 border-indigo-500/40 text-slate-100"
                : "glass-panel border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Student Demographics Report</span>
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-400">Active enrollments, status distributions, and admissions summary</p>
          </button>

          <button
            onClick={() => setActiveReport("financial")}
            className={`p-5 rounded-2xl border text-left space-y-2 transition ${
              activeReport === "financial"
                ? "bg-indigo-600/20 border-indigo-500/40 text-slate-100"
                : "glass-panel border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Financial Collection Report</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">Total fees billed, collection metrics, and overdue fee accounts</p>
          </button>

          <button
            onClick={() => setActiveReport("operations")}
            className={`p-5 rounded-2xl border text-left space-y-2 transition ${
              activeReport === "operations"
                ? "bg-indigo-600/20 border-indigo-500/40 text-slate-100"
                : "glass-panel border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Faculty & Operations Report</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">Teacher roster, staff workload metrics, and pending leave applications</p>
          </button>
        </div>

        {/* Dynamic Report View */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-100 capitalize">
              Official Executive Summary — {activeReport}
            </h3>
            <span className="text-xs text-slate-500 font-mono">Generated: {new Date().toLocaleDateString()}</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Synthesizing report metrics...</div>
          ) : activeReport === "students" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Total Enrolled Students</span>
                <p className="text-2xl font-bold text-slate-100">{summary?.students?.total || 0}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Active Academic Status</span>
                <p className="text-2xl font-bold text-emerald-400">{summary?.students?.active || 0}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Total Admission Applications</span>
                <p className="text-2xl font-bold text-indigo-400">{summary?.admissions?.total || 0}</p>
              </div>
            </div>
          ) : activeReport === "financial" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Total Billed Fees</span>
                <p className="text-2xl font-bold text-slate-100">${(summary?.financials?.total_billed || 0).toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Total Fees Collected</span>
                <p className="text-2xl font-bold text-emerald-400">${(summary?.financials?.total_collected || 0).toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Outstanding Due Fees</span>
                <p className="text-2xl font-bold text-amber-400">${(summary?.financials?.total_pending || 0).toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Total Active Faculty Members</span>
                <p className="text-2xl font-bold text-indigo-400">{summary?.teachers?.total || 0}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-sans">Pending Leave Approvals</span>
                <p className="text-2xl font-bold text-amber-400">{summary?.leaves?.pending || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
