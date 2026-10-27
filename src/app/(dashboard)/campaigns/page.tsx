'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, TrendingUp, DollarSign, Users, Award } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';

export default function CampaignsPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.metrics?.leadsBySource) {
          setSources(d.metrics.leadsBySource);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Campaigns & Lead Acquisition Sources</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Measure lead acquisition volume, estimated pipeline value, and channel conversion velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((s) => (
          <div key={s.source} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                {s.source}
              </span>
              <Megaphone className="h-4 w-4 text-slate-400" />
            </div>

            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-900">{s.count} Leads</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimated Opportunity: <strong className="text-emerald-700">${(s.estimatedValue || 0).toLocaleString()}</strong>
              </p>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400 flex justify-between">
              <span>Avg Value: ${Math.round((s.estimatedValue || 0) / (s.count || 1)).toLocaleString()}</span>
              <span className="text-blue-600 font-semibold">Active Channel</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
