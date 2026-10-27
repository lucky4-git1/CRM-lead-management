'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Layers, Award, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.metrics) setAnalytics(d.metrics);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.location.href = '/api/leads/export';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Reports & Business Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic sales conversion metrics, acquisition economics, and forecasting accuracy.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Conversion Rate</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{analytics?.overallConversionRate || 0}%</h3>
          <p className="text-xs text-slate-500 mt-1">Lead to customer conversion ratio</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Deal Size</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            ${(analytics?.pipeline?.avgDealSize || 0).toLocaleString()}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Across open and closed won deals</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Win Rate Percentage</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2">{analytics?.pipeline?.winRate || 0}%</h3>
          <p className="text-xs text-slate-500 mt-1">Closed won vs closed lost ratio</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Pipeline Progression by Stage</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.pipeline?.stageBreakdown || []}>
              <XAxis dataKey="stageName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Value']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
