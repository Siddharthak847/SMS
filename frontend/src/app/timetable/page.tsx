"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileSpreadsheet, Clock, UserCheck, BookOpen, MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function TimetablePage() {
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<any>(null);

  // Form State
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("MON");
  const [periodNumber, setPeriodNumber] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");
  const [roomNumber, setRoomNumber] = useState("Room 101");

  // Fetch sections
  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const classesRes = await api.get("/classes/");
      const allSections: any[] = [];
      for (const cls of classesRes.data) {
        const secRes = await api.get(`/classes/${cls.id}/sections`);
        allSections.push(...secRes.data.map((s: any) => ({ ...s, className: cls.name })));
      }
      if (allSections.length > 0 && !selectedSection) {
        setSelectedSection(allSections[0].id);
      }
      return allSections;
    },
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/subjects/")).data,
  });

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await api.get("/teachers/")).data,
  });

  // Fetch timetable slots for selected section
  const { data: timetableSlots, isLoading } = useQuery({
    queryKey: ["timetable", selectedSection],
    enabled: !!selectedSection,
    queryFn: async () => {
      const res = await api.get(`/timetable/section/${selectedSection}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const sId = subjectId || subjects?.[0]?.id;
      const tId = teacherId || teachers?.[0]?.id;
      return api.post("/timetable/slots", {
        section_id: selectedSection,
        subject_id: sId,
        teacher_id: tId,
        day_of_week: dayOfWeek,
        period_number: Number(periodNumber),
        start_time: startTime,
        end_time: endTime,
        room_number: roomNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable", selectedSection] });
      setShowModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create timetable slot"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/timetable/slots/${slotToEdit.id}`, {
        subject_id: subjectId,
        teacher_id: teacherId,
        day_of_week: dayOfWeek,
        period_number: Number(periodNumber),
        start_time: startTime,
        end_time: endTime,
        room_number: roomNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable", selectedSection] });
      setSlotToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update timetable slot"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/timetable/slots/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timetable", selectedSection] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete slot"),
  });

  const handleOpenAdd = (day?: string) => {
    setSlotToEdit(null);
    setSubjectId(subjects?.[0]?.id || "");
    setTeacherId(teachers?.[0]?.id || "");
    setDayOfWeek(day || "MON");
    setPeriodNumber(1);
    setStartTime("09:00");
    setEndTime("09:45");
    setRoomNumber("Room 101");
    setShowModal(true);
  };

  const handleOpenEdit = (slot: any) => {
    setSlotToEdit(slot);
    setSubjectId(slot.subject_id);
    setTeacherId(slot.teacher_id);
    setDayOfWeek(slot.day_of_week);
    setPeriodNumber(slot.period_number);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setRoomNumber(slot.room_number || "Room 101");
  };

  const days = ["MON", "TUE", "WED", "THU", "FRI"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
              Class Timetable Schedule
            </h1>
            <p className="text-xs text-slate-400">Weekly period allocation and teacher clash-validated schedule</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              >
                {sections?.map((sec: any) => (
                  <option key={sec.id} value={sec.id} className="bg-slate-900 text-slate-200">
                    {sec.className} - {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenAdd()}
              disabled={!selectedSection}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Period Slot</span>
            </button>
          </div>
        </div>

        {/* Timetable Schedule Grid */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Loading timetable slots...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-w-[750px]">
              {days.map((day) => {
                const daySlots = timetableSlots?.filter((s: any) => s.day_of_week === day) || [];
                return (
                  <div key={day} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between py-1 px-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-xs font-bold text-indigo-400">
                      <span>{day}</span>
                      <button
                        onClick={() => handleOpenAdd(day)}
                        className="p-0.5 rounded hover:bg-indigo-500/20 text-indigo-300"
                        title={`Add period for ${day}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-4">No periods scheduled</p>
                    ) : (
                      daySlots.map((slot: any) => (
                        <div
                          key={slot.id}
                          className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 shadow-sm relative group"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                            <span className="font-semibold text-indigo-300">Period {slot.period_number}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            {slot.subject_name || "Subject Period"}
                          </div>

                          <div className="text-[11px] text-slate-300 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            {slot.teacher_name || "Teacher"}
                          </div>

                          {slot.room_number && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {slot.room_number}
                            </div>
                          )}

                          <div className="pt-2 flex justify-end space-x-1 text-[10px]">
                            <button
                              onClick={() => handleOpenEdit(slot)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                            >
                              <Pencil className="w-3 h-3 inline mr-0.5" /> Edit
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(slot.id)}
                              className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                            >
                              <Trash2 className="w-3 h-3 inline mr-0.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create / Edit Slot Modal */}
        {(showModal || slotToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3">
                {slotToEdit ? "Edit Timetable Period Slot" : "Create Timetable Period Slot"}
              </h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Day of Week</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    >
                      <option value="MON font-medium">MON</option>
                      <option value="TUE">TUE</option>
                      <option value="WED">WED</option>
                      <option value="THU">THU</option>
                      <option value="FRI">FRI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Period #</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={periodNumber}
                      onChange={(e) => setPeriodNumber(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Assigned Teacher</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {teachers?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Start Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">End Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:45"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Room / Classroom</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSlotToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (slotToEdit ? editMutation.mutate() : createMutation.mutate())}
                  disabled={createMutation.isPending || editMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {slotToEdit ? "Update Slot" : "Save Slot"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
