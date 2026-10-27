'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  PhoneCall,
  Mail,
  MessageSquare,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().slice(0, 10),
    taskType: 'FOLLOW_UP',
    priority: 'HIGH',
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const url = filter === 'overdue' ? '/api/tasks?filter=overdue' : filter === 'my' ? '/api/tasks?filter=my' : '/api/tasks';
      const res = await fetch(url);
      const data = await res.json();
      if (data.tasks) {
        if (filter === 'completed') {
          setTasks(data.tasks.filter((t: any) => t.status === 'COMPLETED'));
        } else {
          setTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: any) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, outcome: nextStatus === 'COMPLETED' ? 'Completed by user' : null }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: new Date().toISOString().slice(0, 10),
        taskType: 'FOLLOW_UP',
        priority: 'HIGH',
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Tasks & Reminders</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {tasks.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated follow-up scheduling, customer callback reminders, and sales tasks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-3 py-1.5 font-semibold transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('my')}
          className={`rounded-md px-3 py-1.5 font-semibold transition ${
            filter === 'my' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`rounded-md px-3 py-1.5 font-semibold transition ${
            filter === 'overdue' ? 'bg-rose-600 text-white' : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          Overdue Alerts
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`rounded-md px-3 py-1.5 font-semibold transition ${
            filter === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isOverdue = task.status !== 'COMPLETED' && new Date(task.dueDate) < now;
          const isCompleted = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className={`flex items-start justify-between rounded-xl border p-4 transition shadow-xs ${
                isCompleted
                  ? 'border-slate-200 bg-slate-50/50 opacity-70'
                  : isOverdue
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleToggleComplete(task)}
                  className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <div>
                  <h4
                    className={`text-sm font-bold text-slate-900 ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span suppressHydrationWarning className="flex items-center gap-1 font-semibold text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>

                    <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-[10px] text-slate-700">
                      {task.taskType}
                    </span>

                    {task.priority === 'URGENT' || task.priority === 'HIGH' ? (
                      <span className="rounded bg-rose-50 px-2 py-0.5 font-bold text-[10px] text-rose-700 border border-rose-200">
                        {task.priority} Priority
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">{task.priority}</span>
                    )}

                    {task.lead && (
                      <span className="text-slate-500 text-[11px]">
                        Lead: <strong>{task.lead.firstName} {task.lead.lastName}</strong>
                      </span>
                    )}
                    {task.deal && (
                      <span className="text-slate-500 text-[11px]">
                        Deal: <strong>{task.deal.title}</strong>
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="text-slate-500 text-[11px]">
                        Assigned: <strong>{task.assignedTo.firstName} {task.assignedTo.lastName}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && !loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No tasks found in this view.
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Task or Follow-Up</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Schedule discovery call with procurement team"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Type</label>
                <select
                  value={newTask.taskType}
                  onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="MEETING">Meeting</option>
                  <option value="INTERNAL">Internal</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                  placeholder="Additional context or checklist items..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
