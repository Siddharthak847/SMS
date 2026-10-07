"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { UserPlus, Search, CheckCircle, XCircle, UserCheck, Loader2, AlertCircle, Plus, Pencil } from "lucide-react";

export default function AdmissionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState("");

  // Status Change Modal State
  const [appToChangeStatus, setAppToChangeStatus] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("VERIFIED");
  const [remarks, setRemarks] = useState("");

  // New Application State
  const [showAddModal, setShowAddModal] = useState(false);
  const [appFormData, setAppFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "2015-08-20",
    gender: "MALE",
    parent_name: "Parent Contact",
    parent_email: "parent.admission@gmail.com",
    parent_phone: "+1555030088",
    address: "Westside Residency",
    target_class_id: "",
    target_academic_year_id: "",
  });

  const { data: appsData, isLoading } = useQuery({
    queryKey: ["admissions", statusFilter, search],
    queryFn: async () => {
      const res = await api.get("/admissions/", {
        params: { status_filter: statusFilter, search },
      });
      return res.data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes-admissions"],
    queryFn: async () => (await api.get("/classes/")).data,
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years-admissions"],
    queryFn: async () => (await api.get("/academic-years/")).data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections-admissions"],
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

  const createAdmissionMutation = useMutation({
    mutationFn: async () => {
      const clsId = appFormData.target_class_id || classes?.[0]?.id;
      const ayId = appFormData.target_academic_year_id || academicYears?.[0]?.id;
      return api.post("/admissions/", {
        ...appFormData,
        target_class_id: clsId,
        target_academic_year_id: ayId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowAddModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create application"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/admissions/${appToChangeStatus.id}/status`, { status: newStatus, remarks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      setAppToChangeStatus(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update status"),
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const secId = targetSectionId || sections?.[0]?.id;
      return api.post(`/admissions/${selectedAppId}/enroll?section_id=${secId}`);
    },
    onSuccess: () => {
      setSelectedAppId(null);
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to enroll student"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admissions Portal</h1>
            <p className="text-xs text-[var(--text-secondary)]">Review candidate applications and convert approved applicants to enrolled students</p>
          </div>

          <button
            onClick={() => {
              setAppFormData({
                first_name: "",
                last_name: "",
                date_of_birth: "2015-08-20",
                gender: "MALE",
                parent_name: "Parent Contact",
                parent_email: "parent.admission@gmail.com",
                parent_phone: "+1555030088",
                address: "Westside Residency",
                target_class_id: classes?.[0]?.id || "",
                target_academic_year_id: academicYears?.[0]?.id || "",
              });
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Submit New Application</span>
          </button>
        </div>

        {/* Filter and Search */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search application # or applicant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs w-full md:w-auto bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            <option value="">All Application Statuses</option>
            <option value="APPLIED">APPLIED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ENROLLED">ENROLLED</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading applications...</span>
            </div>
          ) : !appsData?.items?.length ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No admission applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Applicant</th>
                    <th className="p-4">App #</th>
                    <th className="p-4">Parent Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {appsData.items.map((app: any) => (
                    <tr key={app.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {app.first_name} {app.last_name}
                        <span className="block text-[10px] text-[var(--text-secondary)] font-normal">DOB: {app.date_of_birth}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{app.application_number}</td>
                      <td className="p-4 text-[var(--text-primary)] font-medium">
                        {app.parent_name}
                        <span className="block text-[10px] text-[var(--text-secondary)] font-normal">{app.parent_email}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            app.status === "APPROVED"
                              ? "status-badge-success"
                              : app.status === "ENROLLED"
                              ? "status-badge-info"
                              : app.status === "REJECTED"
                              ? "status-badge-error"
                              : "status-badge-warning"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setAppToChangeStatus(app);
                            setNewStatus(app.status);
                            setRemarks(app.remarks || "");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold"
                        >
                          Update Status
                        </button>

                        {app.status === "APPROVED" && (
                          <button
                            onClick={() => {
                              setSelectedAppId(app.id);
                              setTargetSectionId(sections?.[0]?.id || "");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20"
                          >
                            Enroll Student
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submit New Application Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Submit New Student Admission Form
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Applicant First Name</label>
                  <input
                    type="text"
                    value={appFormData.first_name}
                    onChange={(e) => setAppFormData({ ...appFormData, first_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Applicant Last Name</label>
                  <input
                    type="text"
                    value={appFormData.last_name}
                    onChange={(e) => setAppFormData({ ...appFormData, last_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={appFormData.date_of_birth}
                    onChange={(e) => setAppFormData({ ...appFormData, date_of_birth: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Gender</label>
                  <select
                    value={appFormData.gender}
                    onChange={(e) => setAppFormData({ ...appFormData, gender: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={appFormData.parent_name}
                    onChange={(e) => setAppFormData({ ...appFormData, parent_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Parent Email</label>
                  <input
                    type="email"
                    value={appFormData.parent_email}
                    onChange={(e) => setAppFormData({ ...appFormData, parent_email: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createAdmissionMutation.mutate()}
                  disabled={!appFormData.first_name || !appFormData.last_name}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Status Modal */}
        {appToChangeStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Update Status ({appToChangeStatus.application_number})
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Application Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="APPLIED">APPLIED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="ENROLLED">ENROLLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Remarks / Evaluation Notes</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Document verification completed"
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setAppToChangeStatus(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Modal */}
        {selectedAppId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Enroll Applicant as Student
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Select target section to assign class enrollment</p>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Target Section</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {sections?.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.className} - {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setSelectedAppId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Confirm Enrollment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
