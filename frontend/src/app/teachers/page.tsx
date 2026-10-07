"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const [teacherToEdit, setTeacherToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "Password123!",
    employee_id: "",
    department: "Mathematics",
    designation: "Senior Teacher",
    qualification: "M.Sc, B.Ed",
    specialization: "Algebra & Geometry",
    phone: "+1555010099",
    address: "Education Campus Way",
    experience_years: 5,
    joining_date: "2024-08-01",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", search, department, page],
    queryFn: async () => {
      const res = await api.get("/teachers/", {
        params: { search, department, page, size: 10 },
      });
      return res.data;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async () => api.post("/teachers/", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to register teacher profile"),
  });

  const editTeacherMutation = useMutation({
    mutationFn: async () => api.put(`/teachers/${teacherToEdit.id}`, editFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setTeacherToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update teacher profile"),
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete teacher record"),
  });

  const handleOpenEditModal = (t: any) => {
    setTeacherToEdit(t);
    setEditFormData({
      first_name: t.first_name || "",
      last_name: t.last_name || "",
      department: t.department || "Mathematics",
      designation: t.designation || "Teacher",
      qualification: t.qualification || "",
      specialization: t.specialization || "",
      phone: t.phone || "",
      address: t.address || "",
      experience_years: t.experience_years || 0,
    });
  };

  const handleOpenModal = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      username: `teacher_${rand}`,
      email: `teacher_${rand}@school.edu`,
      employee_id: `EMP-2026-${rand}`,
    }));
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Teacher Directory</h1>
            <p className="text-xs text-[var(--text-secondary)]">Manage teaching staff profiles, departments, and class assignments</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Teacher</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search employee ID, name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading teachers...</span>
            </div>
          ) : !data?.items?.length ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No matching teacher records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Teacher Name</th>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Qualification</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {data.items.map((t: any) => (
                    <tr key={t.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {t.first_name} {t.last_name}
                        <span className="block text-[10px] text-[var(--text-secondary)] font-normal">{t.email}</span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">{t.employee_id}</td>
                      <td className="p-4 text-[var(--text-primary)] font-medium">{t.department}</td>
                      <td className="p-4 text-[var(--text-primary)]">{t.designation}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{t.qualification}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold status-badge-success">
                          ACTIVE
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold transition"
                          title="Edit Teacher"
                        >
                          <Pencil className="w-3.5 h-3.5 inline" /> Edit
                        </button>
                        <button
                          onClick={() => deleteTeacherMutation.mutate(t.id)}
                          className="px-2.5 py-1.5 rounded-lg status-badge-error text-xs font-semibold transition"
                          title="Delete Teacher"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Teacher Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Register New Faculty Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Eleanor"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Vance"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Languages">Languages</option>
                    <option value="Humanities">Humanities</option>
                    <option value="IT">IT & Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createTeacherMutation.mutate()}
                  disabled={!formData.first_name || !formData.last_name || createTeacherMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {createTeacherMutation.isPending ? "Registering..." : "Save Teacher Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Teacher Modal */}
        {teacherToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Edit Teacher Profile ({teacherToEdit.employee_id})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    value={editFormData.first_name || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.last_name || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Department</label>
                  <select
                    value={editFormData.department || "Mathematics"}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Languages">Languages</option>
                    <option value="Humanities">Humanities</option>
                    <option value="IT">IT & Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Designation</label>
                  <input
                    type="text"
                    value={editFormData.designation || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Qualification</label>
                  <input
                    type="text"
                    value={editFormData.qualification || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setTeacherToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editTeacherMutation.mutate()}
                  disabled={editTeacherMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 shadow-md shadow-amber-600/20"
                >
                  {editTeacherMutation.isPending ? "Updating..." : "Update Teacher Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
