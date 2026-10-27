'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  PhoneCall,
  Mail,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  PhoneIncoming,
  Bot,
} from 'lucide-react';

export default function CommunicationInboxPage() {
  const [channel, setChannel] = useState<'all' | 'whatsapp' | 'sms' | 'calls' | 'email'>('all');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation test states for live demonstration of external webhooks
  const [simChannel, setSimChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [simFromNumber, setSimFromNumber] = useState('+14155557788');
  const [simName, setSimName] = useState('Maya Lin');
  const [simText, setSimText] = useState('Hello! I would like pricing details for your enterprise CRM package.');
  const [simResult, setSimResult] = useState<string | null>(null);

  useEffect(() => {
    fetchInbox();
  }, [channel]);

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/leads?limit=30');
      const data = await res.json();
      if (data.leads) {
        // Collect all interactions across leads
        const allInteractions: any[] = [];
        data.leads.forEach((l: any) => {
          allInteractions.push({
            id: `lead-origin-${l.id}`,
            leadId: l.id,
            leadName: `${l.firstName} ${l.lastName}`,
            companyName: l.companyName,
            type: l.source === 'WHATSAPP' ? 'WHATSAPP' : l.source === 'SMS' ? 'SMS' : l.source === 'PHONE_CALL' ? 'CALL' : 'EMAIL',
            summary: l.notes || `Initial inbound contact via ${l.source}`,
            createdAt: l.createdAt,
            direction: 'INBOUND',
          });
        });
        setMessages(allInteractions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateInboundWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimResult(null);

    try {
      let endpoint = '/api/webhooks/whatsapp';
      let payload: any = {};

      if (simChannel === 'whatsapp') {
        endpoint = '/api/webhooks/whatsapp';
        payload = {
          entry: [
            {
              changes: [
                {
                  value: {
                    contacts: [{ profile: { name: simName } }],
                    messages: [
                      {
                        from: simFromNumber.replace(/\D/g, ''),
                        id: `sim_wam_${Date.now()}`,
                        text: { body: simText },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };
      } else {
        endpoint = '/api/webhooks/twilio';
        payload = {
          From: simFromNumber,
          Body: simText,
          MessageSid: `SM_${Date.now()}`,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      setSimResult(`Webhook processed successfully! Lead created/associated (ID: ${resData.leadId || 'Matched'})`);
      fetchInbox();
    } catch (err: any) {
      setSimResult(`Simulation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Multichannel Communication Inbox</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified omnichannel inbox for official WhatsApp Business, Twilio SMS, emails, and telephony call logs.
          </p>
        </div>

        {/* Channel Filter Pills */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs text-xs">
          <button
            onClick={() => setChannel('all')}
            className={`rounded-md px-3 py-1 font-semibold ${
              channel === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Channels
          </button>
          <button
            onClick={() => setChannel('whatsapp')}
            className={`rounded-md px-3 py-1 font-semibold ${
              channel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setChannel('sms')}
            className={`rounded-md px-3 py-1 font-semibold ${
              channel === 'sms' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SMS
          </button>
          <button
            onClick={() => setChannel('calls')}
            className={`rounded-md px-3 py-1 font-semibold ${
              channel === 'calls' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calls
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Feed */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Unified Inbound & Outbound Conversations</h3>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-300 transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        msg.type === 'WHATSAPP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : msg.type === 'SMS'
                          ? 'bg-purple-100 text-purple-800'
                          : msg.type === 'CALL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {msg.type}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{msg.leadName}</span>
                    {msg.companyName && <span className="text-slate-500">({msg.companyName})</span>}
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">{msg.summary}</p>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0 ml-4">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <a
                    href={`/leads/${msg.leadId}`}
                    className="block text-blue-600 font-semibold hover:underline mt-1"
                  >
                    View Lead
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Webhook Ingestion Simulator */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Webhook Sandbox Simulator</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate an incoming WhatsApp or SMS message from an external lead to verify automatic lead creation and routing.
            </p>
          </div>

          <form onSubmit={handleSimulateInboundWebhook} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Channel Provider</label>
              <select
                value={simChannel}
                onChange={(e) => setSimChannel(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 bg-white"
              >
                <option value="whatsapp">WhatsApp Business Cloud API Webhook</option>
                <option value="sms">Twilio SMS Webhook</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sender Name</label>
              <input
                type="text"
                required
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">From Phone Number</label>
              <input
                type="text"
                required
                value={simFromNumber}
                onChange={(e) => setSimFromNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incoming Message Body</label>
              <textarea
                rows={3}
                required
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Dispatch Webhook Event
            </button>
          </form>

          {simResult && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              {simResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
