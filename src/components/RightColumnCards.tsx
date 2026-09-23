import React from 'react';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  Circle, 
  CreditCard, 
  UserCheck, 
  ExternalLink,
  QrCode,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Booking, CentreQueueState, Language } from '../types';
import { t } from '../i18n';

interface RightColumnCardsProps {
  currentBooking: Booking | null;
  queueState: CentreQueueState;
  language: Language;
  onOpenGatePass: () => void;
  onSimulateNextToken: () => void;
  onNavigateToTrack: () => void;
  isSimulating?: boolean;
}

export const RightColumnCards: React.FC<RightColumnCardsProps> = ({
  currentBooking,
  queueState,
  language,
  onOpenGatePass,
  onSimulateNextToken,
  onNavigateToTrack,
  isSimulating
}) => {
  // If farmer has an active booking (e.g. Token #24 as in screenshot)
  const tokenNumber = currentBooking ? currentBooking.tokenNumber : 24;
  const currentToken = queueState ? queueState.currentServingToken : 19;
  
  // Calculate waiting numbers
  const tokensAhead = Math.max(0, tokenNumber - currentToken);
  const estimatedWaitMins = tokensAhead * (queueState?.averageMinutesPerToken || 3);
  const waitingFarmers = tokensAhead;

  // Circular progress calculation:
  // e.g. out of total issued (28), position of currentToken
  const maxTokens = Math.max(queueState?.totalTokensIssued || 30, tokenNumber);
  const percentage = Math.min(100, Math.round((currentToken / maxTokens) * 100));
  const strokeDashoffset = 283 - (283 * percentage) / 100; // circumference for r=45 is ~283

  // Status tracker stages resolution
  const bookingStatus = currentBooking?.status || 'slot_booked';
  const isRegisteredDone = true; // farmer registration always completed
  const isSlotBookedDone = !!currentBooking && (
    bookingStatus === 'slot_booked' || 
    bookingStatus === 'at_centre' || 
    bookingStatus === 'served' || 
    bookingStatus === 'payment_processed'
  );
  const isAtCentreDone = currentBooking?.checkInTime || bookingStatus === 'at_centre' || bookingStatus === 'served' || bookingStatus === 'payment_processed';
  const isPaymentDone = currentBooking?.paymentStatus === 'processed' || bookingStatus === 'payment_processed';

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. "Current Booking" Card matching screenshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200">
              <Ticket className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {t(language, 'currentBooking')}
            </h3>
          </div>

          {currentBooking && (
            <button
              id="view-gate-pass-badge-btn"
              onClick={onOpenGatePass}
              className="text-xs font-semibold text-[#1B5E3C] hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gate Pass</span>
            </button>
          )}
        </div>

        {currentBooking ? (
          <div className="flex flex-wrap items-center gap-y-1.5 text-xs sm:text-sm text-gray-700 font-medium">
            <div>
              <span className="font-semibold text-gray-900">{t(language, 'slotLabel')} </span>
              <span className="text-emerald-950 font-bold">
                {currentBooking.date.includes('2023-10-27') ? 'Oct 27' : currentBooking.date}, {currentBooking.timeRange}
              </span>
            </div>
            <span className="text-gray-300 mx-2.5 hidden sm:inline">|</span>
            <div>
              <span className="text-gray-900 font-semibold">{currentBooking.centreName.split('(')[0].trim()}</span>
            </div>
            <span className="text-gray-300 mx-2.5 hidden sm:inline">|</span>
            <div>
              <span className="font-semibold text-gray-900">{t(language, 'cropLabel')} </span>
              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                {currentBooking.cropType}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 py-1">
            {t(language, 'noActiveBooking')}
          </div>
        )}
      </div>

      {/* 2. "At the Centre: Live Queue Status" Card matching screenshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[#2E7D4F] border border-[#C8E6C9]">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {t(language, 'queueStatusTitle')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              LIVE
            </span>
            <button
              id="simulate-queue-tick-btn"
              onClick={onSimulateNextToken}
              disabled={isSimulating}
              title="Simulate Mandi officer calling next token"
              className="p-1 text-gray-400 hover:text-emerald-700 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Left Details matching screenshot */}
          <div className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1B5E3C] tracking-tight">
              {t(language, 'tokenPrefix')} #{tokenNumber}
            </div>
            
            <div className="text-xs sm:text-sm font-semibold text-gray-800">
              {t(language, 'currentServing')} <span className="font-extrabold text-gray-900">#{currentToken}</span>
            </div>

            <div className="text-xs sm:text-sm text-gray-700 font-medium">
              {t(language, 'estimatedWaitTime')}{' '}
              <span className="font-bold text-amber-700">
                {estimatedWaitMins} {t(language, 'minutes')}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-gray-700 font-medium">
              {t(language, 'waitingFarmers')}{' '}
              <span className="font-bold text-gray-900">{waitingFarmers}</span>
            </div>
          </div>

          {/* Right Circular Ring Visual showing #19 in center matching screenshot */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#E2E8F0"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Dark Green Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#1B5E3C"
                  strokeWidth="9"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * Math.min(100, Math.max(15, (currentToken / 30) * 100))) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Center Content: Current Token Number #19 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                  #{currentToken}
                </span>
                <span className="text-[9px] uppercase font-bold text-emerald-800 -mt-0.5 tracking-wider">
                  SERVING
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button to view full timeline */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Counter 2: Gate Weighbridge active
          </span>
          <button
            id="track-details-link-btn"
            onClick={onNavigateToTrack}
            className="text-xs font-bold text-[#1B5E3C] hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Live Mandi Feed</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. "My Status Tracker" Card matching screenshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4">
          {t(language, 'statusTrackerTitle')}
        </h3>

        {/* 4 Stages Horizontal Step Tracker */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 relative">
          
          {/* Connecting line between steps */}
          <div className="absolute top-3 left-4 right-4 h-0.5 bg-gray-200 -z-0">
            <div 
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{
                width: isPaymentDone ? '100%' : isAtCentreDone ? '66%' : isSlotBookedDone ? '33%' : '0%'
              }}
            />
          </div>

          {/* Step 1: Registered (Oct 24) */}
          <div className="flex flex-col items-center text-center z-10">
            <div className="w-6 h-6 rounded-full bg-[#1B5E3C] text-white flex items-center justify-center ring-4 ring-white shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-2 text-[11px] sm:text-xs font-bold text-[#1B5E3C] flex items-center gap-0.5">
              <span>{t(language, 'stageRegistered')}</span>
              <span className="text-[10px]">✓</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">(Oct 24)</span>
          </div>

          {/* Step 2: Slot Booked (Oct 27, 09:30 AM) */}
          <div className="flex flex-col items-center text-center z-10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
              isSlotBookedDone 
                ? 'bg-[#1B5E3C] text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className={`mt-2 text-[11px] sm:text-xs font-bold flex items-center gap-0.5 ${
              isSlotBookedDone ? 'text-[#1B5E3C]' : 'text-gray-400'
            }`}>
              <span>{t(language, 'stageSlotBooked')}</span>
              {isSlotBookedDone && <span className="text-[10px]">✓</span>}
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              {currentBooking ? `(${currentBooking.date.includes('2023-10-27') ? 'Oct 27' : currentBooking.date.slice(5)}, ${currentBooking.timeRange})` : '(Oct 27, 09:30 AM)'}
            </span>
          </div>

          {/* Step 3: At Centre (Waiting) */}
          <div className="flex flex-col items-center text-center z-10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
              isAtCentreDone 
                ? 'bg-[#1B5E3C] text-white' 
                : 'bg-gray-300 text-gray-500'
            }`}>
              {isAtCentreDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-500" />
              )}
            </div>
            <div className={`mt-2 text-[11px] sm:text-xs font-medium ${
              isAtCentreDone ? 'font-bold text-[#1B5E3C]' : 'text-gray-600'
            }`}>
              <span>{t(language, 'stageAtCentre')}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              {isAtCentreDone ? t(language, 'verifiedTag') : t(language, 'waitingTag')}
            </span>
          </div>

          {/* Step 4: Payment Processed */}
          <div className="flex flex-col items-center text-center z-10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
              isPaymentDone 
                ? 'bg-[#1B5E3C] text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              {isPaymentDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
            </div>
            <div className={`mt-2 text-[11px] sm:text-xs font-medium ${
              isPaymentDone ? 'font-bold text-[#1B5E3C]' : 'text-gray-500'
            }`}>
              <span>{t(language, 'stagePaymentProcessed')}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              {isPaymentDone ? '₹1,42,500 DBT' : '(Pending)'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
