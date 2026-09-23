import React, { useState } from 'react';
import { 
  Wheat, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Check, 
  ChevronDown,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { ProcurementCentre, TimeSlot, Language } from '../types';
import { t } from '../i18n';

interface BookSlotCardProps {
  centres: ProcurementCentre[];
  selectedCentreId: string;
  onSelectCentre: (centreId: string) => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  slots: TimeSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onOpenBookingModal: () => void;
  language: Language;
  hasActiveBooking: boolean;
}

export const BookSlotCard: React.FC<BookSlotCardProps> = ({
  centres,
  selectedCentreId,
  onSelectCentre,
  selectedDate,
  onSelectDate,
  slots,
  selectedSlotId,
  onSelectSlot,
  onOpenBookingModal,
  language,
  hasActiveBooking
}) => {
  // Calendar month view navigation (defaults to October 2023 or active month)
  const [currentYear, setCurrentYear] = useState(2023);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days for display matching screenshot
  // In screenshot: header shows "< Oct 26, 2023 >", days M T W T F S S
  // Oct 1 was Sunday in 2023
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0
  
  // Previous month trailing days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const trailingDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    trailingDays.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  // Current month days
  const monthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    monthDays.push({ day: d, isCurrentMonth: true });
  }

  // Next month leading days to complete grid
  const totalSlotsNeeded = 35; // 5 rows
  const remainingCount = totalSlotsNeeded - (trailingDays.length + monthDays.length);
  const leadingDays = [];
  for (let d = 1; d <= Math.max(0, remainingCount); d++) {
    leadingDays.push({ day: d, isCurrentMonth: false });
  }

  const allCalendarCells = [...trailingDays, ...monthDays, ...leadingDays];

  // Helper to format date string
  const selectedDayNumber = parseInt(selectedDate.split('-')[2], 10);
  const isSelectedDateInCurrentMonth = 
    selectedDate.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);

  const selectedSlot = slots.find(s => s.id === selectedSlotId) || slots[0];

  const displayDateShort = `Oct ${selectedDayNumber}`;
  const displaySlotTime = selectedSlot ? selectedSlot.timeRange.split('–')[0].trim() : '09:30 AM';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Card Header matching screenshot */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[#2E7D4F] border border-[#C8E6C9]">
            <Wheat className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {t(language, 'bookSlotTitle')}
          </h2>
        </div>

        {/* Select Centre Dropdown */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {t(language, 'selectCentre')}
          </label>
          <div className="relative">
            <select
              id="centre-selector"
              value={selectedCentreId}
              onChange={(e) => onSelectCentre(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 text-sm font-medium bg-white text-gray-800 border border-gray-300 rounded-lg shadow-sm appearance-none focus:ring-2 focus:ring-[#1B5E3C] focus:border-transparent focus:outline-none"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Calendar and Slots Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Left Sub-column: Calendar Widget */}
          <div className="md:col-span-6 bg-white border border-gray-200 rounded-xl p-3.5">
            
            {/* Calendar Navigation Header matching "< Oct 26, 2023 >" */}
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-gray-800">
              <button 
                id="cal-prev-btn"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold tracking-tight">
                {monthNames[currentMonth].slice(0, 3)} {selectedDayNumber}, {currentYear}
              </span>
              <button 
                id="cal-next-btn"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week Header: M T W T F S S */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-gray-600">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {allCalendarCells.slice(0, 35).map((cell, idx) => {
                const isSelected = isSelectedDateInCurrentMonth && cell.isCurrentMonth && cell.day === selectedDayNumber;

                return (
                  <button
                    key={idx}
                    id={`calendar-day-${cell.day}-${cell.isCurrentMonth ? 'curr' : 'other'}`}
                    disabled={!cell.isCurrentMonth}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        const newDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                        onSelectDate(newDateStr);
                      }
                    }}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-md font-medium transition-all ${
                      !cell.isCurrentMonth 
                        ? 'text-gray-300 cursor-not-allowed text-[11px]' 
                        : isSelected
                        ? 'bg-[#1B5E3C] text-white font-bold shadow-sm ring-2 ring-emerald-600'
                        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Sub-column: Available Slots List */}
          <div className="md:col-span-6 flex flex-col justify-start">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800">
                {displayDateShort}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {slots.length} timings
              </span>
            </div>

            {/* Slots List matching screenshot */}
            <div className="space-y-2">
              {slots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const isAvailable = slot.remainingSlots > 0;

                return (
                  <button
                    key={slot.id}
                    id={`slot-btn-${slot.id}`}
                    disabled={!isAvailable}
                    onClick={() => onSelectSlot(slot.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-[#E8F5E9] border-[#2E7D4F] text-emerald-900 shadow-xs font-semibold ring-1 ring-[#2E7D4F]'
                        : isAvailable
                        ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#2E7D4F]' : 'text-gray-400'}`} />
                      <span>{slot.timeRange}</span>
                    </div>

                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-[#C8E6C9] text-emerald-900'
                        : isAvailable
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-50 text-red-500'
                    }`}>
                      {slot.remainingSlots} slots
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Prominent Confirm Booking Button matching screenshot */}
      <div className="mt-6 pt-3 border-t border-gray-100">
        {hasActiveBooking && (
          <div className="mb-2.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>You already have an active booking. You can reschedule or book another slot.</span>
          </div>
        )}

        <button
          id="confirm-booking-btn"
          onClick={onOpenBookingModal}
          className="w-full py-3 px-4 rounded-lg bg-[#1B5E3C] hover:bg-[#154E31] active:bg-[#103D26] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-emerald-200 focus:outline-none cursor-pointer"
        >
          <span>
            {t(language, 'bookButton', { 
              date: displayDateShort, 
              time: displaySlotTime 
            })}
          </span>
        </button>
      </div>
    </div>
  );
};
