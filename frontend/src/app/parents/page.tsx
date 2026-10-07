"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function ParentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const [parentToEdit, setParentToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "Password123!",
    phone: "+1555020099",
    occupation: "Senior Professional / Engineer",
    address: "250 Residential Avenue, City",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["parents", search, page],
    queryFn: async () => {
      const res = await api.get("/parents/", {
        params: { search, page, size: 10 },
      });
      return res.data;
    },
  });

  const createParentMutation = useMutation({
    mutationFn: async () => api.post("/parents/", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      setShowModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to register parent account"),
  });

  const editParentMutation = useMutation({
    mutationFn: async () => api.put(`/parents/${parentToEdit.id}`, editFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      setParentToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update parent record"),
  });

  const deleteParentMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/parents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parents"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete parent record"),
  });

  const handleOpenEditModal = (p: any) => {
    setParentToEdit(p);
    setEditFormData({
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      phone: p.phone || "",
      email: p.email || "",
      occupation: p.occupation || "",
      address: p.address || "",
    });
  };

  const handleOpenModal = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      username: `parent_${rand}`,
      email: `parent_${rand}@gmail.com`,
    }));
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Parent & Guardian Directory</h1>
            <p className="text-xs text-[var(--text-secondary)]">Manage parent profiles, emergency contacts, and linked student accounts</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Parent / Guardian</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search parent name, phone, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs"
            />
          </div>
        </div>

        {/* Parents Table */}
        <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-[var(--text-secondary)] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading parents...</span>
            </div>
          ) : !data?.items?.length ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No matching parent records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Parent / Guardian Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Occupation</th>
                    <th className="p-4">Address</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {data.items.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-4 text-[var(--text-primary)] font-mono font-medium">{p.phone || "N/A"}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{p.email}</td>
                      <td className="p-4 text-[var(--text-primary)]">{p.occupation || "N/A"}</td>
                      <td className="p-4 text-[var(--text-secondary)] truncate max-w-xs">{p.address || "N/A"}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold transition"
                          title="Edit Parent"
                        >
                          <Pencil className="w-3.5 h-3.5 inline" /> Edit
                        </button>
                        <button
                          onClick={() => deleteParentMutation.mutate(p.id)}
                          className="px-2.5 py-1.5 rounded-lg status-badge-error text-xs font-semibold transition"
                          title="Delete Parent"
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

        {/* Add Parent Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Register New Parent Account
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. David"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Miller"
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
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createParentMutation.mutate()}
                  disabled={!formData.first_name || !formData.last_name || createParentMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {createParentMutation.isPending ? "Registering..." : "Save Parent Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Parent Modal */}
        {parentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-[var(--border-color)] space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Edit Parent Record
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
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Occupation</label>
                  <input
                    type="text"
                    value={editFormData.occupation || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
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
                  onClick={() => setParentToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editParentMutation.mutate()}
                  disabled={editParentMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 shadow-md shadow-amber-600/20"
                >
                  {editParentMutation.isPending ? "Updating..." : "Update Parent Record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
