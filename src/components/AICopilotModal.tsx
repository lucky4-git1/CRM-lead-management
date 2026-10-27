'use client';

import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, Send, Bot, RefreshCw } from 'lucide-react';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    firstName: string;
    lastName: string;
    companyName?: string | null;
    jobTitle?: string | null;
  } | null;
  onApplyDraft?: (draft: { subject?: string; body: string }) => void;
}

export function AICopilotModal({ isOpen, onClose, lead, onApplyDraft }: AICopilotModalProps) {
  const [intent, setIntent] = useState<string>('DEMO_INVITE');
  const [channel, setChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !lead) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: `${lead.firstName} ${lead.lastName}`,
          companyName: lead.companyName || undefined,
          jobTitle: lead.jobTitle || undefined,
          intent,
          channel,
        }),
      });

      const data = await res.json();
      if (data.draft) setDraft(data.draft);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    const text = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Sales Copilot</h3>
              <p className="text-xs text-slate-500">
                Personalized pitch generator for {lead.firstName} {lead.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Outreach Goal / Intent</label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
              >
                <option value="DEMO_INVITE">Demo Invitation</option>
                <option value="FOLLOW_UP">Standard Follow-up</option>
                <option value="PRICING_QUOTE">Proposal & Quote Delivery</option>
                <option value="OBJECTION_BUDGET">Handle Budget Objection</option>
                <option value="RE_ENGAGE">Re-engage Cold Lead</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
              >
                <option value="EMAIL">Email Message</option>
                <option value="WHATSAPP">WhatsApp Chat</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 py-2.5 font-bold text-white shadow-xs hover:bg-purple-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{loading ? 'Synthesizing...' : 'Generate Contextual Pitch'}</span>
          </button>

          {draft && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Tone: <strong className="text-purple-700">{draft.tone}</strong></span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              {draft.subject && (
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Generated Subject</span>
                  <p className="font-bold text-slate-900 mt-0.5">{draft.subject}</p>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-800 font-mono text-[11px] max-h-60 overflow-y-auto">
                {draft.body}
              </div>

              {onApplyDraft && (
                <button
                  onClick={() => {
                    onApplyDraft(draft);
                    onClose();
                  }}
                  className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white shadow-xs hover:bg-blue-700 flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Insert into Message Box</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
