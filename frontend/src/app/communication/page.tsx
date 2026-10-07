"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageSquare, Plus, Bell, AlertCircle, ShieldAlert, Pencil, Trash2, Loader2 } from "lucide-react";

export default function CommunicationPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [isImportant, setIsImportant] = useState(false);

  // Fetch announcements
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await api.get("/communication/")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/communication/", {
        title,
        content,
        target_role: targetRole,
        is_important: isImportant,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setShowCreateModal(false);
      setTitle("");
      setContent("");
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to publish announcement"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/communication/${noticeToEdit.id}`, {
        title,
        content,
        target_role: targetRole,
        is_important: isImportant,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setNoticeToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update notice"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/communication/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete notice"),
  });

  const handleOpenEditModal = (ann: any) => {
    setNoticeToEdit(ann);
    setTitle(ann.title || "");
    setContent(ann.content || "");
    setTargetRole(ann.target_role || "ALL");
    setIsImportant(!!ann.is_important);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              School Noticeboard & Announcements
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Broadcast official school circulars and targeted notifications</p>
          </div>
          <button
            onClick={() => {
              setTitle("");
              setContent("");
              setTargetRole("ALL");
              setIsImportant(false);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="glass-panel p-8 text-center text-[var(--text-secondary)] text-xs rounded-2xl border border-[var(--border-color)] flex justify-center items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading notices...</span>
            </div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="glass-panel p-8 text-center text-[var(--text-muted)] text-xs rounded-2xl border border-[var(--border-color)]">
              No announcements published yet.
            </div>
          ) : (
            announcements.map((ann: any) => (
              <div
                key={ann.id}
                className={`glass-panel p-5 rounded-2xl border transition space-y-3 ${
                  ann.is_important
                    ? "border-amber-500/40 bg-amber-500/5 shadow-md"
                    : "border-[var(--border-color)] hover:border-blue-500/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {ann.is_important ? (
                      <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                    ) : (
                      <Bell className="w-5 h-5 text-blue-500 shrink-0" />
                    )}
                    <h3 className="font-bold text-[var(--text-primary)] text-sm">{ann.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="px-2.5 py-0.5 rounded-full font-semibold status-badge-info">
                      Target: {ann.target_role}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => handleOpenEditModal(ann)}
                      className="p-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 ml-2"
                      title="Edit Notice"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(ann.id)}
                      className="p-1 rounded-lg status-badge-error"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line pl-7 font-medium">
                  {ann.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || noticeToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {noticeToEdit ? "Edit Notice Announcement" : "Publish School Announcement"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Announcement Title</label>
                  <input
                    type="text"
                    placeholder="Notice title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Audience Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="ALL">Everyone (All Roles)</option>
                    <option value="TEACHER">Teachers Only</option>
                    <option value="PARENT">Parents Only</option>
                    <option value="STUDENT">Students Only</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="important"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded border-[var(--border-color)] text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="important" className="text-[var(--text-primary)] text-xs select-none font-medium">
                    Mark as Important / Urgent Notice
                  </label>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Content</label>
                  <textarea
                    rows={4}
                    placeholder="Full notice details..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNoticeToEdit(null);
                  }}
                  className="px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (noticeToEdit ? editMutation.mutate() : createMutation.mutate())}
                  disabled={!title || !content}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {noticeToEdit ? "Update Notice" : "Publish Notice"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
