"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BookOpen, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<any>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subjectType, setSubjectType] = useState("THEORY");

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/subjects/")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/subjects/", { name, code, subject_type: subjectType }),
    onSuccess: () => {
      setShowModal(false);
      setName("");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create subject"),
  });

  const editMutation = useMutation({
    mutationFn: async () => api.put(`/subjects/${subjectToEdit.id}`, { name, code, subject_type: subjectType }),
    onSuccess: () => {
      setSubjectToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update subject"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete subject"),
  });

  const handleOpenEditModal = (s: any) => {
    setSubjectToEdit(s);
    setName(s.name || "");
    setCode(s.code || "");
    setSubjectType(s.subject_type || "THEORY");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-500" />
              Subject Repository
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Manage curriculum subjects and course codes</p>
          </div>
          <button
            onClick={() => {
              setName("");
              setCode("");
              setSubjectType("THEORY");
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading subjects...</span>
            </div>
          ) : !subjects?.length ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No subjects registered yet</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {subjects?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                    <td className="p-4 font-bold text-[var(--text-primary)]">{s.name}</td>
                    <td className="p-4 font-mono font-semibold text-[var(--text-primary)]">{s.code}</td>
                    <td className="p-4 text-[var(--text-secondary)] capitalize">{s.subject_type}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold"
                        title="Edit Subject"
                      >
                        <Pencil className="w-3.5 h-3.5 inline" /> Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="px-2.5 py-1.5 rounded-lg status-badge-error text-xs font-semibold"
                        title="Delete Subject"
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

        {/* Create / Edit Subject Modal */}
        {(showModal || subjectToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {subjectToEdit ? "Edit Subject" : "Add Subject"}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Subject Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Subject Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                    placeholder="e.g. MATH101"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Subject Type</label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="THEORY">THEORY</option>
                    <option value="PRACTICAL">PRACTICAL</option>
                    <option value="ELECTIVE">ELECTIVE</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSubjectToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (subjectToEdit ? editMutation.mutate() : createMutation.mutate())}
                  disabled={!name || !code}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {subjectToEdit ? "Update Subject" : "Save Subject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
