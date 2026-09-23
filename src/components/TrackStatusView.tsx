import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  Scale, 
  CreditCard, 
  QrCode, 
  AlertCircle, 
  RefreshCw, 
  PhoneCall, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Sparkles
} from 'lucide-react';
import { Booking, CentreQueueState, Language, FarmerProfile, PaymentRequest } from '../types';
import { t } from '../i18n';
import { getPaymentRequests } from '../lib/supabaseService';
import { DashboardHero } from './DashboardHero';
import { DashboardStatCard } from './DashboardStatCard';

interface TrackStatusViewProps {
  booking: Booking | null;
  queueState: CentreQueueState;
  farmer: FarmerProfile;
  language: Language;
  onOpenGatePass: () => void;
  onSimulateAdvance: () => void;
  isSimulating: boolean;
  onViewTransactions?: () => void;
}

export const TrackStatusView: React.FC<TrackStatusViewProps> = ({
  booking,
  queueState,
  farmer,
  language,
  onOpenGatePass,
  onSimulateAdvance,
  isSimulating,
  onViewTransactions
}) => {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [latestPayment, setLatestPayment] = useState<PaymentRequest | null>(null);

  const isHindi = language === 'hi';

  // Real-time polling every 6 seconds
  useEffect(() => {
    const fetchLatestPayment = async () => {
      try {
        const reqs = await getPaymentRequests({ farmer_id: farmer.id });
        if (reqs && reqs.length > 0) {
          // Find matching for current booking or token
          const matching = reqs.find(r => r.booking_id === booking?.id || r.token_number === booking?.tokenNumber) || reqs[0];
          setLatestPayment(matching);
        }
      } catch (err) {
        console.warn('Payment fetch failed:', err);
      }
    };

    fetchLatestPayment();

    const interval = setInterval(() => {
      setLastRefreshed(new Date());
      fetchLatestPayment();
    }, 6000); // 6s poll as requested (5-10s)

    return () => clearInterval(interval);
  }, [booking?.id, booking?.tokenNumber, farmer.id]);

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <DashboardHero
          tone="cream"
          badge={<span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-[#1B5E3C]" /> Live Queue &amp; Payment Tracking</span>}
          title={isHindi ? 'टोकन और भुगतान स्थिति ट्रैक करें' : 'Track Mandi Token & Payment Status'}
          subtitle={isHindi ? 'अपने सक्रिय मंडी टोकन और भुगतान की स्थिति देखें।' : 'Live queue position, weighbridge progress, and DBT payment updates.'}
        />
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{isHindi ? 'कोई सक्रिय बुकिंग नहीं मिली' : 'No Active Booking Found'}</h2>
          <p className="text-sm text-gray-600 mb-6">{isHindi ? 'वर्तमान में कोई सक्रिय खरीद स्लॉट निर्धारित नहीं है।' : 'You currently have no active procurement slot scheduled. Book a slot from the dashboard to track your queue status and payment.'}</p>
        </div>
      </div>
    );
  }

  const tokenNumber = booking.tokenNumber;
  const currentToken = queueState.currentServingToken;
  const tokensAhead = Math.max(0, tokenNumber - currentToken);
  const estimatedWaitMins = tokensAhead * (queueState.averageMinutesPerToken || 3);

  const isAtCounter = tokenNumber === currentToken;
  const isPastTurn = tokenNumber < currentToken;

  // Status indicator rule: Delayed if wait > 25 mins or tokensAhead > 8
  const isDelayed = tokensAhead > 8 || estimatedWaitMins > 25;
  const statusLabel = isDelayed 
    ? (isHindi ? '🟡 विलंबित (भारी मंडी आवक)' : '🟡 Delayed (+15m traffic at Gate 2)')
    : (isHindi ? '🟢 समय पर (निर्धारित गति)' : '🟢 On Schedule');

  // Check payment state
  const isProcurementRecorded = isPastTurn || booking.status === 'served' || booking.status === 'payment_processed' || latestPayment !== null;
  const isPaymentPaid = latestPayment?.status === 'paid' || booking.paymentStatus === 'processed';
  const paymentAmount = latestPayment?.final_amount || booking.paymentAmount || (booking.estimatedQuantityQuintals * booking.mspRatePerQuintal);

  const stages = [
    {
      id: 'reg',
      title: isHindi ? 'किसान सत्यापन व पंजीकरण' : 'Farmer Registration & Verification',
      subtitle: `${isHindi ? 'सत्यापित किसान आईडी' : 'Verified Farmer ID'}: ${farmer.registrationNo}`,
      date: '2023-10-24',
      status: 'completed',
      icon: CheckCircle2
    },
    {
      id: 'slot',
      title: isHindi ? 'स्लॉट आवंटित व टोकन जारी' : 'Slot Booked & Token Issued',
      subtitle: `Token #${booking.tokenNumber} · ${booking.date}, ${booking.timeRange}`,
      date: booking.createdDate,
      status: 'completed',
      icon: CheckCircle2
    },
    {
      id: 'gate',
      title: isHindi ? 'मंडी आगमन व गेट प्रवेश' : 'Arrival & Gate Check-in',
      subtitle: booking.checkInTime 
        ? `Checked in at ${booking.checkInTime} via Gate 2` 
        : `Vehicle ${booking.vehicleNo} · Report to Gate 2 upon arrival`,
      date: booking.date,
      status: booking.status === 'at_centre' || isProcurementRecorded ? 'completed' : isAtCounter ? 'in_progress' : 'pending',
      icon: Truck
    },
    {
      id: 'weigh',
      title: isHindi ? 'इलेक्ट्रॉनिक तौल व गुणवत्ता जांच' : 'Electronic Weighment & Quality Graded',
      subtitle: latestPayment 
        ? `Weighed ${latestPayment.quantity_quintals} Qtl (${latestPayment.quality_grade}, Moisture: ${latestPayment.moisture_percentage || 11.4}%)` 
        : `Automated electronic weighbridge · Moisture test`,
      date: booking.date,
      status: isProcurementRecorded ? 'completed' : booking.status === 'at_centre' ? 'in_progress' : 'pending',
      icon: Scale
    },
    {
      id: 'dbt',
      title: isHindi ? 'बैंक खाते में डीबीटी भुगतान' : 'DBT Payment Disbursed to Bank',
      subtitle: isPaymentPaid 
        ? `₹${paymentAmount.toLocaleString('en-IN')} transferred via PFMS DBT. Ref: ${latestPayment?.payment_ref || booking.paymentRef || 'DBT-PFMS-994821041'}` 
        : latestPayment
        ? `Payment request generated to buyer (${latestPayment.buyer_name}). Awaiting settlement.`
        : `Direct credit to ${farmer.bankAccountMasked} upon weight sign-off`,
      date: latestPayment?.paid_at ? new Date(latestPayment.paid_at).toLocaleTimeString() : 'Within 2-Hour APMC SLA',
      status: isPaymentPaid ? 'completed' : latestPayment ? 'in_progress' : 'pending',
      icon: CreditCard
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <DashboardHero
        tone="cream"
        badge={<span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-[#1B5E3C]" /> Live Queue & Payment Tracking</span>}
        title={isHindi ? 'टोकन और भुगतान स्थिति ट्रैक करें' : 'Track Mandi Token & Payment Status'}
        subtitle={booking ? `${booking.centreName} · Token #${booking.tokenNumber} · ${booking.cropType}` : 'Live queue position, weighbridge progress, and DBT payment updates.'}
        actions={(
          <button
            type="button"
            onClick={onSimulateAdvance}
            disabled={isSimulating}
            className="px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Refreshing...' : 'Refresh Queue'}</span>
          </button>
        )}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard label="Your Token" value={`#${booking.tokenNumber}`} detail={`Serving #${currentToken}`} icon={<Compass className="w-4 h-4 text-emerald-700" />} />
        <DashboardStatCard label="Farmers Ahead" value={tokensAhead} detail={`${estimatedWaitMins} min estimated wait`} icon={<Clock className="w-4 h-4 text-amber-700" />} />
        <DashboardStatCard label="Queue Status" value={isDelayed ? 'Delayed' : 'On Schedule'} detail="Live gate sync" icon={<Truck className="w-4 h-4 text-emerald-700" />} />
        <DashboardStatCard label="Payment Status" value={isPaymentPaid ? 'Paid' : isProcurementRecorded ? 'Pending' : 'Awaiting'} detail="DBT settlement" icon={<CreditCard className="w-4 h-4 text-emerald-700" />} />
      </div>
      
      {/* Real-time sync ticker */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/10 border border-emerald-800/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-emerald-900">
            {isHindi ? 'लाइव कतार सिंक सक्रिय' : 'Live Real-Time Queue Sync Active'}
          </span>
          <span className="text-gray-500 text-[11px] hidden sm:inline">
            (Auto-refreshes every 6s)
          </span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">
          Last polled: {lastRefreshed.toLocaleTimeString()}
        </span>
      </div>

      {/* Payment Notification Alert Banner */}
      {isProcurementRecorded && (
        <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
          isPaymentPaid 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isPaymentPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {isPaymentPaid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current">
                    {isPaymentPaid ? (isHindi ? 'भुगतान प्राप्त' : 'Payment Received') : (isHindi ? 'भुगतान लंबित' : 'Payment Pending')}
                  </span>
                  <span className="text-xs font-semibold text-gray-600">
                    Token #{tokenNumber}
                  </span>
                </div>
                <h3 className="text-lg font-black mt-1">
                  {isPaymentPaid 
                    ? `✅ ₹${paymentAmount.toLocaleString('en-IN')} ${isHindi ? 'खाते में प्राप्त' : 'Received into Bank Account'}`
                    : `⏳ ₹${paymentAmount.toLocaleString('en-IN')} ${isHindi ? 'खरीदार से देय' : 'Payment Pending from Buyer'}`}
                </h3>
                <p className="text-xs text-gray-700 mt-0.5">
                  {isPaymentPaid 
                    ? `Direct Benefit Transfer (DBT) completed. Ref: ${latestPayment?.payment_ref || 'DBT-PFMS-994821041'}`
                    : `Weighment signed off. Buyer ${latestPayment?.buyer_name || 'Haryana Agro Millers'} has an active 2-hour APMC deadline.`}
                </p>
              </div>
            </div>

            {onViewTransactions && (
              <button
                onClick={onViewTransactions}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>{isHindi ? 'लेन-देन इतिहास देखें' : 'View Transactions'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Live Queue Box */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-6">
        
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isHindi ? 'लाइव कतार स्थिति' : 'Live Queue Status'}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Booking #{booking.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B5E3C]">
              {booking.centreName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {isHindi ? 'फसल' : 'Commodity'}: <span className="font-bold text-gray-900">{booking.cropType}</span> · Vehicle: <span className="font-mono font-bold text-gray-900">{booking.vehicleNo}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              id="track-open-gatepass-btn"
              onClick={onOpenGatePass}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>{isHindi ? 'गेट पास QR' : 'Show Gate Pass QR'}</span>
            </button>
            <button
              id="track-simulate-step-btn"
              onClick={onSimulateAdvance}
              disabled={isSimulating}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'कतार आगे बढ़ाएं' : 'Simulate Queue Step'}</span>
            </button>
          </div>
        </div>

        {/* 4 Essential Stat Highlights: Slot Time, Farmers Ahead, Wait, Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          
          {/* 1. Your Slot Time */}
          <div className="bg-[#FAF6EE] p-4 rounded-xl border border-amber-200/70">
            <span className="text-xs text-gray-500 font-semibold block">
              {isHindi ? 'आपका आवंटित स्लॉट' : 'Your Slot Time'}
            </span>
            <div className="text-lg font-black text-[#1B5E3C] mt-1">
              {booking.timeRange}
            </div>
            <span className="text-[11px] text-gray-600 block mt-0.5">
              Scheduled: {booking.date}
            </span>
          </div>

          {/* 2. Farmers Ahead Count */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/70">
            <span className="text-xs text-gray-500 font-semibold block">
              {isHindi ? 'आगे कतार में किसान' : 'Farmers Ahead Count'}
            </span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {tokensAhead === 0 ? (isHindi ? 'आपका नंबर!' : '0 (You are NEXT!)') : `${tokensAhead} Farmers Ahead`}
            </div>
            <span className="text-[11px] text-emerald-800 font-medium">
              Serving: #{currentToken} · Your: #{tokenNumber}
            </span>
          </div>

          {/* 3. Estimated Wait */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 font-semibold block">
              {isHindi ? 'अनुमानित प्रतीक्षा समय' : 'Estimated Wait Time'}
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {tokensAhead === 0 ? '0 mins' : `${estimatedWaitMins} mins`}
            </div>
            <span className="text-[11px] text-gray-500">
              ~{queueState.averageMinutesPerToken || 3} mins per trolley
            </span>
          </div>

          {/* 4. Real-time Status Indicator (On Schedule / Delayed) */}
          <div className={`p-4 rounded-xl border ${
            isDelayed ? 'bg-amber-50/80 border-amber-300' : 'bg-emerald-50/80 border-emerald-300'
          }`}>
            <span className="text-xs text-gray-500 font-semibold block">
              {isHindi ? 'कतार स्थिति संकेतक' : 'Mandi Speed Indicator'}
            </span>
            <div className="text-base font-black mt-1">
              {statusLabel}
            </div>
            <span className="text-[11px] text-gray-600 block mt-0.5">
              {isDelayed ? 'High volume at Gate 2' : 'Weighbridge operating smoothly'}
            </span>
          </div>

        </div>

      </div>

      {/* Visual Lifecycle Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#1B5E3C]" />
          <span>{isHindi ? 'संपूर्ण खरीद व भुगतान जीवनचक्र' : 'Full Procurement & Payment Lifecycle'}</span>
        </h2>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="relative flex items-start gap-4">
                {/* Dot */}
                <div className={`absolute -left-6 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isCompleted 
                    ? 'bg-[#1B5E3C] text-white shadow-xs' 
                    : isInProgress 
                    ? 'bg-amber-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50/70 p-4 rounded-xl border border-gray-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className={`text-sm sm:text-base font-bold ${
                      isCompleted ? 'text-gray-900' : isInProgress ? 'text-amber-800' : 'text-gray-500'
                    }`}>
                      {stage.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                      {stage.date}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {stage.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandi Arrival Guidelines Box */}
      <div className="bg-[#FAF6EE] rounded-2xl border border-[#E9E0CB] p-5">
        <h3 className="text-sm font-bold text-[#1B5E3C] mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1B5E3C]" />
          <span>{isHindi ? 'मंडी आगमन व गेट दिशानिर्देश' : 'Mandi Arrival & Gate Protocol'}</span>
        </h3>
        <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
          <li>Enter via <strong>Gate 2 (Dedicated Tractor-Trolley Lane)</strong> on Grand Trunk Road.</li>
          <li>Show your <strong>Digital Gate Pass QR Code</strong> on mobile or printed slip at the automated boom barrier.</li>
          <li>Keep original <strong>Aadhaar Card, Land Record (Fard), and Vehicle RC</strong> ready for instant weighbridge validation.</li>
          <li>Weighment slip (J-Form) will be digitally issued and payment credited within 24 to 48 hours directly to your Aadhaar-linked bank account.</li>
        </ul>
      </div>

    </div>
  );
};
