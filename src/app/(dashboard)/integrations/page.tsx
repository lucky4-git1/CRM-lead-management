'use client';

import React, { useState, useEffect } from 'react';
import {
  Puzzle,
  MessageSquare,
  Phone,
  Code,
  Globe,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations')
      .then((r) => r.json())
      .then((d) => {
        if (d.accounts) setAccounts(d.accounts);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Multichannel Integrations Center</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Connect your official messaging accounts, inbound telephony providers, and website capture endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* WhatsApp Business Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle className="h-3.5 w-3.5" />
                Active Adapter
              </span>
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">WhatsApp Cloud API</h3>
            <p className="text-xs text-slate-500 mt-1">
              Official Meta Graph API webhook ingestion for inbound customer messages and auto-lead creation.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-600 border border-slate-100 break-all">
            {appUrl}/api/webhooks/whatsapp
          </div>

          <button
            onClick={() => copyToClipboard(`${appUrl}/api/webhooks/whatsapp`, 'wa')}
            className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copiedKey === 'wa' ? 'Copied URL!' : 'Copy Webhook URL'}</span>
          </button>
        </div>

        {/* Twilio SMS & Calls Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                <CheckCircle className="h-3.5 w-3.5" />
                Active Adapter
              </span>
              <Phone className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Twilio SMS & Telephony</h3>
            <p className="text-xs text-slate-500 mt-1">
              Inbound and outbound SMS webhook receiver, caller identification, and duration logger.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-600 border border-slate-100 break-all">
            {appUrl}/api/webhooks/twilio
          </div>

          <button
            onClick={() => copyToClipboard(`${appUrl}/api/webhooks/twilio`, 'tw')}
            className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copiedKey === 'tw' ? 'Copied URL!' : 'Copy Webhook URL'}</span>
          </button>
        </div>

        {/* Website Form Capture Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                <Globe className="h-3.5 w-3.5" />
                Live Form API
              </span>
              <Code className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Website Lead Capture</h3>
            <p className="text-xs text-slate-500 mt-1">
              Embeddable form endpoint with CORS support, antispam honeypot filters, and automatic qualification scoring.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-600 border border-slate-100 break-all">
            {appUrl}/api/public/capture/acme-inbound-demo-form-2026
          </div>

          <a
            href="/forms/acme-inbound-demo-form-2026"
            target="_blank"
            className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 flex items-center justify-center gap-1.5 text-center"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Public Form Preview</span>
          </a>
        </div>
      </div>
    </div>
  );
}
