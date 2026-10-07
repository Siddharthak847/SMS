"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Award, Plus, Calendar, FileText, CheckCircle2, Pencil, Trash2, Loader2 } from "lucide-react";

export default function ExaminationsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examToEdit, setExamToEdit] = useState<any>(null);

  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState("MIDTERM");
  const [startDate, setStartDate] = useState("2026-10-10");
  const [endDate, setEndDate] = useState("2026-10-20");

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => (await api.get("/examinations/")).data,
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic-years/")).data,
  });

  const createExamMutation = useMutation({
    mutationFn: async () => {
      const currentAy = academicYears?.[0]?.id;
      return api.post("/examinations/", {
        name: examName,
        exam_type: examType,
        academic_year_id: currentAy,
        start_date: startDate,
        end_date: endDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setShowCreateModal(false);
      setExamName("");
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create exam"),
  });

  const editExamMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/examinations/${examToEdit.id}`, {
        name: examName,
        exam_type: examType,
        start_date: startDate,
        end_date: endDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setExamToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update exam"),
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/examinations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete exam"),
  });

  const handleOpenEditModal = (exam: any) => {
    setExamToEdit(exam);
    setExamName(exam.name || "");
    setExamType(exam.exam_type || "MIDTERM");
    setStartDate(exam.start_date || "2026-10-10");
    setEndDate(exam.end_date || "2026-10-20");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-500" />
              Examination & Grading Management
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Configure exam terms, schedules, marks entry, and report cards</p>
          </div>
          <button
            onClick={() => {
              setExamName("");
              setExamType("MIDTERM");
              setStartDate("2026-10-10");
              setEndDate("2026-10-20");
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Exam</span>
          </button>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-[var(--text-secondary)] text-xs flex justify-center items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading exams...</span>
            </div>
          ) : !exams || exams.length === 0 ? (
            <div className="col-span-full p-8 text-center text-[var(--text-muted)] text-xs glass-panel rounded-2xl border border-[var(--border-color)]">
              No exams scheduled yet.
            </div>
          ) : (
            exams.map((exam: any) => (
              <div key={exam.id} className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4 hover:border-blue-500/40 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] text-sm">{exam.name}</h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold status-badge-info">
                      {exam.exam_type}
                    </span>
                  </div>
                  {exam.is_published ? (
                    <span className="flex items-center text-[10px] status-badge-success px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                    </span>
                  ) : (
                    <span className="text-[10px] status-badge-warning px-2 py-0.5 rounded-full font-medium">
                      Draft
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Duration: {exam.start_date} to {exam.end_date}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] text-[11px] font-medium">Grade Scale: Standard (A+ to F)</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEditModal(exam)}
                      className="p-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                      title="Edit Exam"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteExamMutation.mutate(exam.id)}
                      className="p-1 rounded-lg status-badge-error"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create / Edit Exam Modal */}
        {(showCreateModal || examToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {examToEdit ? "Edit Examination Details" : "Schedule New Examination"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Exam Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Midterm Examination 2026"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="UNIT_TEST">Unit Test</option>
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINAL">Final Exam</option>
                    <option value="CUSTOM">Custom Assessment</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setExamToEdit(null);
                  }}
                  className="px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (examToEdit ? editExamMutation.mutate() : createExamMutation.mutate())}
                  disabled={!examName}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {examToEdit ? "Update Exam" : "Create Exam"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
