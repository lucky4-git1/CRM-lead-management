'use client';

import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, User, Mail, Phone, Building } from 'lucide-react';

export default function MeetingSchedulerPage() {
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState('14:00');
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const scheduledAt = new Date(`${date}T${time}:00`);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setBooked(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-5">
        {/* Left Host Column */}
        <div className="md:col-span-2 bg-slate-900 p-6 text-white flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Enterprise Sales Meeting
            </span>
            <h2 className="text-xl font-bold mt-1">Live Product Demo & Solution Architecture</h2>
            <p className="text-xs text-slate-400 mt-2">
              Join Alex Mercer for a customized 30-minute demonstration of LeadFlow CRM.
            </p>

            <div className="mt-6 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>30 Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span>Google Meet / WebRTC Video</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 text-[11px] text-slate-400">
            LeadFlow CRM Instant Scheduler
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-3 p-6 flex flex-col justify-center text-xs">
          {booked ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Meeting Confirmed!</h3>
              <p className="text-xs text-slate-600">
                A calendar invitation and Google Meet link have been sent to <strong>{formData.guestEmail}</strong>.
              </p>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-slate-700">
                <p className="font-semibold">{date} at {time}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900">Select Date & Time Slot</h3>

              {error && (
                <div className="rounded bg-red-50 p-2.5 text-[11px] font-semibold text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pick a Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Slots</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {timeSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`rounded-md py-1.5 font-bold transition text-[11px] ${
                        time === slot
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">What would you like to discuss?</label>
                  <textarea
                    rows={2}
                    value={formData.guestNotes}
                    onChange={(e) => setFormData({ ...formData, guestNotes: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Schedule Demonstration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
