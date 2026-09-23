import React from 'react';
import { 
  History, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  QrCode, 
  FileText, 
  ChevronRight,
  PlusCircle,
  CreditCard,
  Phone,
  MessageSquare,
  Building2
} from 'lucide-react';
import { Booking, Language } from '../types';
import { t } from '../i18n';
import { DashboardHero } from './DashboardHero';
import { DashboardStatCard } from './DashboardStatCard';

interface BookingHistoryViewProps {
  bookings: Booking[];
  language: Language;
  onSelectBookingToTrack: (booking: Booking) => void;
  onOpenGatePass: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onNavigateToBook: () => void;
  onCallBuyer?: (booking: Booking) => void;
  onOpenChat?: (booking: Booking) => void;
}

export const BookingHistoryView: React.FC<BookingHistoryViewProps> = ({
  bookings,
  language,
  onSelectBookingToTrack,
  onOpenGatePass,
  onCancelBooking,
  onNavigateToBook,
  onCallBuyer,
  onOpenChat,
}) => {
  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'payment_processed');
  const pastBookings = bookings.filter(b => b.status === 'payment_processed' || b.status === 'cancelled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      <DashboardHero
        tone="cream"
        badge={<span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5"><History className="w-3.5 h-3.5 text-[#1B5E3C]" /> Farmer Booking Portal</span>}
        title="Procurement Bookings & J-Forms"
        subtitle="Track active tokens, download mandi gate passes, and view DBT payment advice slips."
        actions={(
          <button
          id="history-new-booking-btn"
          onClick={onNavigateToBook}
          className="px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Slot</span>
        </button>
        )}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashboardStatCard label="Active Bookings" value={activeBookings.length} detail="Scheduled or at mandi" icon={<Clock className="w-4 h-4 text-emerald-700" />} />
        <DashboardStatCard label="Past Bookings" value={pastBookings.length} detail="Completed or cancelled" icon={<History className="w-4 h-4 text-amber-700" />} />
        <DashboardStatCard label="Gate Passes" value={activeBookings.length} detail="Available to open" icon={<QrCode className="w-4 h-4 text-emerald-700" />} />
        <DashboardStatCard label="Booking Status" value={activeBookings.length ? 'Active' : 'Open'} detail="Manage your mandi visits" icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />} />
      </div>

      {/* Active Bookings Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-700" />
          <span>Active &amp; Scheduled Bookings ({activeBookings.length})</span>
        </h2>

        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No active bookings scheduled.</p>
            <button
              onClick={onNavigateToBook}
              className="mt-3 text-xs font-bold text-[#1B5E3C] hover:underline"
            >
              Book your procurement slot now →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeBookings.map((booking) => {
              return (
                <div 
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 hover:border-emerald-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          TOKEN #{booking.tokenNumber}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          Ref: #{booking.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {booking.centreName}
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Commodity: <strong className="text-gray-900">{booking.cropType}</strong> ({booking.estimatedQuantityQuintals} Quintals) · Vehicle: <strong className="text-gray-900 font-mono">{booking.vehicleNo}</strong>
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-sm font-bold text-[#1B5E3C]">
                        {booking.date}, {booking.timeRange}
                      </div>
                      <span className="inline-block mt-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Status: {booking.status === 'at_centre' ? 'At Mandi Gate' : 'Slot Confirmed'}
                      </span>
                    </div>
                  </div>

                  {/* Card actions */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      id={`track-booking-${booking.id}`}
                      onClick={() => onSelectBookingToTrack(booking)}
                      className="font-bold text-[#1B5E3C] hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Track Live Queue Position</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      {onCallBuyer && (
                        <button
                          id={`call-buyer-booking-${booking.id}`}
                          onClick={() => onCallBuyer(booking)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Buyer</span>
                        </button>
                      )}

                      {onOpenChat && (
                        <button
                          id={`chat-buyer-booking-${booking.id}`}
                          onClick={() => onOpenChat(booking)}
                          className="px-3 py-1.5 rounded-lg bg-[#1B5E3C] hover:bg-[#14472D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Chat</span>
                        </button>
                      )}

                      <button
                        id={`pass-booking-${booking.id}`}
                        onClick={() => onOpenGatePass(booking)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 flex items-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Gate Pass QR</span>
                      </button>
                      <button
                        id={`cancel-booking-${booking.id}`}
                        onClick={() => {
                          if (confirm(`Are you sure you want to cancel Token #${booking.tokenNumber}?`)) {
                            onCancelBooking(booking.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Slot</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Completed Bookings & J-Forms */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Past Completed Procurements &amp; DBT Records ({pastBookings.length})</span>
        </h2>

        {pastBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-xs text-gray-500">
            No past completed records yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pastBookings.map((booking) => {
              const isCancelled = booking.status === 'cancelled';
              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isCancelled ? 'border-gray-200 opacity-70' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        Token #{booking.tokenNumber} · {booking.centreName}
                      </span>
                      {isCancelled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                          Cancelled
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          DBT Payment Credited
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Date: {booking.date} · {booking.cropType} ({booking.actualQuantityQuintals || booking.estimatedQuantityQuintals} Qtl) · MSP: ₹{booking.mspRatePerQuintal}/Qtl
                    </p>
                    {!isCancelled && booking.paymentRef && (
                      <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                        Ref: {booking.paymentRef} · Amount: ₹{(booking.paymentAmount || 123305).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`Digital J-Form (Mandi Weighment Receipt)\n\nFarmer: ${booking.farmerName}\nToken: #${booking.tokenNumber}\nCentre: ${booking.centreName}\nCrop: ${booking.cropType}\nQuantity: ${booking.actualQuantityQuintals || booking.estimatedQuantityQuintals} Quintals\nTotal MSP Value: ₹${(booking.paymentAmount || 123305).toLocaleString('en-IN')}\nStatus: Disbursed to Bank`)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                        <span>View J-Form Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
