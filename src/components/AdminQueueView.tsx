import React, { useState } from 'react';
import { 
  ShieldCheck, 
  PhoneCall, 
  Truck, 
  Scale, 
  CreditCard, 
  CheckCircle2, 
  RefreshCw, 
  UserCheck, 
  AlertCircle,
  Megaphone,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { Booking, CentreQueueState, ProcurementCentre, Language } from '../types';

interface AdminQueueViewProps {
  centre: ProcurementCentre;
  queueState: CentreQueueState;
  bookings: Booking[];
  onAdvanceQueue: () => Promise<void>;
  onResetQueue: () => Promise<void>;
  onUpdateBookingStatus: (bookingId: string, updates: any) => Promise<void>;
  language: Language;
  isSimulating: boolean;
}

export const AdminQueueView: React.FC<AdminQueueViewProps> = ({
  centre,
  queueState,
  bookings,
  onAdvanceQueue,
  onResetQueue,
  onUpdateBookingStatus,
  language,
  isSimulating
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [weighModalBooking, setWeighModalBooking] = useState<Booking | null>(null);
  const [weighQty, setWeighQty] = useState<number>(55);

  const currentToken = queueState.currentServingToken;

  // Filter bookings for this centre
  const centreBookings = bookings.filter(b => b.centreId === centre.id);

  const waitingCount = centreBookings.filter(
    b => b.tokenNumber > currentToken && b.status !== 'cancelled'
  ).length;

  const servedCount = centreBookings.filter(
    b => b.status === 'served' || b.status === 'payment_processed'
  ).length;

  const filteredBookings = centreBookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        b.farmerName.toLowerCase().includes(q) ||
        b.vehicleNo.toLowerCase().includes(q) ||
        String(b.tokenNumber).includes(q)
      );
    }
    return true;
  });

  const handleRecordWeighment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighModalBooking) return;
    await onUpdateBookingStatus(weighModalBooking.id, {
      status: 'served',
      actualQuantityQuintals: Number(weighQty)
    });
    setWeighModalBooking(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Staff Header */}
      <div className="bg-[#1B5E3C] text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-xs font-bold border border-emerald-600 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>APMC Staff &amp; Mandi In-Charge Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {centre.name}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              Operational Gate: 2 (Weighbridge) · Daily Capacity: {centre.dailyCapacity} Vehicles · Contact: {centre.contactPhone}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="admin-call-next-btn"
              onClick={onAdvanceQueue}
              disabled={isSimulating}
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm sm:text-base flex items-center gap-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Megaphone className="w-5 h-5" />
              <span>Call Next Token (#{currentToken + 1})</span>
            </button>

            <button
              id="admin-reset-queue-btn"
              onClick={onResetQueue}
              className="px-3 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold transition-colors"
              title="Reset queue to demo state"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-700/60">
          <div className="bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-700/40">
            <span className="text-xs text-emerald-200 font-medium block">Current Serving</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              #{currentToken}
            </div>
          </div>

          <div className="bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-700/40">
            <span className="text-xs text-emerald-200 font-medium block">In Queue Ahead</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-0.5">
              {waitingCount} <span className="text-xs font-normal text-emerald-200">farmers</span>
            </div>
          </div>

          <div className="bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-700/40">
            <span className="text-xs text-emerald-200 font-medium block">Vehicles Served Today</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              {servedCount}
            </div>
          </div>

          <div className="bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-700/40">
            <span className="text-xs text-emerald-200 font-medium block">Avg Service Time</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              {queueState.averageMinutesPerToken} <span className="text-xs font-normal text-emerald-200">min/vehicle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Queue Management Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search token #, farmer, vehicle..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E3C] focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-bold">
            {['all', 'slot_booked', 'at_centre', 'served', 'payment_processed'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setFilterStatus(statusKey)}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors ${
                  filterStatus === statusKey
                    ? 'bg-[#1B5E3C] text-white border-[#1B5E3C]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {statusKey === 'all' ? 'All Tokens' : statusKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tokens List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Commodity &amp; Vehicle</th>
                <th className="py-3 px-4">Slot Time</th>
                <th className="py-3 px-4">Queue Status</th>
                <th className="py-3 px-4 text-right">Staff Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((b) => {
                const isCurrent = b.tokenNumber === currentToken;
                const isNext = b.tokenNumber === currentToken + 1;

                return (
                  <tr 
                    key={b.id} 
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isCurrent ? 'bg-amber-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-sm ${
                          isCurrent 
                            ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-500' 
                            : b.tokenNumber < currentToken 
                            ? 'bg-gray-100 text-gray-500' 
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          #{b.tokenNumber}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                            At Counter
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                            Next
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{b.farmerName}</div>
                      <div className="text-gray-500 text-xs flex items-center gap-1 font-mono">
                        <PhoneCall className="w-3 h-3 text-emerald-700" />
                        +91 {b.farmerPhone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800">
                        {b.cropType} ({b.actualQuantityQuintals || b.estimatedQuantityQuintals} Qtl)
                      </div>
                      <div className="text-xs font-mono font-bold text-gray-600">
                        {b.vehicleNo}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-gray-800 font-medium">{b.timeRange}</div>
                      <div className="text-[11px] text-gray-400">{b.date}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        b.status === 'payment_processed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'served'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'at_centre'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status === 'payment_processed' 
                          ? 'Payment Processed' 
                          : b.status === 'served' 
                          ? 'Weighed & Served' 
                          : b.status === 'at_centre' 
                          ? 'Checked In (Gate 2)' 
                          : 'Slot Booked'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Step 1: Gate Check In */}
                        {b.status === 'slot_booked' && (
                          <button
                            id={`admin-checkin-${b.id}`}
                            onClick={() => onUpdateBookingStatus(b.id, { status: 'at_centre' })}
                            className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark At Gate
                          </button>
                        )}

                        {/* Step 2: Weighment & Grain Quality */}
                        {b.status === 'at_centre' && (
                          <button
                            id={`admin-weigh-${b.id}`}
                            onClick={() => {
                              setWeighModalBooking(b);
                              setWeighQty(b.estimatedQuantityQuintals || 55);
                            }}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            Record Weight
                          </button>
                        )}

                        {/* Step 3: DBT Payment Settlement */}
                        {b.status === 'served' && (
                          <button
                            id={`admin-dbt-${b.id}`}
                            onClick={() => onUpdateBookingStatus(b.id, { 
                              paymentStatus: 'processed',
                              paymentAmount: Math.round((b.actualQuantityQuintals || b.estimatedQuantityQuintals) * b.mspRatePerQuintal)
                            })}
                            className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Disburse DBT
                          </button>
                        )}

                        {b.status === 'payment_processed' && (
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Settled
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Weighment Recording Modal */}
      {weighModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-700" />
              Weighbridge Measurement Slip
            </h3>
            <p className="text-xs text-gray-500">
              Token #{weighModalBooking.tokenNumber} · Farmer: {weighModalBooking.farmerName} · Vehicle: {weighModalBooking.vehicleNo}
            </p>

            <form onSubmit={handleRecordWeighment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Net Grain Weight (Quintals)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weighQty}
                  onChange={(e) => setWeighQty(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E3C]"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Govt MSP:</span>
                  <span className="font-bold">₹{weighModalBooking.mspRatePerQuintal}/Qtl</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Payable to Farmer:</span>
                  <span>₹{Math.round(weighQty * weighModalBooking.mspRatePerQuintal).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWeighModalBooking(null)}
                  className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B5E3C] text-white text-xs font-bold rounded-lg hover:bg-emerald-800"
                >
                  Save &amp; Generate J-Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
