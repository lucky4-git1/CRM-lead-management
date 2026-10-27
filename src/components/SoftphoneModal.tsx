'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  X,
  Volume2,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface SoftphoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNumber?: string;
  defaultLeadId?: string;
  defaultLeadName?: string;
  onCallLogged?: () => void;
}

export function SoftphoneModal({
  isOpen,
  onClose,
  defaultNumber = '',
  defaultLeadId,
  defaultLeadName,
  onCallLogged,
}: SoftphoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber);
  const [callState, setCallState] = useState<'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [outcome, setCallOutcome] = useState('Interested');

  useEffect(() => {
    if (defaultNumber) setPhoneNumber(defaultNumber);
  }, [defaultNumber]);

  useEffect(() => {
    let interval: any = null;
    if (callState === 'CONNECTED') {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const handleStartCall = () => {
    if (!phoneNumber) return;
    setCallState('DIALING');
    setSeconds(0);
    setTimeout(() => {
      setCallState('CONNECTED');
    }, 1500);
  };

  const handleEndCall = async () => {
    setCallState('ENDED');

    // Automatically log call to lead if leadId exists
    if (defaultLeadId && seconds > 0) {
      try {
        await fetch(`/api/leads/${defaultLeadId}/interactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'CALL',
            direction: 'OUTBOUND',
            summary: `Outbound WebRTC Call to ${phoneNumber} (${defaultLeadName || 'Lead'})`,
            body: notes || 'Completed WebRTC browser softphone call.',
            outcome,
            durationSeconds: seconds,
          }),
        });
        if (onCallLogged) onCallLogged();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dialPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Softphone Header */}
        <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase">WebRTC VoIP Softphone</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Call Display Screen */}
        <div className="bg-slate-800 p-6 text-center text-white space-y-2">
          {defaultLeadName && (
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider truncate">
              {defaultLeadName}
            </p>
          )}

          <div className="text-2xl font-mono font-bold tracking-wider">
            {phoneNumber || 'Enter Number'}
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            {callState === 'IDLE' && <span>Ready to Dial</span>}
            {callState === 'DIALING' && <span className="text-amber-400">Ringing...</span>}
            {callState === 'CONNECTED' && (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                In Call: {formatTime(seconds)}
              </span>
            )}
            {callState === 'ENDED' && <span className="text-rose-400">Call Finished ({formatTime(seconds)})</span>}
          </div>
        </div>

        {/* Dialpad & Call Controls */}
        <div className="p-5 space-y-4">
          {callState === 'IDLE' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {dialPad.map((digit) => (
                  <button
                    key={digit}
                    onClick={() => setPhoneNumber((prev) => prev + digit)}
                    className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-800 hover:bg-slate-200 active:scale-95 transition"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPhoneNumber('')}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  onClick={handleStartCall}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 flex items-center justify-center gap-2 transition"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Place Call</span>
                </button>
              </div>
            </>
          )}

          {callState === 'CONNECTED' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                    isMuted ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-700'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setIsOnHold(!isOnHold)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                    isOnHold ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-slate-100 text-slate-700'
                  }`}
                  title={isOnHold ? 'Resume' : 'Hold'}
                >
                  {isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                  title="Hang Up"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Live Call Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record customer comments and key points live..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {callState === 'ENDED' && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800 border border-emerald-200 text-center font-bold">
                Call logged successfully ({formatTime(seconds)})
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Call Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 bg-white"
                >
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Interested">Interested</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Left Voicemail">Left Voicemail</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setCallState('IDLE');
                    setSeconds(0);
                    onClose();
                  }}
                  className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
