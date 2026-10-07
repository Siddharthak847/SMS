"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Layers, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Modals state
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState<any>(null);
  const [sectionToEdit, setSectionToEdit] = useState<any>(null);

  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState(11);

  const [sectionName, setSectionName] = useState("Section A");
  const [sectionCapacity, setSectionCapacity] = useState(30);

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic-years/")).data,
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await api.get("/classes/");
      if (res.data?.length > 0 && !selectedClassId) {
        setSelectedClassId(res.data[0].id);
      }
      return res.data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const res = await api.get(`/classes/${selectedClassId}/sections`);
      return res.data;
    },
    enabled: !!selectedClassId,
  });

  // Create Class Mutation
  const createClassMutation = useMutation({
    mutationFn: async () => {
      const ayId = academicYears?.[0]?.id;
      return api.post("/classes/", {
        academic_year_id: ayId,
        name: className,
        code: Number(classCode),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setShowAddClassModal(false);
      setClassName("");
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create class"),
  });

  // Edit Class Mutation
  const editClassMutation = useMutation({
    mutationFn: async () => api.put(`/classes/${classToEdit.id}`, { name: className, code: Number(classCode) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setClassToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update class"),
  });

  // Delete Class Mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setSelectedClassId(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete class"),
  });

  // Create Section Mutation
  const createSectionMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/classes/${selectedClassId}/sections`, {
        name: sectionName,
        capacity: Number(sectionCapacity),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", selectedClassId] });
      setShowAddSectionModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to add section"),
  });

  // Edit Section Mutation
  const editSectionMutation = useMutation({
    mutationFn: async () => api.put(`/classes/sections/${sectionToEdit.id}`, { name: sectionName, capacity: Number(sectionCapacity) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", selectedClassId] });
      setSectionToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update section"),
  });

  // Delete Section Mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/classes/sections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", selectedClassId] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete section"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500" />
              Classes & Sections
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Configure academic class hierarchy and section capacities</p>
          </div>
          <button
            onClick={() => {
              setClassName("");
              setClassCode(11);
              setShowAddClassModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Class</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class List */}
          <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Classes ({classes?.length || 0})</h3>
            </div>

            {isLoading ? (
              <div className="py-10 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span>Loading classes...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {classes?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`w-full p-3 rounded-xl border text-xs font-semibold flex justify-between items-center transition ${
                      selectedClassId === c.id
                        ? "bg-blue-600/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                    }`}
                  >
                    <button onClick={() => setSelectedClassId(c.id)} className="flex-1 text-left">
                      <span>{c.name}</span>
                      <span className="ml-2 font-mono text-[10px] text-[var(--text-secondary)]">Code: {c.code}</span>
                    </button>

                    <div className="flex items-center space-x-1.5 ml-2">
                      <button
                        onClick={() => {
                          setClassToEdit(c);
                          setClassName(c.name);
                          setClassCode(c.code);
                        }}
                        className="p-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        title="Edit Class"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteClassMutation.mutate(c.id)}
                        className="p-1 rounded-lg status-badge-error"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sections List */}
          <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Sections ({sections?.length || 0})</h3>
              {selectedClassId && (
                <button
                  onClick={() => {
                    setSectionName("Section A");
                    setSectionCapacity(30);
                    setShowAddSectionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              )}
            </div>

            {!selectedClassId ? (
              <p className="text-xs text-[var(--text-muted)] py-10 text-center">Select a class to view its sections</p>
            ) : !sections?.length ? (
              <p className="text-xs text-[var(--text-muted)] py-10 text-center">No sections configured for this class</p>
            ) : (
              <div className="space-y-2">
                {sections.map((sec: any) => (
                  <div key={sec.id} className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)] flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">{sec.name}</span>
                      <span className="ml-2 text-[var(--text-secondary)] font-mono text-[11px]">Cap: {sec.capacity} Students</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setSectionToEdit(sec);
                          setSectionName(sec.name);
                          setSectionCapacity(sec.capacity);
                        }}
                        className="p-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        title="Edit Section"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSectionMutation.mutate(sec.id)}
                        className="p-1 rounded-lg status-badge-error"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Class Modal */}
        {(showAddClassModal || classToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {classToEdit ? "Edit Academic Class" : "Create Academic Class"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Class Name</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Grade 11"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Class Code (Numeric)</label>
                  <input
                    type="number"
                    value={classCode}
                    onChange={(e) => setClassCode(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowAddClassModal(false);
                    setClassToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (classToEdit ? editClassMutation.mutate() : createClassMutation.mutate())}
                  disabled={!className}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {classToEdit ? "Update Class" : "Save Class"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Section Modal */}
        {(showAddSectionModal || sectionToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {sectionToEdit ? "Edit Class Section" : "Add Class Section"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Section Name</label>
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Section C"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Max Student Capacity</label>
                  <input
                    type="number"
                    value={sectionCapacity}
                    onChange={(e) => setSectionCapacity(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowAddSectionModal(false);
                    setSectionToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (sectionToEdit ? editSectionMutation.mutate() : createSectionMutation.mutate())}
                  disabled={!sectionName}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {sectionToEdit ? "Update Section" : "Save Section"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
