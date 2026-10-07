"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Calendar, Plus, MapPin, Clock, Pencil, Trash2, Loader2 } from "lucide-react";

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "12:00",
    location: "Main Auditorium",
    event_type: "CULTURAL",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["school-events"],
    queryFn: async () => (await api.get("/events/")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/events/", formData),
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create event"),
  });

  const editMutation = useMutation({
    mutationFn: async () => api.put(`/events/${eventToEdit.id}`, formData),
    onSuccess: () => {
      setEventToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update event"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["school-events"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete event"),
  });

  const handleOpenEditModal = (evt: any) => {
    setEventToEdit(evt);
    setFormData({
      title: evt.title || "",
      description: evt.description || "",
      event_date: evt.event_date || new Date().toISOString().split("T")[0],
      start_time: evt.start_time || "09:00",
      end_time: evt.end_time || "12:00",
      location: evt.location || "Main Auditorium",
      event_type: evt.event_type || "CULTURAL",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              School Event & Calendar Management
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Organize sports days, annual galas, parent-teacher meetings, and academic trips</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                event_date: new Date().toISOString().split("T")[0],
                start_time: "09:00",
                end_time: "12:00",
                location: "Main Auditorium",
                event_type: "CULTURAL",
              });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-[var(--text-secondary)] text-xs flex justify-center items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading event calendar...</span>
            </div>
          ) : !events || events.length === 0 ? (
            <div className="col-span-full glass-panel p-12 text-center text-[var(--text-muted)] text-xs rounded-2xl border border-[var(--border-color)]">
              No school events scheduled yet. Click "Create New Event" to schedule one.
            </div>
          ) : (
            events.map((evt: any) => (
              <div key={evt.id} className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4 hover:border-blue-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold status-badge-info uppercase">
                    {evt.event_type}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] font-mono font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {evt.event_date}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-base">{evt.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-medium">{evt.description}</p>
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{evt.start_time} - {evt.end_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(evt)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                      title="Edit Event"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(evt.id)}
                      className="p-1.5 rounded-lg status-badge-error"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create / Edit Modal */}
        {(showModal || eventToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {eventToEdit ? "Edit Event Details" : "Schedule School Event"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Annual Sports Day 2026"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="Provide event overview and schedule details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">Date</label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">Event Type</label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    >
                      <option value="ACADEMIC">ACADEMIC</option>
                      <option value="SPORTS">SPORTS</option>
                      <option value="CULTURAL">CULTURAL</option>
                      <option value="MEETING">MEETING</option>
                      <option value="HOLIDAY">HOLIDAY</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">Start Time</label>
                    <input
                      type="text"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">End Time</label>
                    <input
                      type="text"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Location / Venue</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Main Ground / Auditorium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEventToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (eventToEdit ? editMutation.mutate() : createMutation.mutate())}
                  disabled={!formData.title}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {eventToEdit ? "Update Event" : "Save Event"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
