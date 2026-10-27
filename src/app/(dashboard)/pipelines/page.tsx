'use client';

import React, { useState, useEffect } from 'react';
import { GitPullRequest, Plus, Check, Save } from 'lucide-react';

export default function PipelineSettingsPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStageName, setNewStageName] = useState('');
  const [newStageProb, setNewStageProb] = useState(50);
  const [newStageColor, setNewStageColor] = useState('#3b82f6');

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/pipelines');
      const data = await res.json();
      if (data.pipelines && data.pipelines.length > 0) {
        setPipeline(data.pipelines[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Sales Pipeline & Stages Architecture</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure stage progression order, win probabilities, and custom color indicators.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{pipeline?.name || 'Standard Sales Pipeline'}</h3>
            <p className="text-xs text-slate-500">Active default pipeline for all opportunities and converted leads</p>
          </div>
          <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            Active Default
          </span>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configured Pipeline Stages</h4>
          <div className="space-y-2">
            {(pipeline?.stages || []).map((stage: any) => (
              <div
                key={stage.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-bold text-slate-700 border text-[11px]">
                    {stage.stageOrder}
                  </span>
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="font-bold text-slate-900 text-sm">{stage.name}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-600">{stage.winProbability}% Win Probability</span>
                  {stage.isWon && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Closed Won Stage
                    </span>
                  )}
                  {stage.isLost && (
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      Closed Lost Stage
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 text-xs text-blue-800">
          <p className="font-bold">Automated Stage Conversion Intelligence:</p>
          <p className="mt-1 leading-relaxed">
            Whenever an opportunity moves into a stage marked with 100% (Won) or 0% (Lost), the CRM automatically
            updates the deal closure timestamp and triggers relevant celebration or loss-reason review automations.
          </p>
        </div>
      </div>
    </div>
  );
}
