"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bus, MapPin, Plus, Phone, Route, Pencil, Trash2, Loader2 } from "lucide-react";

export default function TransportPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"vehicles" | "routes" | "assignments">("vehicles");

  // Modals state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<any>(null);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<any>(null);

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_number: "",
    registration_number: "",
    capacity: 40,
    driver_name: "",
    driver_phone: "",
    status: "ACTIVE",
  });

  const [routeForm, setRouteForm] = useState({
    route_name: "",
    start_location: "",
    end_location: "",
    fare: 150,
  });

  // Queries
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ["transport-vehicles"],
    queryFn: async () => (await api.get("/transport/vehicles")).data,
  });

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ["transport-routes"],
    queryFn: async () => (await api.get("/transport/routes")).data,
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["transport-assignments"],
    queryFn: async () => (await api.get("/transport/assignments")).data,
  });

  // Vehicle Mutations
  const createVehicleMutation = useMutation({
    mutationFn: async () => api.post("/transport/vehicles", vehicleForm),
    onSuccess: () => {
      setShowVehicleModal(false);
      queryClient.invalidateQueries({ queryKey: ["transport-vehicles"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to add vehicle"),
  });

  const editVehicleMutation = useMutation({
    mutationFn: async () => api.put(`/transport/vehicles/${vehicleToEdit.id}`, vehicleForm),
    onSuccess: () => {
      setVehicleToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["transport-vehicles"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update vehicle"),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/transport/vehicles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transport-vehicles"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete vehicle"),
  });

  // Route Mutations
  const createRouteMutation = useMutation({
    mutationFn: async () => api.post("/transport/routes", routeForm),
    onSuccess: () => {
      setShowRouteModal(false);
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create route"),
  });

  const editRouteMutation = useMutation({
    mutationFn: async () => api.put(`/transport/routes/${routeToEdit.id}`, routeForm),
    onSuccess: () => {
      setRouteToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update route"),
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/transport/routes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transport-routes"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete route"),
  });

  const handleOpenEditVehicleModal = (v: any) => {
    setVehicleToEdit(v);
    setVehicleForm({
      vehicle_number: v.vehicle_number || "",
      registration_number: v.registration_number || "",
      capacity: v.capacity || 40,
      driver_name: v.driver_name || "",
      driver_phone: v.driver_phone || "",
      status: v.status || "ACTIVE",
    });
  };

  const handleOpenEditRouteModal = (r: any) => {
    setRouteToEdit(r);
    setRouteForm({
      route_name: r.route_name || "",
      start_location: r.start_location || "",
      end_location: r.end_location || "",
      fare: r.fare || 150,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Bus className="w-6 h-6 text-blue-500" />
              Transport & Fleet Management
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">School buses, route planning, stop assignments, and student transport rosters</p>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === "vehicles" && (
              <button
                onClick={() => {
                  setVehicleForm({
                    vehicle_number: "",
                    registration_number: "",
                    capacity: 40,
                    driver_name: "",
                    driver_phone: "",
                    status: "ACTIVE",
                  });
                  setShowVehicleModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fleet Vehicle</span>
              </button>
            )}
            {activeTab === "routes" && (
              <button
                onClick={() => {
                  setRouteForm({
                    route_name: "",
                    start_location: "",
                    end_location: "",
                    fare: 150,
                  });
                  setShowRouteModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Route</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-[var(--border-color)] pb-2">
          <button
            onClick={() => setActiveTab("vehicles")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "vehicles"
                ? "bg-blue-600 text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Buses & Vehicles ({vehicles?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "routes"
                ? "bg-blue-600 text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Transport Routes ({routes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "assignments"
                ? "bg-blue-600 text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Student Transport Roster ({assignments?.length || 0})
          </button>
        </div>

        {/* Vehicles Tab */}
        {activeTab === "vehicles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingVehicles ? (
              <div className="col-span-full p-12 text-center text-[var(--text-secondary)] text-xs flex justify-center items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span>Loading vehicles...</span>
              </div>
            ) : !vehicles || vehicles.length === 0 ? (
              <div className="col-span-full p-8 text-center text-[var(--text-muted)] text-xs glass-panel rounded-2xl border border-[var(--border-color)]">
                No fleet vehicles registered yet. Click "Add Fleet Vehicle" to add one.
              </div>
            ) : (
              vehicles.map((v: any) => (
                <div key={v.id} className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-3 hover:border-blue-500/40 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bus className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-[var(--text-primary)] text-sm">{v.vehicle_number}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold status-badge-success">
                      {v.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[var(--text-secondary)] font-medium">
                    <p>Registration #: <span className="font-mono font-semibold text-[var(--text-primary)]">{v.registration_number}</span></p>
                    <p>Passenger Capacity: <span className="font-bold text-blue-600 dark:text-blue-400">{v.capacity} seats</span></p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-primary)] font-medium">
                    <div>
                      <p className="font-bold">{v.driver_name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Driver</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-[var(--text-secondary)] text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span>{v.driver_phone}</span>
                      </div>
                      <button
                        onClick={() => handleOpenEditVehicleModal(v)}
                        className="p-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        title="Edit Vehicle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteVehicleMutation.mutate(v.id)}
                        className="p-1 rounded-lg status-badge-error"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === "routes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingRoutes ? (
              <div className="col-span-full p-12 text-center text-[var(--text-secondary)] text-xs">Loading routes...</div>
            ) : !routes || routes.length === 0 ? (
              <div className="col-span-full p-8 text-center text-[var(--text-muted)] text-xs glass-panel rounded-2xl border border-[var(--border-color)]">
                No transport routes configured.
              </div>
            ) : (
              routes.map((r: any) => (
                <div key={r.id} className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                      <Route className="w-4 h-4 text-blue-500" />
                      {r.route_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">${r.fare} / mo</span>
                      <button
                        onClick={() => handleOpenEditRouteModal(r)}
                        className="p-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        title="Edit Route"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteRouteMutation.mutate(r.id)}
                        className="p-1 rounded-lg status-badge-error"
                        title="Delete Route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-[var(--text-primary)] bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] font-medium">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{r.start_location}</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{r.end_location}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Student Roster Tab */}
        {activeTab === "assignments" && (
          <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
            {loadingAssignments ? (
              <div className="p-8 text-center text-[var(--text-secondary)] text-xs">Loading transport roster...</div>
            ) : !assignments || assignments.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] text-xs">No student transport assignments found.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-secondary)] uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Route ID</th>
                    <th className="px-4 py-3">Pickup Point</th>
                    <th className="px-4 py-3">Drop Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {assignments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-[var(--bg-surface-hover)]">
                      <td className="px-4 py-3 text-blue-600 font-mono font-bold">{a.student_id}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)] font-mono font-semibold">{a.route_id}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-medium">{a.pickup_point}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-medium">{a.drop_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Create/Edit Vehicle Modal */}
        {(showVehicleModal || vehicleToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {vehicleToEdit ? "Edit Fleet Vehicle" : "Add Fleet Vehicle"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Bus / Vehicle Code</label>
                  <input
                    type="text"
                    value={vehicleForm.vehicle_number}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. BUS-101"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Registration Number</label>
                  <input
                    type="text"
                    value={vehicleForm.registration_number}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                    placeholder="e.g. BA-2-PA-8899"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">Capacity (Seats)</label>
                    <input
                      type="number"
                      value={vehicleForm.capacity}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">Status</label>
                    <select
                      value={vehicleForm.status}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Driver Name</label>
                  <input
                    type="text"
                    value={vehicleForm.driver_name}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Driver Phone</label>
                  <input
                    type="text"
                    value={vehicleForm.driver_phone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowVehicleModal(false);
                    setVehicleToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (vehicleToEdit ? editVehicleMutation.mutate() : createVehicleMutation.mutate())}
                  disabled={!vehicleForm.vehicle_number}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {vehicleToEdit ? "Update Vehicle" : "Save Vehicle"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Route Modal */}
        {(showRouteModal || routeToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {routeToEdit ? "Edit Transport Route" : "Create Transport Route"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Route Name</label>
                  <input
                    type="text"
                    value={routeForm.route_name}
                    onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="e.g. Route 1 - North Sector"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">Start Location</label>
                    <input
                      type="text"
                      value={routeForm.start_location}
                      onChange={(e) => setRouteForm({ ...routeForm, start_location: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-medium">End Location</label>
                    <input
                      type="text"
                      value={routeForm.end_location}
                      onChange={(e) => setRouteForm({ ...routeForm, end_location: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Monthly Fare ($)</label>
                  <input
                    type="number"
                    value={routeForm.fare}
                    onChange={(e) => setRouteForm({ ...routeForm, fare: Number(e.target.value) })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowRouteModal(false);
                    setRouteToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (routeToEdit ? editRouteMutation.mutate() : createRouteMutation.mutate())}
                  disabled={!routeForm.route_name}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {routeToEdit ? "Update Route" : "Create Route"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
