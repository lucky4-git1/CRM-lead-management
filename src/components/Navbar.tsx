'use client';

import React, { useState } from 'react';
import { Search, Bell, Plus, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  organization?: {
    name: string;
  };
}

export function Navbar({ user, organization }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, contacts, deals (Ctrl + K)..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick create action */}
        <div className="flex items-center gap-2">
          <Link
            href="/leads?action=create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Lead</span>
          </Link>
          <Link
            href="/deals?action=create"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>New Deal</span>
          </Link>
        </div>

        {/* Notifications toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">3 Overdue</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-semibold text-slate-800">Proposal follow-up overdue</p>
                  <p className="text-slate-500 mt-0.5">Daniel Sterling (Vertex Cloud) - due yesterday</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-semibold text-slate-800">New High-Priority Inbound</p>
                  <p className="text-slate-500 mt-0.5">Robert Chen requested 150-seat demo</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User avatar badge */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : <UserIcon className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">{organization?.name || 'Acme'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
