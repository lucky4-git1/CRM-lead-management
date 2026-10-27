'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, Users, Plus, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'organization' | 'scoring' | 'assignment'>('organization');
  const [scoringRules, setScoringRules] = useState<any[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/scoring-rules'), fetch('/api/assignment-rules')])
      .then(async ([sRes, aRes]) => {
        const sData = await sRes.json();
        const aData = await aRes.json();
        if (sData.rules) setScoringRules(sData.rules);
        if (aData.rules) setAssignmentRules(aData.rules);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Platform Settings & Business Rules</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tenant organization preferences, deterministic lead assignment routing, and qualification scoring formulas.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs text-xs">
        <button
          onClick={() => setActiveTab('organization')}
          className={`rounded-md px-3.5 py-1.5 font-semibold transition ${
            activeTab === 'organization' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab('scoring')}
          className={`rounded-md px-3.5 py-1.5 font-semibold transition ${
            activeTab === 'scoring' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lead Scoring Rules
        </button>
        <button
          onClick={() => setActiveTab('assignment')}
          className={`rounded-md px-3.5 py-1.5 font-semibold transition ${
            activeTab === 'assignment' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lead Assignment Engine
        </button>
      </div>

      {activeTab === 'organization' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Organization Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name</label>
              <input
                type="text"
                defaultValue="Acme Enterprise Solutions"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Workspace Slug</label>
              <input
                type="text"
                disabled
                defaultValue="acme"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Currency</label>
              <select defaultValue="USD" className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Timezone</label>
              <select defaultValue="America/New_York" className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Europe/London">London (GMT/BST)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scoring' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Lead Qualification Scoring Rules</h3>
              <p className="text-xs text-slate-500">
                Deterministic weights applied automatically on every inbound lead creation and update.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {scoringRules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{r.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    Criteria: <strong>{r.criteriaType}</strong> {r.condition} &quot;{r.value}&quot;
                  </p>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-1 font-bold text-emerald-800 text-xs">
                  +{r.scoreDelta} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assignment' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Lead Assignment Rules & Routing</h3>
              <p className="text-xs text-slate-500">
                Evaluation hierarchy for round-robin distribution, least-active rep routing, and team dispatch.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {assignmentRules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">
                      #{r.priority}
                    </span>
                    <h4 className="font-bold text-slate-900">{r.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Strategy: <strong className="text-blue-700">{r.strategy}</strong>
                  </p>
                </div>
                <span className="rounded bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {r.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
