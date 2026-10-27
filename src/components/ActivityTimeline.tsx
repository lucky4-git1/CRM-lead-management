'use client';

import React from 'react';
import {
  PhoneCall,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  GitCommit,
  CheckCircle2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InteractionItem {
  id: string;
  type: string;
  direction?: string;
  summary: string;
  body?: string | null;
  outcome?: string | null;
  durationSeconds?: number | null;
  createdAt: string | Date;
  actor?: {
    firstName: string;
    lastName: string;
  } | null;
}

export function ActivityTimeline({ items }: { items: InteractionItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No interaction history recorded yet.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="h-4 w-4 text-emerald-600" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'MEETING':
        return <Calendar className="h-4 w-4 text-amber-600" />;
      case 'STAGE_CHANGE':
      case 'STATUS_CHANGE':
        return <GitCommit className="h-4 w-4 text-indigo-600" />;
      case 'CONVERSION':
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
      case 'ASSIGNMENT':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'AUTOMATION':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'bg-emerald-50 border-emerald-200';
      case 'EMAIL':
        return 'bg-blue-50 border-blue-200';
      case 'WHATSAPP':
        return 'bg-emerald-50 border-emerald-200';
      case 'SMS':
        return 'bg-purple-50 border-purple-200';
      case 'STAGE_CHANGE':
      case 'STATUS_CHANGE':
        return 'bg-indigo-50 border-indigo-200';
      case 'CONVERSION':
        return 'bg-teal-50 border-teal-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 space-y-6">
      {items.map((item) => {
        const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

        return (
          <div key={item.id} className="relative flex items-start gap-4">
            <div
              className={`absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-xs ${getBadgeColor(
                item.type
              )}`}
            >
              {getIcon(item.type)}
            </div>

            <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {item.type} {item.direction ? `(${item.direction})` : ''}
                  </span>
                  {item.durationSeconds && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">{timeAgo}</span>
              </div>

              <h4 className="mt-1 text-sm font-semibold text-slate-900">{item.summary}</h4>

              {item.body && (
                <p className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap rounded bg-slate-50 p-2.5 border border-slate-100">
                  {item.body}
                </p>
              )}

              {item.outcome && (
                <div className="mt-2 text-xs font-medium text-slate-700">
                  <span className="font-semibold text-slate-500">Outcome:</span> {item.outcome}
                </div>
              )}

              {item.actor && (
                <div className="mt-2 text-[11px] text-slate-400">
                  Recorded by: <span className="font-medium text-slate-600">{item.actor.firstName} {item.actor.lastName}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
