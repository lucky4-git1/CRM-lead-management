'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((d) => {
        if (d.tasks) setTasks(d.tasks);
      })
      .finally(() => setLoading(false));
  }, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Follow-Up & Meeting Calendar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize client demonstrations, follow-up calls, and milestone review deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs">
            {currentMonthName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Tasks Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Upcoming Scheduled Events</h3>
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      {t.lead ? `Lead: ${t.lead.firstName} ${t.lead.lastName}` : t.deal ? `Deal: ${t.deal.title}` : 'General task'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span suppressHydrationWarning className="font-bold text-slate-700 block">
                    {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                  <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {t.taskType}
                  </span>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">No tasks currently scheduled.</p>
            )}
          </div>
        </div>

        {/* Calendar Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Agenda Overview</h3>
          <div className="rounded-lg bg-blue-50 p-3.5 border border-blue-100 text-xs text-blue-900 space-y-2">
            <p className="font-bold">Automated Reminder Sync</p>
            <p className="text-[11px] leading-relaxed text-blue-800">
              Tasks created by automated workflows or sales reps trigger notification alerts 24 hours and 1 hour before their scheduled due date.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Scheduled:</span>
              <span className="font-bold text-slate-800">{tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">High Priority:</span>
              <span className="font-bold text-rose-600">
                {tasks.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
