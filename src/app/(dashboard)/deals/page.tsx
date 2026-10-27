'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  ChevronRight,
  Building,
  User,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { Sparkles, FileText, ExternalLink } from 'lucide-react';

export default function DealsPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [quoteDeal, setQuoteDeal] = useState<any>(null);

  // Form states for creating a new deal
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealAmount, setNewDealAmount] = useState(30000);
  const [newDealProbability, setNewDealProbability] = useState(30);
  const [selectedStageId, setSelectedStageId] = useState('');

  useEffect(() => {
    fetchPipelineAndDeals();
  }, []);

  const fetchPipelineAndDeals = async () => {
    try {
      const [pipeRes, dealsRes] = await Promise.all([
        fetch('/api/pipelines'),
        fetch('/api/deals'),
      ]);

      const pData = await pipeRes.json();
      const dData = await dealsRes.json();

      if (pData.pipelines && pData.pipelines.length > 0) {
        setPipeline(pData.pipelines[0]);
        if (pData.pipelines[0].stages && pData.pipelines[0].stages.length > 0) {
          setSelectedStageId(pData.pipelines[0].stages[0].id);
        }
      }
      if (dData.deals) setDeals(dData.deals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (dealId: string, nextStageId: string, isWon = false, isLost = false) => {
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: nextStageId,
          status: isWon ? 'WON' : isLost ? 'LOST' : 'OPEN',
          probability: isWon ? 100 : isLost ? 0 : undefined,
        }),
      });
      fetchPipelineAndDeals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle || !selectedStageId) return;

    try {
      await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDealTitle,
          amount: newDealAmount,
          probability: newDealProbability,
          pipelineId: pipeline.id,
          stageId: selectedStageId,
        }),
      });
      setIsNewDealOpen(false);
      setNewDealTitle('');
      fetchPipelineAndDeals();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Loading sales pipeline...</span>
        </div>
      </div>
    );
  }

  const stages = pipeline?.stages || [];
  const openDeals = deals.filter((d) => d.status === 'OPEN');
  const wonDeals = deals.filter((d) => d.status === 'WON');
  const totalOpenValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
  const weightedValue = openDeals.reduce((sum, d) => sum + d.amount * (d.probability / 100), 0);
  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Pipeline Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {pipeline?.name || 'Sales Pipeline'}
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              {deals.length} Opportunities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-by-stage progression, win probabilities, and automated conversion tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pipelines"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Configure Stages
          </Link>
          <button
            onClick={() => setIsNewDealOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Open Pipeline</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-slate-900">${totalOpenValue.toLocaleString()}</h3>
            <span className="text-xs text-blue-600 font-bold">{openDeals.length} active deals</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted Forecast</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-indigo-700">${Math.round(weightedValue).toLocaleString()}</h3>
            <span className="text-xs text-slate-500">Probability factored</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closed Won Revenue</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-emerald-700">${wonRevenue.toLocaleString()}</h3>
            <span className="text-xs text-emerald-600 font-bold">{wonDeals.length} deals won</span>
          </div>
        </div>
      </div>

      {/* Interactive Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[550px]">
        {stages.map((stage: any, stageIdx: number) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 rounded-xl border border-slate-200 bg-slate-100/70 p-3 flex flex-col justify-between"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h4 className="text-xs font-bold text-slate-900 truncate">{stage.name}</h4>
                  </div>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 px-1">
                  <span>Win: {stage.winProbability}%</span>
                  <span className="font-semibold text-slate-800">${stageTotal.toLocaleString()}</span>
                </div>

                {/* Deal Cards */}
                <div className="space-y-3">
                  {stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-blue-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700">
                          ${deal.amount.toLocaleString()}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {deal.probability}% prob
                        </span>
                      </div>

                      <h5 className="mt-1.5 text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {deal.title}
                      </h5>

                      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                        {deal.company && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{deal.company.name}</span>
                          </div>
                        )}
                        {deal.owner && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{deal.owner.firstName} {deal.owner.lastName}</span>
                          </div>
                        )}
                      </div>

                      {/* AI Health & Proposal Action */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            deal.probability >= 60
                              ? 'text-emerald-700'
                              : deal.probability >= 40
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{deal.probability >= 60 ? 'Strong Health' : 'Needs Outreach'}</span>
                        </span>

                        <button
                          onClick={() => setQuoteDeal(deal)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                          title="Generate CPQ Quote"
                        >
                          <FileText className="h-3 w-3" />
                          <span>CPQ Quote</span>
                        </button>
                      </div>

                      {/* Advance Stage Control */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span
                          className={`inline-block text-[10px] font-bold ${
                            deal.status === 'WON'
                              ? 'text-emerald-600'
                              : deal.status === 'LOST'
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {deal.status}
                        </span>

                        {stageIdx < stages.length - 1 && (
                          <button
                            onClick={() => {
                              const nextStage = stages[stageIdx + 1];
                              handleMoveStage(deal.id, nextStage.id, nextStage.isWon, nextStage.isLost);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                          >
                            <span>Advance</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-[11px] text-slate-400">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Opportunity Modal */}
      {isNewDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create New Opportunity</h3>
            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={newDealTitle}
                  onChange={(e) => setNewDealTitle(e.target.value)}
                  placeholder="e.g. Acme Corp - Enterprise License"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={newDealAmount}
                    onChange={(e) => setNewDealAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    value={newDealProbability}
                    onChange={(e) => setNewDealProbability(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Stage</label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"
                >
                  {stages.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.winProbability}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewDealOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Builder Modal */}
      {quoteDeal && (
        <QuoteBuilderModal
          isOpen={!!quoteDeal}
          onClose={() => setQuoteDeal(null)}
          dealId={quoteDeal.id}
          dealTitle={quoteDeal.title}
          onSuccess={fetchPipelineAndDeals}
        />
      )}
    </div>
  );
}
