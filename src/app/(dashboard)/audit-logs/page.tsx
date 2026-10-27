'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, User, FileText } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((d) => {
        if (d.logs) setLogs(d.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Security & Audit Event Stream</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            Immutable Audit Trail
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident record of lead creations, conversions, bulk updates, deletions, and exports.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3">User Actor</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        log.action === 'CREATE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.action === 'CONVERT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'DELETE'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'EXPORT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{log.entityType}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                    {log.entityId}
                  </td>
                  <td className="p-3">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Engine'}
                  </td>
                  <td className="p-3 text-[11px] font-mono text-slate-600 max-w-xs truncate">
                    {JSON.stringify(log.newData || log.oldData || {})}
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
