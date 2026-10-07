"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Save, Filter } from "lucide-react";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: string; reason: string }>>({});

  // Fetch sections
  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const classesRes = await api.get("/classes/");
      const allSections: any[] = [];
      for (const cls of classesRes.data) {
        const secRes = await api.get(`/classes/${cls.id}/sections`);
        allSections.push(...secRes.data.map((s: any) => ({ ...s, className: cls.name })));
      }
      if (allSections.length > 0 && !selectedSection) {
        setSelectedSection(allSections[0].id);
      }
      return allSections;
    },
  });

  // Fetch students for selected section
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["students-section", selectedSection, selectedDate],
    enabled: !!selectedSection,
    queryFn: async () => {
      const res = await api.get(`/students/?section_id=${selectedSection}`);
      const stdList = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      
      let existingAttMap: Record<string, string> = {};
      try {
        const attRes = await api.get(`/attendance/section/${selectedSection}?att_date=${selectedDate}`);
        if (Array.isArray(attRes.data)) {
          attRes.data.forEach((a: any) => {
            existingAttMap[a.student_id] = a.status;
          });
        }
      } catch (e) {
        // Ignore if no existing attendance
      }

      const initState: Record<string, { status: string; reason: string }> = {};
      stdList.forEach((st: any) => {
        initState[st.id] = { status: existingAttMap[st.id] || "PRESENT", reason: "" };
      });
      setAttendanceState(initState);
      return stdList;
    },
  });

  // Bulk save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(attendanceState).map(([student_id, val]) => ({
        student_id,
        status: val.status,
        reason: val.reason || null,
      }));
      return api.post("/attendance/bulk", {
        section_id: selectedSection,
        date: selectedDate,
        entries,
      });
    },
    onSuccess: () => {
      alert("Attendance records saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["section-attendance"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to save attendance");
    },
  });

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-400" />
              Attendance Management
            </h1>
            <p className="text-xs text-slate-400">Mark daily attendance and track monthly presence thresholds</p>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !selectedSection}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            >
              {sections?.map((sec: any) => (
                <option key={sec.id} value={sec.id} className="bg-slate-900 text-slate-200">
                  {sec.className} - {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Roster & Attendance Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {loadingStudents ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading section students...</div>
          ) : !students || students.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No students enrolled in this section.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((st: any) => {
                  const currentStatus = attendanceState[st.id]?.status || "PRESENT";
                  return (
                    <tr key={st.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {st.first_name} {st.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{st.student_id_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          {[
                            { label: "Present", val: "PRESENT", activeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm" },
                            { label: "Absent", val: "ABSENT", activeClass: "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm" },
                            { label: "Late", val: "LATE", activeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm" },
                            { label: "Half Day", val: "HALF_DAY", activeClass: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-sm" },
                            { label: "Excused", val: "EXCUSED", activeClass: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm" },
                          ].map((opt) => {
                            const isSelected = currentStatus === opt.val;
                            return (
                              <button
                                key={opt.val}
                                onClick={() => handleStatusChange(st.id, opt.val)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                  isSelected
                                    ? opt.activeClass
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
