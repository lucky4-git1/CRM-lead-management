'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users2,
  BadgeDollarSign,
  Trophy,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  PhoneCall,
  Calendar,
  Layers,
  Megaphone,
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'executive' | 'sales' | 'marketing'>('executive');
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [analyticsRes, leadsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/leads?limit=5&sortBy=createdAt&sortOrder=desc'),
      ]);

      const aData = await analyticsRes.json();
      const lData = await leadsRes.json();

      if (aData.metrics) setAnalytics(aData.metrics);
      if (lData.leads) setRecentInteractions(lData.leads);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Loading executive dashboard...</span>
        </div>
      </div>
    );
  }

  const p = analytics?.pipeline || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">CRM Operations & Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline metrics, lead acquisition tracking, and sales execution.
          </p>
        </div>

        {/* View Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('executive')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'executive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Executive View
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Pipeline
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'marketing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Marketing Attribution
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={analytics?.totalLeads || 0}
          subtitle={`+${analytics?.leadsThisWeek || 0} added this week`}
          icon={Users2}
          color="blue"
          trend={{ value: `${analytics?.overallConversionRate || 0}% Conv.`, isPositive: true }}
        />
        <MetricCard
          title="Open Pipeline Value"
          value={`$${(p.totalPipelineValue || 0).toLocaleString()}`}
          subtitle={`$${(p.weightedPipelineValue || 0).toLocaleString()} weighted`}
          icon={BadgeDollarSign}
          color="purple"
          trend={{ value: `${p.openDealsCount || 0} Deals`, isPositive: true }}
        />
        <MetricCard
          title="Won Revenue"
          value={`$${(p.wonRevenue || 0).toLocaleString()}`}
          subtitle={`${p.winRate || 0}% overall win rate`}
          icon={Trophy}
          color="emerald"
          trend={{ value: 'Closed Won', isPositive: true }}
        />
        <MetricCard
          title="Overdue Tasks"
          value={analytics?.overdueTasks || 0}
          subtitle={`${analytics?.unassignedLeads || 0} unassigned leads`}
          icon={AlertTriangle}
          color="rose"
          trend={{ value: 'Needs Action', isPositive: false }}
        />
      </div>

      {/* Main Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Value Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales Pipeline by Stage</h3>
              <p className="text-xs text-slate-500">Distribution of opportunity values across sales stages</p>
            </div>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <span>View Pipeline</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.stageBreakdown || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="stageName" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Stage Value']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Leads by Channel</h3>
              <p className="text-xs text-slate-500">Multichannel inbound source mix</p>
            </div>
            <Link href="/campaigns" className="text-xs font-semibold text-blue-600 hover:underline">
              Sources
            </Link>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.leadsBySource || []}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {(analytics?.leadsBySource || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {(analytics?.leadsBySource || []).map((s: any, idx: number) => (
              <div key={s.source} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 truncate">{s.source}:</span>
                <span className="font-semibold text-slate-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent High Priority Leads & Quick Action Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Inbound Leads</h3>
            <Link href="/leads" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Leads
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Lead Name</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInteractions.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-semibold text-slate-900">
                      <Link href={`/leads/${lead.id}`} className="hover:text-blue-600">
                        {lead.firstName} {lead.lastName}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">{lead.companyName || '—'}</td>
                    <td className="py-3">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-blue-600">{lead.qualificationScore} pts</span>
                    </td>
                    <td className="py-3">
                      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Quick Launcher */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Platform Quick Launch</h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct access to essential CRM workflows and automation pipelines.
            </p>

            <div className="space-y-2.5 text-xs">
              <Link
                href="/leads?action=create"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Users2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Capture New Lead</p>
                    <p className="text-[11px] text-slate-500">Auto-scores & runs assignment</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/deals"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-emerald-500 hover:bg-emerald-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Manage Pipeline Board</p>
                    <p className="text-[11px] text-slate-500">Drag & drop stage progression</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Link>

              <Link
                href="/automations"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-purple-500 hover:bg-purple-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded bg-purple-50 p-2 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Automation Rules</p>
                    <p className="text-[11px] text-slate-500">Instant tasks & notifications</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600" />
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3 border border-blue-100">
            <p className="text-xs font-bold text-blue-900">Need public web form integration?</p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Copy your embed code or share public submission URLs under <Link href="/integrations" className="underline font-semibold">Integrations</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
