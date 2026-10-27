'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  PhoneCall,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ConvertLeadModal } from '@/components/ConvertLeadModal';
import { AICopilotModal } from '@/components/AICopilotModal';
import { SoftphoneModal } from '@/components/SoftphoneModal';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isSoftphoneOpen, setIsSoftphoneOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'note' | 'call' | 'email' | 'whatsapp' | 'task'>('note');

  // Interactive form states
  const [noteContent, setNoteContent] = useState('');
  const [callSummary, setCallSummary] = useState('');
  const [callOutcome, setCallOutcome] = useState('Interested');
  const [callDuration, setCallDuration] = useState('300');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (data.lead) setLead(data.lead);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogInteraction = async (type: string, payload: any) => {
    setActionLoading(true);
    try {
      await fetch(`/api/leads/${id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload }),
      });
      fetchLead();
      // Reset forms
      setNoteContent('');
      setCallSummary('');
      setEmailSubject('');
      setEmailBody('');
      setWhatsappMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;
    setActionLoading(true);

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          dueDate: taskDueDate,
          leadId: id,
          priority: 'HIGH',
        }),
      });
      setTaskTitle('');
      setTaskDueDate('');
      fetchLead();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Loading lead profile...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h3 className="text-base font-bold text-slate-900">Lead not found</h3>
        <Link href="/leads" className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
          Return to leads list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {lead.firstName} {lead.lastName}
              </h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                {lead.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead.jobTitle ? `${lead.jobTitle} at ` : ''}
              <strong>{lead.companyName || 'Private Individual'}</strong> • Added {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAICopilotOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-xs hover:bg-purple-100 transition"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>AI Copilot</span>
          </button>

          {lead.status !== 'CONVERTED' ? (
            <button
              onClick={() => setIsConvertOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Convert to Customer</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 border border-teal-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>Converted Record</span>
            </span>
          )}

          {/* Quick status selector */}
          <select
            value={lead.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NURTURING">Nurturing</option>
            <option value="CONVERTED" disabled>Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Details Sidebar & Main Interactions Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Info Column */}
        <div className="space-y-6">
          {/* Contact & Company Details Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Details</h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="font-semibold text-slate-800">{lead.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone</span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{lead.phone || '—'}</span>
                  {lead.phone && (
                    <button
                      onClick={() => setIsSoftphoneOpen(true)}
                      className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>Call WebRTC</span>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">WhatsApp</span>
                <span className="font-semibold text-slate-800">{lead.whatsapp || lead.phone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Company</span>
                <span className="font-semibold text-slate-800">{lead.companyName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-slate-800">
                  {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lead Source</span>
                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700 mt-0.5">
                  {lead.source} {lead.sourceCampaign ? `(${lead.sourceCampaign})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lead Owner</span>
                <span className="font-semibold text-slate-800">
                  {lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estimated Value</span>
                <span className="font-bold text-emerald-700">
                  ${lead.estimatedValue ? Number(lead.estimatedValue).toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Qualification Score Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Qualification Score</h3>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{lead.qualificationScore} / 100</span>
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  lead.qualificationScore >= 70
                    ? 'bg-emerald-500'
                    : lead.qualificationScore >= 40
                    ? 'bg-blue-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${lead.qualificationScore}%` }}
              />
            </div>

            {lead.scoringLogs && lead.scoringLogs.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-[11px] text-slate-700">Scoring breakdown:</p>
                {lead.scoringLogs.map((log: any) => (
                  <p key={log.id} className="text-[11px] text-slate-500">
                    • {log.reason}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Tasks & Reminders Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scheduled Tasks</h3>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                {lead.tasks?.length || 0}
              </span>
            </div>

            <div className="space-y-2">
              {lead.tasks?.map((t: any) => (
                <div key={t.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{t.title}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        t.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                </div>
              ))}
              {(!lead.tasks || lead.tasks.length === 0) && (
                <p className="text-xs text-slate-400 py-2">No pending follow-ups for this lead.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Column: Interaction Center & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Interaction Logger Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-3">
              <button
                onClick={() => setActiveTab('note')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'note' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Note</span>
              </button>
              <button
                onClick={() => setActiveTab('call')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'call' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Log Call</span>
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'email' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => setActiveTab('task')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'task' ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>New Task</span>
              </button>
            </div>

            {/* Note tab form */}
            {activeTab === 'note' && (
              <div className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record internal customer notes, observations, or key requirements..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    disabled={!noteContent.trim() || actionLoading}
                    onClick={() =>
                      handleLogInteraction('NOTE', {
                        summary: 'Internal Note',
                        body: noteContent,
                      })
                    }
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            {/* Call tab form */}
            {activeTab === 'call' && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={callSummary}
                  onChange={(e) => setCallSummary(e.target.value)}
                  placeholder="Call Subject / Key discussion points..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Call Outcome</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Interested">Interested</option>
                      <option value="Left Voicemail">Left Voicemail</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={!callSummary.trim() || actionLoading}
                    onClick={() =>
                      handleLogInteraction('CALL', {
                        direction: 'OUTBOUND',
                        summary: callSummary,
                        outcome: callOutcome,
                        durationSeconds: parseInt(callDuration, 10),
                      })
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Log Outbound Call
                  </button>
                </div>
              </div>
            )}

            {/* Email tab form */}
            {activeTab === 'email' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">Compose Tracked Email</span>
                  <button
                    type="button"
                    onClick={() => setIsAICopilotOpen(true)}
                    className="inline-flex items-center gap-1 rounded bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 border border-purple-200"
                  >
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    <span>AI Email Drafter</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email Subject..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Compose email message to customer..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Includes 1x1 transparent tracking pixel for open detection.
                  </span>
                  <button
                    disabled={!emailSubject.trim() || actionLoading}
                    onClick={() =>
                      handleLogInteraction('EMAIL', {
                        direction: 'OUTBOUND',
                        summary: emailSubject,
                        body: emailBody,
                      })
                    }
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    Log Sent Email
                  </button>
                </div>
              </div>
            )}

            {/* WhatsApp tab form */}
            {activeTab === 'whatsapp' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">WhatsApp Cloud API Message</span>
                  <button
                    type="button"
                    onClick={() => setIsAICopilotOpen(true)}
                    className="inline-flex items-center gap-1 rounded bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 border border-purple-200"
                  >
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    <span>AI WhatsApp Drafter</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Message text for WhatsApp Business Cloud API..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    disabled={!whatsappMessage.trim() || actionLoading}
                    onClick={() =>
                      handleLogInteraction('WHATSAPP', {
                        direction: 'OUTBOUND',
                        summary: `Outbound WhatsApp to ${lead.phone || lead.whatsapp}`,
                        body: whatsappMessage,
                      })
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Send via WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Task tab form */}
            {activeTab === 'task' && (
              <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Follow-up task title..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    Schedule Task
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Unified Customer Activity Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Complete Customer Interaction History</h3>
            <ActivityTimeline items={lead.interactions || []} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConvertLeadModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onSuccess={() => {
          fetchLead();
          router.push('/deals');
        }}
        lead={lead}
      />

      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        lead={lead}
        onApplyDraft={(draft) => {
          if (draft.subject) setEmailSubject(draft.subject);
          setEmailBody(draft.body);
          setWhatsappMessage(draft.body);
        }}
      />

      <SoftphoneModal
        isOpen={isSoftphoneOpen}
        onClose={() => setIsSoftphoneOpen(false)}
        defaultNumber={lead.phone || lead.whatsapp || ''}
        defaultLeadId={lead.id}
        defaultLeadName={`${lead.firstName} ${lead.lastName}`}
        onCallLogged={fetchLead}
      />
    </div>
  );
}
