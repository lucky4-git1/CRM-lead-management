'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Building, CheckCircle2, ShieldCheck, FileText, ArrowRight, DollarSign } from 'lucide-react';

export default function PublicQuoteSignPage() {
  const params = useParams();
  const id = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetch(`/api/quotes?quoteId=${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.quotes && d.quotes.length > 0) {
            setQuote(d.quotes[0]);
            if (d.quotes[0].status === 'ACCEPTED') setSigned(true);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) return;

    setSigning(true);
    setError('');

    try {
      const res = await fetch(`/api/quotes/${quote?.id || id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign agreement');

      setSigned(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading proposal details...
      </div>
    );
  }

  const lineItems = (quote?.lineItems as any[]) || [
    { name: 'LeadFlow Enterprise Rep License (Annual)', sku: 'LF-ENT-USER', qty: 100, unitPrice: 960 },
    { name: 'Enterprise Dedicated VoIP & Telephony Add-on', sku: 'LF-VOIP-ADDON', qty: 1, unitPrice: 1800 },
    { name: 'Implementation & White-Glove Onboarding', sku: 'LF-ONBOARDING', qty: 1, unitPrice: 5000 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-900 p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-400/30">
                Official Proposal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {quote?.quoteNumber || 'QUO-2026-0041'}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-2">
              {quote?.title || 'Vertex Cloud Platform Migration Proposal'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Prepared by Acme Enterprise Solutions</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Investment</span>
            <span className="text-3xl font-bold text-emerald-400">
              ${(quote?.total || 125000).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Contract Body */}
        <div className="p-8 space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Itemized Scope & Line Items</h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Product / Service</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-3 font-semibold text-slate-900">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      </td>
                      <td className="p-3 text-slate-700">${item.unitPrice.toLocaleString()}</td>
                      <td className="p-3 text-slate-700">{item.qty}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        ${(item.unitPrice * item.qty).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900">Terms & SLA Commitments:</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              • 99.99% Guaranteed Service Level Agreement (SLA) with 24/7 dedicated enterprise response.<br />
              • Multi-tenant isolated database infrastructure with encrypted backups.<br />
              • Official WhatsApp Business Cloud API & Twilio Voice integration included.<br />
              • Payment terms: Net 30 days upon countersignature.
            </p>
          </div>

          {/* Digital Signature Box */}
          <div className="border-t border-slate-200 pt-6">
            {signed ? (
              <div className="rounded-xl bg-emerald-50 p-6 text-center border border-emerald-200 space-y-2">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h3 className="text-base font-bold text-emerald-950">Agreement Digitally Signed</h3>
                <p className="text-xs text-emerald-700">
                  Signed by <strong>{signatureName || quote?.signatureName || 'Authorized Signatory'}</strong> on{' '}
                  {new Date().toLocaleDateString()}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSign} className="space-y-4 max-w-md">
                <h4 className="font-bold text-slate-900 text-sm">Authorized Digital Signature</h4>
                <p className="text-[11px] text-slate-500">
                  By entering your full name and submitting, you digitally execute this contract under the ESIGN Act.
                </p>

                {error && (
                  <div className="rounded bg-red-50 p-2 text-red-600 font-semibold text-[11px]">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daniel Sterling"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signing || !signatureName.trim()}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {signing ? 'Executing Contract...' : 'Accept & Sign Proposal'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
