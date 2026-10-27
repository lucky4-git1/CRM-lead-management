'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users2,
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  CheckCircle2,
  MoreHorizontal,
  LayoutGrid,
  List,
  Phone,
  Mail,
  Building,
  CheckSquare,
} from 'lucide-react';
import { LeadModal } from '@/components/LeadModal';
import { CsvImportModal } from '@/components/CsvImportModal';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, [pagination.page, statusFilter, sourceFilter, priorityFilter]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/team-performance');
      const data = await res.json();
      if (data.performance) {
        setUsers(
          data.performance.map((p: any) => ({
            id: p.userId,
            firstName: p.name.split(' ')[0],
            lastName: p.name.split(' ').slice(1).join(' '),
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
        source: sourceFilter,
        priority: priorityFilter,
        search,
      });

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();

      if (data.leads) {
        setLeads(data.leads);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchLeads();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(leads.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string, value: string) => {
    if (selectedIds.length === 0) return;
    try {
      await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedIds, action, value }),
      });
      setSelectedIds([]);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({ status: statusFilter });
    window.location.href = `/api/leads/export?${params.toString()}`;
  };

  const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    CONTACTED: 'bg-purple-50 text-purple-700 border-purple-200',
    QUALIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UNQUALIFIED: 'bg-slate-100 text-slate-700 border-slate-200',
    NURTURING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONVERTED: 'bg-teal-50 text-teal-700 border-teal-200',
    LOST: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'text-slate-500',
    MEDIUM: 'text-blue-600',
    HIGH: 'text-amber-600 font-bold',
    URGENT: 'text-rose-600 font-bold',
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Leads Management</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {pagination.total} leads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture, route, qualify, and convert multichannel leads into active sales pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            <span>{viewMode === 'table' ? 'Kanban View' : 'Table View'}</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsLeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, company..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NURTURING">Nurturing</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
            <option value="PHONE_CALL">Phone Call</option>
            <option value="SOCIAL">Social Media</option>
            <option value="REFERRAL">Referral</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Banner (Shown when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 border border-blue-200 text-xs">
          <span className="font-semibold text-blue-900">
            {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('update_status', 'QUALIFIED')}
              className="rounded bg-white px-2.5 py-1 font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              Mark Qualified
            </button>
            <button
              onClick={() => handleBulkAction('update_status', 'CONTACTED')}
              className="rounded bg-white px-2.5 py-1 font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100"
            >
              Mark Contacted
            </button>
            <button
              onClick={() => handleBulkAction('archive', 'true')}
              className="rounded bg-white px-2.5 py-1 font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50"
            >
              Archive
            </button>
          </div>
        </div>
      )}

      {/* Content View: Table or Kanban */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-3">Lead Name</th>
                  <th className="p-3">Company & Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Est. Value</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(lead.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3">
                        <Link href={`/leads/${lead.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                          {lead.firstName} {lead.lastName}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          {lead.email && <span className="truncate max-w-[150px]">{lead.email}</span>}
                          {lead.phone && <span>• {lead.phone}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{lead.companyName || '—'}</p>
                        <p className="text-[11px] text-slate-500">{lead.jobTitle || 'Lead'}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                lead.qualificationScore >= 70
                                  ? 'bg-emerald-500'
                                  : lead.qualificationScore >= 40
                                  ? 'bg-blue-500'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${lead.qualificationScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700">{lead.qualificationScore}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[11px] ${PRIORITY_COLORS[lead.priority]}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {lead.source}
                        </span>
                      </td>
                      <td className="p-3">
                        {lead.owner ? (
                          <span className="font-medium text-slate-800">
                            {lead.owner.firstName} {lead.owner.lastName}
                          </span>
                        ) : (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        ${lead.estimatedValue ? Number(lead.estimatedValue).toLocaleString() : '0'}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                        >
                          Open Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {leads.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No leads found matching your search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <div>
              Showing {leads.length} of {pagination.total} leads
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                className="rounded border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-medium text-slate-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                className="rounded border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'].map((st) => {
            const stageLeads = leads.filter((l) => l.status === st);

            return (
              <div key={st} className="rounded-xl border border-slate-200 bg-slate-100/60 p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        st === 'QUALIFIED' ? 'bg-emerald-500' : st === 'NEW' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                    />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{st}</h4>
                  </div>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs hover:border-blue-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          {lead.source}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600">{lead.qualificationScore} pts</span>
                      </div>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="mt-2 block text-xs font-bold text-slate-900 hover:text-blue-600"
                      >
                        {lead.firstName} {lead.lastName}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate">{lead.companyName || 'No Company'}</p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-400">
                        <span>${lead.estimatedValue?.toLocaleString() || '0'}</span>
                        <span>{lead.owner ? `${lead.owner.firstName}` : 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={fetchLeads}
        users={users}
      />
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
