'use client';

import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight } from 'lucide-react';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string | null;
    estimatedValue?: number | null;
  } | null;
}

export function ConvertLeadModal({ isOpen, onClose, onSuccess, lead }: ConvertLeadModalProps) {
  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState('');
  const [dealAmount, setDealAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (lead) {
      setDealTitle(`${lead.companyName || lead.firstName} - Enterprise Deal`);
      setDealAmount(lead.estimatedValue || 25000);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createDeal,
          dealTitle,
          dealAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Convert Lead to Customer</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleConvert} className="p-6 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
            <p className="font-semibold text-slate-800">
              Converting: <span className="text-blue-600 font-bold">{lead.firstName} {lead.lastName}</span>
            </p>
            <div className="flex items-center gap-2 text-slate-600">
              <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>Creates Contact: <strong>{lead.firstName} {lead.lastName}</strong></span>
            </div>
            {lead.companyName && (
              <div className="flex items-center gap-2 text-slate-600">
                <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>Creates or links Company: <strong>{lead.companyName}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600">
              <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>Preserves lead timeline, notes, and original attribution</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={createDeal}
                onChange={(e) => setCreateDeal(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Create an active sales opportunity / Deal for this conversion</span>
            </label>

            {createDeal && (
              <div className="mt-3 space-y-3 pl-6 border-l-2 border-blue-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Deal Title</label>
                  <input
                    type="text"
                    required
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Deal Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={dealAmount}
                    onChange={(e) => setDealAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
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
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Converting...' : 'Confirm Conversion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
