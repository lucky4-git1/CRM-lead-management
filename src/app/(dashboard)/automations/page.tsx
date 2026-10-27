'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Plus, CheckCircle, Clock, ToggleLeft, ToggleRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerType: 'LEAD_CREATED',
    actionTitle: 'Instant follow-up task',
    actionDueHours: 24,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.rules) setRules(data.rules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rule: any) => {
    try {
      await fetch(`/api/automations/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name) return;

    try {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name,
          description: newRule.description,
          triggerType: newRule.triggerType,
          conditions: [],
          actions: [
            {
              type: 'create_task',
              title: newRule.actionTitle,
              dueHours: parseInt(String(newRule.actionDueHours), 10),
            },
          ],
        }),
      });
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Automation Engine & Workflows</h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              {rules.length} Active Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate task delegation, lead routing, stage notifications, and SLA reminders.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Automation Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-2 space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      {rule.triggerType}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{rule.name}</h3>
                  </div>
                  {rule.description && (
                    <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleToggleActive(rule)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-md border transition ${
                    rule.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Action summary */}
              <div className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-700">Actions:</p>
                {(rule.actions as any[])?.map((act: any, idx: number) => (
                  <p key={idx} className="text-slate-600 text-[11px]">
                    • {act.type === 'create_task' ? `Create Task: "${act.title}" (+${act.dueHours || 24}h)` : act.type}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                <span>Executed: <strong>{rule.executionCount}</strong> times</span>
                <span>
                  Last run: {rule.lastExecutedAt ? new Date(rule.lastExecutedAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Execution Logs Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Automation Logs</h3>
          <div className="space-y-3 text-xs">
            {rules.flatMap((r) => r.logs || []).slice(0, 8).map((log: any) => (
              <div key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{log.triggerType}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{log.status}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Entity: {log.entityType} ({log.entityId.slice(0, 8)}...)
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(log.executedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {rules.flatMap((r) => r.logs || []).length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No execution events yet.</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Automation Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g. Instant Callback on Demo Request"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Event</label>
                <select
                  value={newRule.triggerType}
                  onChange={(e) => setNewRule({ ...newRule, triggerType: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white"
                >
                  <option value="LEAD_CREATED">New Lead Created</option>
                  <option value="LEAD_STATUS_CHANGED">Lead Status Changed</option>
                  <option value="DEAL_STAGE_CHANGED">Deal Stage Moved</option>
                  <option value="DEAL_WON">Deal Closed Won</option>
                  <option value="DEAL_LOST">Deal Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Action Title</label>
                <input
                  type="text"
                  required
                  value={newRule.actionTitle}
                  onChange={(e) => setNewRule({ ...newRule, actionTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
                >
                  Save Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
