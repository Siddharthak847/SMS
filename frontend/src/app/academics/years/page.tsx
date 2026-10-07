"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Calendar, Plus, CheckCircle, Loader2, Pencil, Trash2 } from "lucide-react";

export default function AcademicYearsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [yearToEdit, setYearToEdit] = useState<any>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: years, isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic-years/")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/academic-years/", {
        name,
        start_date: startDate,
        end_date: endDate,
        is_current: true,
      });
    },
    onSuccess: () => {
      setShowModal(false);
      setName("");
      setStartDate("");
      setEndDate("");
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create academic year"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/academic-years/${yearToEdit.id}`, {
        name,
        start_date: startDate,
        end_date: endDate,
      });
    },
    onSuccess: () => {
      setYearToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update academic year"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/academic-years/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-years"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete academic year"),
  });

  const handleOpenEditModal = (y: any) => {
    setYearToEdit(y);
    setName(y.name || "");
    setStartDate(y.start_date || "");
    setEndDate(y.end_date || "");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Academic Years
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Configure academic cycles and manage active operational years</p>
          </div>
          <button
            onClick={() => {
              setName("");
              setStartDate("");
              setEndDate("");
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Academic Year</span>
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading academic years...</span>
            </div>
          ) : !years?.length ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No academic years defined yet</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Academic Year Name</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Current Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {years?.map((y: any) => (
                  <tr key={y.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                    <td className="p-4 font-bold text-[var(--text-primary)]">{y.name}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{y.start_date}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{y.end_date}</td>
                    <td className="p-4">
                      {y.is_current ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold status-badge-success">
                          Active Cycle
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] text-[11px] font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(y)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold"
                        title="Edit Year"
                      >
                        <Pencil className="w-3.5 h-3.5 inline" /> Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(y.id)}
                        className="px-2.5 py-1.5 rounded-lg status-badge-error text-xs font-semibold"
                        title="Delete Year"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create / Edit Year Modal */}
        {(showModal || yearToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {yearToEdit ? "Edit Academic Year" : "Add Academic Year"}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Year Name (e.g. 2027-2028)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setYearToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (yearToEdit ? editMutation.mutate() : createMutation.mutate())}
                  disabled={!name || !startDate || !endDate}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {yearToEdit ? "Update Year" : "Save Year"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
