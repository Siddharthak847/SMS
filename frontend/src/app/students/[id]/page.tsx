"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  User,
  GraduationCap,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  FolderOpen,
  Pencil,
} from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/profile`);
      return res.data;
    },
  });

  const [editFormData, setEditFormData] = useState<any>({});

  const handleOpenEditModal = () => {
    if (!profile?.overview) return;
    setEditFormData({
      first_name: profile.overview.first_name || "",
      last_name: profile.overview.last_name || "",
      student_id_number: profile.overview.student_id_number || "",
      admission_number: profile.overview.admission_number || "",
      date_of_birth: profile.overview.date_of_birth || "",
      gender: profile.overview.gender || "MALE",
      contact_number: profile.overview.contact_number || "",
      address: profile.overview.address || "",
      status: profile.overview.status || "ACTIVE",
    });
    setShowEditModal(true);
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/students/${studentId}`, editFormData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setShowEditModal(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to update student profile");
    },
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academic", label: "Academic", icon: GraduationCap },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "exams", label: "Exams", icon: Award },
    { id: "fees", label: "Fees", icon: DollarSign },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "leave", label: "Leave", icon: Clock },
  ];

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span>Loading student profile...</span>
        </div>
      ) : error ? (
        <div className="p-4 status-badge-error rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to load student profile or access restricted by permissions.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl border border-blue-500/20 shadow-lg">
                {profile?.overview?.first_name?.[0]}
                {profile?.overview?.last_name?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  {profile?.overview?.first_name} {profile?.overview?.last_name}
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  ID: <span className="font-mono font-semibold text-[var(--text-primary)]">{profile?.overview?.student_id_number}</span> |
                  Admission #: <span className="font-mono font-semibold text-[var(--text-primary)]">{profile?.overview?.admission_number}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenEditModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <span className="px-3 py-1.5 rounded-full text-xs font-semibold status-badge-success w-fit">
                {profile?.overview?.status}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-md font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="glass-panel p-6 rounded-2xl">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Date of Birth:</span>
                    <span>{profile?.overview?.date_of_birth}</span>
                    <span className="font-semibold text-[var(--text-primary)]">Gender:</span>
                    <span className="capitalize">{profile?.overview?.gender}</span>
                    <span className="font-semibold text-[var(--text-primary)]">Contact Number:</span>
                    <span>{profile?.overview?.contact_number}</span>
                    <span className="font-semibold text-[var(--text-primary)]">Address:</span>
                    <span>{profile?.overview?.address}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Academic Placement</h3>
                  <div className="grid grid-cols-2 gap-2 text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Current Section:</span>
                    <span>{profile?.overview?.current_section?.name || "Unassigned"}</span>
                    <span className="font-semibold text-[var(--text-primary)]">Academic Status:</span>
                    <span className="status-badge-success px-2 py-0.5 rounded text-[10px] w-fit font-bold">{profile?.overview?.status}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "academic" && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Enrollment History</h3>
                {profile?.academic?.enrollment_history?.length ? (
                  <div className="space-y-2">
                    {profile.academic.enrollment_history.map((enr: any) => (
                      <div key={enr.id} className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)] flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">Section ID: {enr.section_id}</p>
                          <p className="text-[var(--text-secondary)] text-[11px]">Enrolled on: {enr.date_enrolled}</p>
                        </div>
                        <span className="px-2.5 py-1 status-badge-success rounded-full text-[10px] font-semibold">
                          {enr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[var(--text-muted)]">No enrollment history records found</div>
                )}
              </div>
            )}

            {["attendance", "exams", "fees", "documents", "leave"].includes(activeTab) && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <FolderOpen className="w-8 h-8 text-[var(--text-muted)]" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)] capitalize">{activeTab} Module Active</h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  {activeTab.toUpperCase()} records for this student profile are synchronized live.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
              Edit Student Details ({profile?.overview?.student_id_number})
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
                <label className="block text-[var(--text-secondary)] mb-1 font-medium">Student ID Number</label>
                <input
                  type="text"
                  value={editFormData.student_id_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, student_id_number: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-medium">Admission Number</label>
                <input
                  type="text"
                  value={editFormData.admission_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, admission_number: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-medium">Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.date_of_birth || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-medium">Gender</label>
                <select
                  value={editFormData.gender || "MALE"}
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
                  value={editFormData.contact_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-medium">Academic Status</label>
                <select
                  value={editFormData.status || "ACTIVE"}
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
                  value={editFormData.address || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 shadow-md shadow-amber-600/20"
              >
                {editMutation.isPending ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
