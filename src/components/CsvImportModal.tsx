'use client';

import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please paste or upload CSV content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import CSV');

      setResult(data.result);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleCsv = () => {
    setCsvContent(`First Name,Last Name,Email,Phone,Company,Job Title,Value,Source
David,Miller,david.miller@acmecorp.com,+1-415-555-8811,Acme Industrial,Chief Operating Officer,65000,WEBSITE
Rachel,Green,rachel.green@fashionpulse.net,+1-212-555-4499,Fashion Pulse,VP Merchandising,42000,REFERRAL
Vikram,Malhotra,vikram.m@delhitech.in,+91-98111-22334,Delhi Tech Labs,Founder & CEO,80000,PHONE_CALL`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Bulk Import Leads from CSV</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Import Completed Successfully
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-emerald-700">
                  <div>Total Rows: <strong>{result.totalRows}</strong></div>
                  <div>Imported: <strong>{result.importedCount}</strong></div>
                  <div>Duplicates Skipped: <strong>{result.duplicateCount}</strong></div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Import Row Notices:</p>
                  {result.errors.map((err: any, idx: number) => (
                    <p key={idx} className="text-[11px] text-slate-600">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Paste CSV data or load template</label>
                <button
                  type="button"
                  onClick={loadSampleCsv}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Load Sample Data
                </button>
              </div>

              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="First Name,Last Name,Email,Phone,Company,Job Title,Value,Source"
                className="w-full rounded-lg border border-slate-200 p-3 text-xs font-mono focus:border-blue-500 focus:outline-none"
              />

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Security & Integrity Protections:</p>
                <p>• Automated Spreadsheet Formula Injection sanitization applied on all input cells.</p>
                <p>• Duplicate checking is performed automatically against existing email and phone records.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Run Import'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
