'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users2,
  Contact,
  Building2,
  BadgeDollarSign,
  GitPullRequest,
  CheckSquare,
  Calendar,
  MessageSquare,
  Megaphone,
  Zap,
  BarChart3,
  Award,
  Puzzle,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
} from 'lucide-react';

interface SidebarProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  organization?: {
    name: string;
    slug: string;
  };
}

export function Sidebar({ user, organization }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Leads', href: '/leads', icon: Users2 },
    { label: 'Contacts', href: '/contacts', icon: Contact },
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Deals', href: '/deals', icon: BadgeDollarSign },
    { label: 'Sales Pipeline', href: '/pipelines', icon: GitPullRequest },
    { label: 'Tasks & Reminders', href: '/tasks', icon: CheckSquare },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Communication Inbox', href: '/inbox', icon: MessageSquare },
    { label: 'Campaigns & Sources', href: '/campaigns', icon: Megaphone },
    { label: 'Automation Rules', href: '/automations', icon: Zap },
    { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { label: 'Team Performance', href: '/team', icon: Award },
    { label: 'Integrations', href: '/integrations', icon: Puzzle },
    { label: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
              <Building className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                {organization?.name || 'LeadFlow CRM'}
              </h1>
              <span className="text-xs text-blue-600 font-medium tracking-wide uppercase">Enterprise</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            LF
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User profile & logout */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
          {!collapsed && (
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
              </p>
              <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                {user?.role || 'OWNER'}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
