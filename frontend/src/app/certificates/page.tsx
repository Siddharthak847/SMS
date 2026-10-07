"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Award, FileText, Printer, Plus, Search, ShieldCheck } from "lucide-react";

export default function CertificatesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [studentId, setStudentId] = useState("");
  const [certType, setCertType] = useState("BONAFIDE");
  const [remarks, setRemarks] = useState("");

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const res = await api.get("/certificates/");
      return res.data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students-list"],
    queryFn: async () => {
      const res = await api.get("/students/");
      return res.data.items || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return api.post("/certificates/generate", {
        student_id: studentId,
        certificate_type: certType,
        remarks: remarks || null,
      });
    },
    onSuccess: () => {
      setShowModal(false);
      setStudentId("");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to generate certificate");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              Certificate Generation & Management
            </h1>
            <p className="text-xs text-slate-400">Issue Bonafide, Study, Character, Transfer, and Achievement certificates</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Certificate</span>
          </button>
        </div>

        {/* Certificate List Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading certificate logs...</div>
          ) : !certificates || certificates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No official certificates generated yet.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Certificate #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {certificates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-semibold text-indigo-400">{c.certificate_number}</td>
                    <td className="px-4 py-3 font-sans font-medium">{c.certificate_type}</td>
                    <td className="px-4 py-3 text-slate-400">{c.issue_date}</td>
                    <td className="px-4 py-3 text-slate-400">{c.student_id}</td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedCert(c)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-800 text-xs inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-400" /> Preview & Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Generate Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-100">Generate Student Certificate</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Select Student</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">-- Choose Student --</option>
                    {students?.map((s: any) => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {s.first_name} {s.last_name} ({s.student_id_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Certificate Type</label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="BONAFIDE">Bonafide Certificate</option>
                    <option value="STUDY">Study & Conduct Certificate</option>
                    <option value="CHARACTER">Character Certificate</option>
                    <option value="TRANSFER">Transfer Certificate (TC)</option>
                    <option value="ACHIEVEMENT">Excellence & Achievement Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Remarks / Note</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    placeholder="Optional details or achievement reasons..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending || !studentId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white disabled:opacity-50"
                >
                  Generate Official Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Preview & Print Modal */}
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 w-full max-w-2xl p-8 rounded-2xl border-2 border-indigo-500/40 text-slate-100 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">
                    SMS
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">SCHOOL ERP ENTERPRISE</h2>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest">OFFICIAL ACADEMIC CERTIFICATE</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="bg-slate-950/80 p-8 rounded-xl border border-slate-800 text-center space-y-6 relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-indigo-400">Ref: {selectedCert.certificate_number}</span>
                  <h1 className="text-2xl font-bold tracking-wide uppercase text-amber-400 pt-2">
                    {selectedCert.certificate_type} CERTIFICATE
                  </h1>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
                  This is to certify that student record ID <span className="font-mono text-indigo-300 font-bold">{selectedCert.student_id}</span> has successfully been granted this official <span className="font-semibold">{selectedCert.certificate_type} Certificate</span> by the institution on <span className="font-mono">{selectedCert.issue_date}</span>.
                </p>

                {selectedCert.remarks && (
                  <p className="text-xs italic text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800 max-w-md mx-auto">
                    "{selectedCert.remarks}"
                  </p>
                )}

                <div className="pt-8 flex items-center justify-between text-xs text-slate-400">
                  <div>
                    <p className="border-t border-slate-700 pt-1 font-semibold text-slate-300">Authorized Signatory</p>
                    <p className="text-[10px]">Principal / Controller of Exams</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-700 pt-1 font-semibold text-slate-300">Institutional Seal</p>
                    <p className="text-[10px]">Verified Digital Document</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
