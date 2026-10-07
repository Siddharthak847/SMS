"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [studentToEdit, setStudentToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({
    first_name: "",
    last_name: "",
    student_id_number: "",
    admission_number: "",
    date_of_birth: "",
    gender: "MALE",
    contact_number: "",
    address: "",
    status: "ACTIVE",
  });

  // Form State for Add Student
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "Password123!",
    student_id_number: "",
    admission_number: "",
    date_of_birth: "2012-05-15",
    gender: "MALE",
    section_id: "",
    academic_year_id: "",
    contact_number: "+1555000000",
    address: "Main Street Campus",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["students", search, statusFilter, page],
    queryFn: async () => {
      const res = await api.get("/students/", {
        params: { search, status_filter: statusFilter, page, size: 10 },
      });
      return res.data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["all-sections-dropdown"],
    queryFn: async () => {
      const classesRes = await api.get("/classes/");
      const list: any[] = [];
      for (const cls of classesRes.data) {
        const secRes = await api.get(`/classes/${cls.id}/sections`);
        list.push(...secRes.data.map((s: any) => ({ ...s, className: cls.name })));
      }
      return list;
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic-years/")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const secId = formData.section_id || sections?.[0]?.id;
      const ayId = formData.academic_year_id || academicYears?.[0]?.id;
      return api.post("/students/", {
        ...formData,
        section_id: secId,
        academic_year_id: ayId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowAddModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "Password123!",
        student_id_number: "",
        admission_number: "",
        date_of_birth: "2012-05-15",
        gender: "MALE",
        section_id: "",
        academic_year_id: "",
        contact_number: "+1555000000",
        address: "Main Street Campus",
      });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || err.message || "Failed to add student");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setStudentToDelete(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to delete student record");
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!studentToEdit) return;
      return api.put(`/students/${studentToEdit.id}`, editFormData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      setStudentToEdit(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to update student profile");
    },
  });

  const handleOpenEditModal = (student: any) => {
    setStudentToEdit(student);
    setEditFormData({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      student_id_number: student.student_id_number || "",
      admission_number: student.admission_number || "",
      date_of_birth: student.date_of_birth || "2012-05-15",
      gender: student.gender || "MALE",
      contact_number: student.contact_number || "",
      address: student.address || "",
      status: student.status || "ACTIVE",
    });
  };

  const handleOpenAddModal = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      username: `student_${rand}`,
      email: `student_${rand}@school.edu`,
      student_id_number: `STU-2026-${rand}`,
      admission_number: `ADM-2026-${rand + 1000}`,
      section_id: sections?.[0]?.id || "",
      academic_year_id: academicYears?.[0]?.id || "",
    }));
    setShowAddModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Student Directory</h1>
            <p className="text-xs text-[var(--text-secondary)]">Manage student profiles, admissions, and academic enrollments</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Student</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search student ID, name, admission #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="GRADUATED">GRADUATED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-[var(--border-color)]">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading students...</span>
            </div>
          ) : !data?.items?.length ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No matching student records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Student Info</th>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Class & Section</th>
                    <th className="p-4">Admission #</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {data.items.map((student: any) => (
                    <tr key={student.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">{student.student_id_number}</td>
                      <td className="p-4 font-medium text-[var(--text-primary)]">
                        {student.class_name ? `${student.class_name}` : "Unassigned"}
                        {student.section_name ? ` — ${student.section_name}` : ""}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">{student.admission_number}</td>
                      <td className="p-4 text-[var(--text-secondary)] capitalize">{student.gender}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            student.status === "ACTIVE"
                              ? "status-badge-success"
                              : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border border-[var(--border-color)]"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Link
                          href={`/students/${student.id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 text-xs transition font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>

                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs transition font-medium"
                          title="Edit Student"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setStudentToDelete(student)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg status-badge-error text-xs transition font-medium"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.total > 10 && (
            <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>
                Showing Page {data.page} of {Math.ceil(data.total / data.size)} ({data.total} Total)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-surface-hover)]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= Math.ceil(data.total / data.size)}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-surface-hover)]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Register New Student Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Alexander"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Wright"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Student ID Number</label>
                  <input
                    type="text"
                    value={formData.student_id_number}
                    onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Admission Number</label>
                  <input
                    type="text"
                    value={formData.admission_number}
                    onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                  />
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
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Class & Section</label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    {sections?.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.className} - {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.first_name || !formData.last_name || createMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {createMutation.isPending ? "Registering..." : "Save & Register Student"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-rose-500/30 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full status-badge-error flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Student Record?</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {studentToDelete.first_name} {studentToDelete.last_name}
                  </span>{" "}
                  ({studentToDelete.student_id_number})? This action will remove all enrollments and cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(studentToDelete.id)}
                  disabled={deleteMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shadow-md shadow-rose-600/20"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Student Modal */}
        {studentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Edit Student Profile ({studentToEdit.student_id_number})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Student ID Number</label>
                  <input
                    type="text"
                    value={editFormData.student_id_number}
                    onChange={(e) => setEditFormData({ ...editFormData, student_id_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Admission Number</label>
                  <input
                    type="text"
                    value={editFormData.admission_number}
                    onChange={(e) => setEditFormData({ ...editFormData, admission_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Gender</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Contact Phone</label>
                  <input
                    type="text"
                    value={editFormData.contact_number}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Academic Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="GRADUATED">GRADUATED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Residential Address</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setStudentToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editMutation.mutate()}
                  disabled={editMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 shadow-md shadow-amber-600/20"
                >
                  {editMutation.isPending ? "Saving..." : "Update Student Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
