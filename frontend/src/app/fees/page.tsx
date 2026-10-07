"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DollarSign,
  Receipt,
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  FolderPlus,
  Loader2,
} from "lucide-react";

export default function FeesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"invoices" | "structures" | "categories">("invoices");

  // Payment State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  // Edit Invoice State
  const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
  const [editInvoiceData, setEditInvoiceData] = useState<any>({
    total_amount: 0,
    discount_amount: 0,
    due_date: "",
    status: "UNPAID",
  });

  // Category State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "" });

  // Structure State
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [structureToEdit, setStructureToEdit] = useState<any>(null);
  const [structureFormData, setStructureFormData] = useState({
    academic_year_id: "",
    class_id: "",
    fee_category_id: "",
    amount: 1000,
    due_date: "2026-12-31",
  });

  // Queries
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ["fee-invoices"],
    queryFn: async () => (await api.get("/fees/invoices")).data,
  });

  const { data: structures, isLoading: loadingStructures } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => (await api.get("/fees/structures")).data,
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["fee-categories"],
    queryFn: async () => (await api.get("/fees/categories")).data,
  });

  const { data: classes } = useQuery({
    queryKey: ["all-classes-fees"],
    queryFn: async () => (await api.get("/classes/")).data,
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years-fees"],
    queryFn: async () => (await api.get("/academic-years/")).data,
  });

  // Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      return api.post("/fees/payments", {
        invoice_id: selectedInvoice.id,
        amount_paid: Number(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: `TXN-${Date.now()}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-invoices"] });
      setSelectedInvoice(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Payment failed");
    },
  });

  // Edit Invoice Mutation
  const editInvoiceMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/fees/invoices/${invoiceToEdit.id}`, {
        total_amount: Number(editInvoiceData.total_amount),
        discount_amount: Number(editInvoiceData.discount_amount),
        due_date: editInvoiceData.due_date,
        status: editInvoiceData.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-invoices"] });
      setInvoiceToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update invoice"),
  });

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async () => api.post("/fees/categories", categoryFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-categories"] });
      setShowAddCategoryModal(false);
      setCategoryFormData({ name: "", description: "" });
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create category"),
  });

  // Edit Category Mutation
  const editCategoryMutation = useMutation({
    mutationFn: async () => api.put(`/fees/categories/${categoryToEdit.id}`, categoryFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-categories"] });
      setCategoryToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update category"),
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/fees/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fee-categories"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete category"),
  });

  // Create Structure Mutation
  const createStructureMutation = useMutation({
    mutationFn: async () => {
      const clsId = structureFormData.class_id || classes?.[0]?.id;
      const ayId = structureFormData.academic_year_id || academicYears?.[0]?.id;
      const catId = structureFormData.fee_category_id || categories?.[0]?.id;
      return api.post("/fees/structures", {
        ...structureFormData,
        class_id: clsId,
        academic_year_id: ayId,
        fee_category_id: catId,
        amount: Number(structureFormData.amount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      queryClient.invalidateQueries({ queryKey: ["fee-invoices"] });
      setShowAddStructureModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to create fee structure"),
  });

  // Edit Structure Mutation
  const editStructureMutation = useMutation({
    mutationFn: async () => api.put(`/fees/structures/${structureToEdit.id}`, {
      amount: Number(structureFormData.amount),
      due_date: structureFormData.due_date,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      setStructureToEdit(null);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to update fee structure"),
  });

  // Delete Structure Mutation
  const deleteStructureMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/fees/structures/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fee-structures"] }),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to delete fee structure"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              Fee & Financial Management
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Manage fee structures, student invoices, fee categories, and collections</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCategoryFormData({ name: "", description: "" });
                setShowAddCategoryModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] font-semibold text-xs transition"
            >
              <FolderPlus className="w-4 h-4 text-blue-500" />
              <span>+ Add Category</span>
            </button>

            <button
              onClick={() => {
                setStructureFormData({
                  academic_year_id: academicYears?.[0]?.id || "",
                  class_id: classes?.[0]?.id || "",
                  fee_category_id: categories?.[0]?.id || "",
                  amount: 1000,
                  due_date: "2026-12-31",
                });
                setShowAddStructureModal(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Fee Structure</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-[var(--border-color)] flex items-center space-x-3">
            <div className="p-3 status-badge-success rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Total Invoices Issued</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{invoices?.length || 0}</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-[var(--border-color)] flex items-center space-x-3">
            <div className="p-3 status-badge-info rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Fee Structures Active</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{structures?.length || 0}</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-[var(--border-color)] flex items-center space-x-3">
            <div className="p-3 status-badge-warning rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Pending Collections</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {invoices?.filter((i: any) => i.status !== "PAID").length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-[var(--border-color)] pb-2">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "invoices"
                ? "bg-blue-600 text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Student Invoices ({invoices?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("structures")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "structures"
                ? "bg-blue-600 text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Fee Structures ({structures?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "categories"
                ? "bg-blue-600 text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Categories ({categories?.length || 0})
          </button>
        </div>

        {/* Tab 1: Invoices Table */}
        {activeTab === "invoices" && (
          <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
            {loadingInvoices ? (
              <div className="p-12 text-center text-[var(--text-secondary)] text-xs flex justify-center items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span>Loading fee invoices...</span>
              </div>
            ) : !invoices?.length ? (
              <div className="p-12 text-center text-[var(--text-muted)] text-xs">No fee invoices recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {invoices.map((inv: any) => {
                    const net = inv.total_amount - inv.discount_amount;
                    const balance = net - inv.paid_amount;
                    return (
                      <tr key={inv.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                        <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{inv.invoice_number}</td>
                        <td className="p-4 font-semibold text-[var(--text-primary)]">${inv.total_amount.toFixed(2)}</td>
                        <td className="p-4 text-[var(--text-secondary)]">${inv.discount_amount.toFixed(2)}</td>
                        <td className="p-4 text-emerald-600 font-semibold">${inv.paid_amount.toFixed(2)}</td>
                        <td className="p-4 text-amber-600 font-bold">${balance.toFixed(2)}</td>
                        <td className="p-4 text-[var(--text-secondary)]">{inv.due_date}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                              inv.status === "PAID"
                                ? "status-badge-success"
                                : inv.status === "PARTIAL"
                                ? "status-badge-info"
                                : "status-badge-warning"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setInvoiceToEdit(inv);
                              setEditInvoiceData({
                                total_amount: inv.total_amount,
                                discount_amount: inv.discount_amount,
                                due_date: inv.due_date,
                                status: inv.status,
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5 inline" />
                          </button>

                          {inv.status !== "PAID" && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(balance);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Collect Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Fee Structures */}
        {activeTab === "structures" && (
          <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
            {loadingStructures ? (
              <div className="p-12 text-center text-[var(--text-secondary)] text-xs">Loading structures...</div>
            ) : !structures?.length ? (
              <div className="p-12 text-center text-[var(--text-muted)] text-xs">No active fee structures found.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Structure ID</th>
                    <th className="p-4">Class ID</th>
                    <th className="p-4">Fee Amount</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {structures.map((st: any) => (
                    <tr key={st.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                      <td className="p-4 font-mono text-[var(--text-secondary)]">{st.id.slice(0, 8)}...</td>
                      <td className="p-4 font-semibold text-[var(--text-primary)]">{st.class_id}</td>
                      <td className="p-4 text-emerald-600 font-bold">${st.amount.toFixed(2)}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{st.due_date}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setStructureToEdit(st);
                            setStructureFormData({
                              academic_year_id: st.academic_year_id,
                              class_id: st.class_id,
                              fee_category_id: st.fee_category_id,
                              amount: st.amount,
                              due_date: st.due_date,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5 inline" /> Edit
                        </button>
                        <button
                          onClick={() => deleteStructureMutation.mutate(st.id)}
                          className="px-2.5 py-1.5 rounded-lg status-badge-error text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Categories */}
        {activeTab === "categories" && (
          <div className="glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden">
            {loadingCategories ? (
              <div className="p-12 text-center text-[var(--text-secondary)] text-xs">Loading categories...</div>
            ) : !categories?.length ? (
              <div className="p-12 text-center text-[var(--text-muted)] text-xs">No fee categories defined yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Category Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {categories.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                      <td className="p-4 font-bold text-[var(--text-primary)]">{cat.name}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{cat.description || "N/A"}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setCategoryToEdit(cat);
                            setCategoryFormData({ name: cat.name, description: cat.description || "" });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5 inline" /> Edit
                        </button>
                        <button
                          onClick={() => deleteCategoryMutation.mutate(cat.id)}
                          className="px-2.5 py-1.5 rounded-lg status-badge-error text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Record Payment Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Collect Fee Payment
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono">Invoice #{selectedInvoice.invoice_number}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Payment Amount ($)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="ONLINE">Online Card Payment</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => paymentMutation.mutate()}
                  disabled={paymentAmount <= 0 || paymentMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  {paymentMutation.isPending ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Invoice Modal */}
        {invoiceToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                Edit Invoice #{invoiceToEdit.invoice_number}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Total Amount ($)</label>
                  <input
                    type="number"
                    value={editInvoiceData.total_amount}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, total_amount: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Discount Amount ($)</label>
                  <input
                    type="number"
                    value={editInvoiceData.discount_amount}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, discount_amount: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={editInvoiceData.due_date}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, due_date: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Status</label>
                  <select
                    value={editInvoiceData.status}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, status: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setInvoiceToEdit(null)}
                  className="px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editInvoiceMutation.mutate()}
                  disabled={editInvoiceMutation.isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {editInvoiceMutation.isPending ? "Saving..." : "Update Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Category Modal */}
        {(showAddCategoryModal || categoryToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {categoryToEdit ? "Edit Fee Category" : "Add Fee Category"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Category Name</label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    placeholder="e.g. Tuition Fee, Sports Fee"
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Description</label>
                  <input
                    type="text"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    placeholder="e.g. Annual term tuition fee charge"
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setCategoryToEdit(null);
                  }}
                  className="px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (categoryToEdit ? editCategoryMutation.mutate() : createCategoryMutation.mutate())}
                  disabled={!categoryFormData.name}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Structure Modal */}
        {(showAddStructureModal || structureToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                {structureToEdit ? "Edit Fee Structure" : "Create New Fee Structure"}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Fee Amount ($)</label>
                  <input
                    type="number"
                    value={structureFormData.amount}
                    onChange={(e) => setStructureFormData({ ...structureFormData, amount: Number(e.target.value) })}
                    className="w-full glass-input rounded-xl px-3 py-2 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={structureFormData.due_date}
                    onChange={(e) => setStructureFormData({ ...structureFormData, due_date: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  />
                </div>

                {!structureToEdit && (
                  <>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-medium">Class</label>
                      <select
                        value={structureFormData.class_id}
                        onChange={(e) => setStructureFormData({ ...structureFormData, class_id: e.target.value })}
                        className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      >
                        {classes?.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-medium">Fee Category</label>
                      <select
                        value={structureFormData.fee_category_id}
                        onChange={(e) => setStructureFormData({ ...structureFormData, fee_category_id: e.target.value })}
                        className="w-full glass-input rounded-xl px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      >
                        {categories?.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowAddStructureModal(false);
                    setStructureToEdit(null);
                  }}
                  className="px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (structureToEdit ? editStructureMutation.mutate() : createStructureMutation.mutate())}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {structureToEdit ? "Update Structure" : "Create Structure & Generate Invoices"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
