'use client';

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Users, CheckCircle2, TrendingUp, PhoneCall } from 'lucide-react';

export default function TeamPerformancePage() {
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/team-performance')
      .then((r) => r.json())
      .then((d) => {
        if (d.performance) setPerformance(d.performance);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Sales Team Performance & Leaderboard</h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            Live Rep Rankings
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Track individual agent lead routing, conversion efficiency, closed won revenue, and client touchpoints.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">Rank</th>
                <th className="p-3">Sales Representative</th>
                <th className="p-3">Team & Role</th>
                <th className="p-3">Assigned Leads</th>
                <th className="p-3">Converted</th>
                <th className="p-3">Conv. Rate</th>
                <th className="p-3">Won Revenue</th>
                <th className="p-3">Open Deals</th>
                <th className="p-3 text-right">Activities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performance.map((rep, idx) => (
                <tr key={rep.userId} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-center">
                    {idx === 0 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold mx-auto text-xs">
                        🥇
                      </span>
                    ) : idx === 1 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold mx-auto text-xs">
                        🥈
                      </span>
                    ) : (
                      <span className="font-bold text-slate-400">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900 text-sm">{rep.name}</p>
                    <p className="text-[11px] text-slate-400">{rep.email}</p>
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {rep.role}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{rep.teamName}</p>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{rep.assignedLeadsCount}</td>
                  <td className="p-3 font-semibold text-emerald-700">{rep.convertedLeadsCount}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(100, rep.conversionRate * 2)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700">{rep.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-emerald-700">
                    ${rep.wonDealsValue.toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-700">
                    {rep.openDealsCount} (${rep.openDealsValue.toLocaleString()})
                  </td>
                  <td className="p-3 text-right font-medium text-slate-600">
                    {rep.interactionsCount + rep.completedTasksCount} touches
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
