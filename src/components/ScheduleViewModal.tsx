import React from 'react';
import { X, Clock, Calendar, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Restaurant, DaySchedule } from '../types';

interface ScheduleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export const ScheduleViewModal: React.FC<ScheduleViewModalProps> = ({
  isOpen,
  onClose,
  restaurant,
}) => {
  if (!isOpen) return null;

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Current day in Spanish
  const todayIdx = (new Date().getDay() + 6) % 7; // Convert Sun(0) to 6, Mon(1) to 0
  const currentDayName = daysOfWeek[todayIdx];

  const scheduleList: DaySchedule[] = restaurant.weeklySchedule || [
    { day: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
    { day: 'Martes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
    { day: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '23:30' },
    { day: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '00:00' },
    { day: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '01:00' },
    { day: 'Sábado', isOpen: true, openTime: '11:30', closeTime: '01:00' },
    { day: 'Domingo', isOpen: true, openTime: '11:30', closeTime: '22:30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Horarios de Atención Semanal
              </h3>
              <p className="text-[11px] text-neutral-400">
                {restaurant.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Schedule List */}
        <div className="p-5 space-y-2.5 overflow-y-auto max-h-[70vh]">
          {scheduleList.map((sched) => {
            const isToday = sched.day.toLowerCase() === currentDayName.toLowerCase();

            return (
              <div
                key={sched.day}
                className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                  isToday
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'bg-neutral-900/60 border-neutral-800/80'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isToday ? 'text-amber-300' : 'text-white'}`}>
                      {sched.day}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-black">
                        HOY
                      </span>
                    )}
                  </div>
                  {sched.notes && (
                    <p className="text-[10px] text-neutral-400">
                      {sched.notes}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  {sched.isOpen ? (
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        {sched.openTime} - {sched.closeTime}
                      </span>
                      <span className="text-[9px] text-emerald-500 font-medium">
                        Abierto
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800">
                      Cerrado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-400">
            Los horarios pueden ser modificados por el dueño en tiempo real.
          </p>
        </div>

      </div>
    </div>
  );
};
