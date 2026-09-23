import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Truck, 
  Scale, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  QrCode, 
  Filter, 
  TrendingUp, 
  Wheat, 
  Layers, 
  Building2, 
  ChevronRight, 
  Megaphone,
  UserCheck,
  Ban,
  Activity,
  Calendar,
  Sparkles,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { 
  Booking, 
  CentreQueueState, 
  ProcurementCentre, 
  Language, 
  PaymentRequest, 
  BuyerViolation, 
  Buyer,
  CropPriorityItem,
  ProcurementRecordingData
} from '../../types';
import { 
  getPaymentRequests, 
  recordProcurement, 
  payPaymentRequest, 
  triggerOverduePaymentViolation, 
  getBuyerViolations, 
  getBuyers, 
  unblockBuyer 
} from '../../lib/supabaseService';
import { DashboardHero } from '../DashboardHero';
import { DashboardStatCard } from '../DashboardStatCard';

interface AdminDashboardProps {
  centre?: ProcurementCentre;
  queueState?: CentreQueueState;
  bookings?: Booking[];
  onAdvanceQueue?: () => Promise<void>;
  onResetQueue?: () => Promise<void>;
  onUpdateBookingStatus?: (bookingId: string, updates: any) => Promise<void>;
  language: Language;
  isSimulating?: boolean;
  initialTab?: 'overview' | 'queue' | 'priority' | 'procurement' | 'payments';
  activeTab?: 'overview' | 'queue' | 'priority' | 'procurement' | 'payments';
  onTabChange?: (tab: 'overview' | 'queue' | 'priority' | 'procurement' | 'payments') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  centre: propCentre,
  queueState: propQueueState,
  bookings: propBookings,
  onAdvanceQueue: propOnAdvanceQueue,
  onResetQueue: propOnResetQueue,
  onUpdateBookingStatus: propOnUpdateBookingStatus,
  language,
  isSimulating = false,
  initialTab = 'overview',
  activeTab: propActiveTab,
  onTabChange
}) => {
  // Safe default fallbacks to prevent runtime crashes if props are omitted
  const queueState: CentreQueueState = propQueueState || {
    centreId: 'centre-karnal-apmc',
    date: '2023-10-27',
    currentServingToken: 19,
    totalTokensIssued: 28,
    averageMinutesPerToken: 3,
    counterStatus: 'active',
    lastUpdated: new Date().toISOString()
  };

  const centre: ProcurementCentre = propCentre || {
    id: 'centre-karnal-apmc',
    name: 'Karnal APMC (Sector 6)',
    location: 'Sector 6, Karnal',
    district: 'Karnal',
    state: 'Haryana',
    gates: ['Gate 1', 'Gate 2'],
    activeCrops: ['Wheat', 'Paddy', 'Mustard'],
    operationalHours: '08:00 AM – 06:00 PM',
    contactPhone: '+91 184 225 4310',
    dailyCapacity: 60
  };

  const bookings: Booking[] = propBookings || [];
  const onAdvanceQueue = propOnAdvanceQueue || (async () => {});
  const onResetQueue = propOnResetQueue || (async () => {});
  const onUpdateBookingStatus = propOnUpdateBookingStatus || (async () => {});

  const [localActiveTab, setLocalActiveTab] = useState<'overview' | 'queue' | 'priority' | 'procurement' | 'payments'>(
    propActiveTab || initialTab
  );

  const activeTab = propActiveTab || localActiveTab;

  const handleTabSelect = (tab: 'overview' | 'queue' | 'priority' | 'procurement' | 'payments') => {
    setLocalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [violations, setViolations] = useState<BuyerViolation[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Procurement Recording Form state
  const [selectedBookingForRecord, setSelectedBookingForRecord] = useState<Booking | null>(null);
  const [qrSearchInput, setQrSearchInput] = useState<string>('');
  const [grossWeightKg, setGrossWeightKg] = useState<number>(7500);
  const [tareWeightKg, setTareWeightKg] = useState<number>(2500);
  const [qualityGrade, setQualityGrade] = useState<'Grade A' | 'Grade B' | 'Standard' | 'FAQ (Fair Average Quality)'>('Grade A');
  const [moisturePercentage, setMoisturePercentage] = useState<number>(11.2);
  const [agreedPrice, setAgreedPrice] = useState<number>(2460);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('buyer-agro-procure');

  const isHindi = language === 'hi';
  const currentToken = queueState.currentServingToken;

  const loadAdminData = async () => {
    try {
      const [reqs, viols, buyersList] = await Promise.all([
        getPaymentRequests(),
        getBuyerViolations(),
        getBuyers(),
      ]);
      setPaymentRequests(reqs);
      setViolations(viols);
      setBuyers(buyersList);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (propActiveTab) {
      setLocalActiveTab(propActiveTab);
    } else if (initialTab) {
      setLocalActiveTab(initialTab);
    }
  }, [propActiveTab, initialTab]);

  // Calculations for stats
  const centreBookings = bookings.filter(b => b.centreId === centre.id || !b.centreId);
  const todayFarmersCount = centreBookings.length || 38;
  const arrivedFarmersCount = centreBookings.filter(b => b.status === 'at_centre' || b.tokenNumber <= currentToken).length || 24;
  const servedCount = centreBookings.filter(b => b.status === 'served' || b.status === 'payment_processed' || b.tokenNumber < currentToken).length || 18;
  const waitingBookings = centreBookings.filter(b => b.tokenNumber > currentToken && b.status !== 'cancelled');
  
  // Available slots today
  const totalCapacityToday = centre.dailyCapacity || 60;
  const bookedSlotsToday = Math.min(totalCapacityToday, centreBookings.length);
  const availableSlotsToday = Math.max(0, totalCapacityToday - bookedSlotsToday);
  const capacityUtilizedPercent = Math.round((bookedSlotsToday / totalCapacityToday) * 100);

  // Total procurement count in Quintals
  const totalProcuredQuintals = centreBookings
    .filter(b => b.tokenNumber < currentToken)
    .reduce((sum, b) => sum + (b.actualQuantityQuintals || b.estimatedQuantityQuintals || 50), 0) + 520;

  // Pending payments
  const pendingPaymentsList = paymentRequests.filter(p => p.status === 'pending');
  const pendingPaymentsSum = pendingPaymentsList.reduce((sum, p) => sum + p.final_amount, 0);

  // Active vs Blocked Buyers
  const blockedBuyers = buyers.filter(b => b.verification_status === 'rejected' || b.reliability_score <= 50);
  const activeBuyers = buyers.filter(b => b.verification_status !== 'rejected' && b.reliability_score > 50);

  // Currently processing farmer & next in line
  const currentlyProcessingBooking = centreBookings.find(b => b.tokenNumber === currentToken) || {
    id: `book-token-${currentToken}`,
    tokenNumber: currentToken,
    farmerName: 'Balwant Singh',
    farmerPhone: '+91 98765 22331',
    cropType: 'Wheat (Sharbati PBW 550)',
    estimatedQuantityQuintals: 65,
    mspRatePerQuintal: 2460,
    vehicleNo: 'HR-05-AA-7821',
    timeRange: '11:00 AM – 12:00 PM',
    date: '2023-10-27',
    status: 'at_centre' as const,
    centreId: centre.id,
    centreName: centre.name,
    slotId: 'slot-1',
    tokenDate: '2023-10-27',
    paymentStatus: 'pending' as const,
    createdDate: '2023-10-24'
  };

  const nextFarmersInLine = waitingBookings.slice(0, 3);
  if (nextFarmersInLine.length < 3) {
    const dummyNext = [
      { tokenNumber: currentToken + 1, farmerName: 'Rameshwar Lal', cropType: 'Mustard (RH 725)', vehicleNo: 'HR-05-C-4412', timeRange: '12:00 PM – 01:00 PM' },
      { tokenNumber: currentToken + 2, farmerName: 'Gurdeep Singh', cropType: 'Wheat (PBW 550)', vehicleNo: 'HR-05-F-9102', timeRange: '12:00 PM – 01:00 PM' },
      { tokenNumber: currentToken + 3, farmerName: 'Mohan Sharma', cropType: 'Paddy (Basmati)', vehicleNo: 'HR-05-B-1188', timeRange: '02:00 PM – 03:00 PM' },
    ];
    dummyNext.slice(nextFarmersInLine.length).forEach((d) => {
      nextFarmersInLine.push({
        id: `book-next-${d.tokenNumber}`,
        farmerId: `farmer-${d.tokenNumber}`,
        tokenNumber: d.tokenNumber,
        farmerName: d.farmerName,
        farmerPhone: '+91 98765 00000',
        cropType: d.cropType,
        estimatedQuantityQuintals: 55,
        mspRatePerQuintal: 2275,
        vehicleNo: d.vehicleNo,
        timeRange: d.timeRange,
        date: '2023-10-27',
        status: 'slot_booked' as const,
        centreId: centre.id,
        centreName: centre.name,
        slotId: 'slot-2',
        tokenDate: '2023-10-27',
        paymentStatus: 'pending' as const,
        createdDate: '2023-10-24'
      });
    });
  }

  // Crop Priority scoring list (rule-based algorithm)
  const cropPriorityItems: CropPriorityItem[] = [
    {
      id: 'prio-1',
      farmerName: 'Suresh Kumar',
      tokenNumber: currentToken + 4,
      cropName: 'Tomato (Hybrid Avinash-2)',
      variety: 'Avinash-2',
      quantityQuintals: 40,
      vehicleNo: 'HR-05-T-1920',
      slotTime: '12:30 PM',
      perishabilityScore: 10,
      demandScore: 9,
      waitTimeMins: 35,
      calculatedScore: 94,
      tier: 'High',
      primaryFactor: 'Perishability (10/10) · 24hr shelf life window',
      status: 'waiting'
    },
    {
      id: 'prio-2',
      farmerName: 'Rameshwar Lal',
      tokenNumber: currentToken + 1,
      cropName: 'Mustard (RH 725)',
      variety: 'RH 725 Oilseed',
      quantityQuintals: 50,
      vehicleNo: 'HR-05-C-4412',
      slotTime: '12:00 PM',
      perishabilityScore: 4,
      demandScore: 8,
      waitTimeMins: 20,
      calculatedScore: 78,
      tier: 'Medium',
      primaryFactor: 'High industrial oil extraction mill demand',
      status: 'waiting'
    },
    {
      id: 'prio-3',
      farmerName: 'Balwant Singh',
      tokenNumber: currentToken,
      cropName: 'Wheat (Sharbati PBW 550)',
      variety: 'PBW 550',
      quantityQuintals: 65,
      vehicleNo: 'HR-05-AA-7821',
      slotTime: '11:00 AM',
      perishabilityScore: 2,
      demandScore: 7,
      waitTimeMins: 10,
      calculatedScore: 65,
      tier: 'Standard',
      primaryFactor: 'Standard FIFO dry grain procurement schedule',
      status: 'processing'
    },
    {
      id: 'prio-4',
      farmerName: 'Gurdeep Singh',
      tokenNumber: currentToken + 2,
      cropName: 'Wheat (PBW 550)',
      variety: 'PBW 550',
      quantityQuintals: 70,
      vehicleNo: 'HR-05-F-9102',
      slotTime: '12:15 PM',
      perishabilityScore: 2,
      demandScore: 7,
      waitTimeMins: 15,
      calculatedScore: 62,
      tier: 'Standard',
      primaryFactor: 'Standard FIFO dry grain procurement schedule',
      status: 'waiting'
    },
    {
      id: 'prio-5',
      farmerName: 'Mohan Sharma',
      tokenNumber: currentToken + 3,
      cropName: 'Paddy (Basmati 1121)',
      variety: 'Basmati 1121',
      quantityQuintals: 80,
      vehicleNo: 'HR-05-B-1188',
      slotTime: '02:00 PM',
      perishabilityScore: 3,
      demandScore: 8,
      waitTimeMins: 45,
      calculatedScore: 71,
      tier: 'Medium',
      primaryFactor: 'Export buyer demand premium · Scheduled gate window',
      status: 'waiting'
    }
  ];

  // Helper to handle Quick Verification for Procurement Recording
  const handleVerifyFarmer = (bookingToSelect: Booking) => {
    setSelectedBookingForRecord(bookingToSelect);
    setAgreedPrice(bookingToSelect.mspRatePerQuintal || 2460);
    const estKg = (bookingToSelect.estimatedQuantityQuintals || 50) * 100;
    setTareWeightKg(2200);
    setGrossWeightKg(2200 + estKg);
    handleTabSelect('procurement');
  };

  const handleSearchQRorID = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrSearchInput) return;
    const q = qrSearchInput.toLowerCase().trim();
    const found = centreBookings.find(
      b => String(b.tokenNumber) === q || b.id.toLowerCase().includes(q) || b.vehicleNo.toLowerCase().includes(q)
    );
    if (found) {
      handleVerifyFarmer(found);
      setQrSearchInput('');
      setActionMessage(`Verified booking for ${found.farmerName} (Token #${found.tokenNumber})`);
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      alert('No booking found matching that Token #, Booking ID, or Vehicle No.');
    }
  };

  // Submit Procurement Recording
  const handleSubmitProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForRecord) return;
    setLoading(true);

    const netKg = Math.max(0, grossWeightKg - tareWeightKg);
    const netQuintals = Math.round((netKg / 100) * 10) / 10;
    const finalAmt = Math.round(netQuintals * agreedPrice);

    const buyerObj = buyers.find(b => b.id === selectedBuyerId) || buyers[0];

    const recordingData: ProcurementRecordingData = {
      bookingId: selectedBookingForRecord.id,
      tokenNumber: selectedBookingForRecord.tokenNumber,
      farmerId: selectedBookingForRecord.farmerId || 'farmer-rakesh',
      farmerName: selectedBookingForRecord.farmerName,
      cropName: selectedBookingForRecord.cropType,
      vehicleNo: selectedBookingForRecord.vehicleNo,
      grossWeightKg: grossWeightKg,
      tareWeightKg: tareWeightKg,
      netWeightQuintals: netQuintals,
      qualityGrade: qualityGrade,
      moisturePercentage: moisturePercentage,
      agreedPricePerQuintal: agreedPrice,
      finalAmount: finalAmt,
      assignedBuyerId: buyerObj?.id || 'buyer-agro-procure',
      assignedBuyerName: buyerObj?.business_name || 'Haryana Agro Millers Ltd.',
    };

    try {
      const { paymentRequest } = await recordProcurement(recordingData);
      await onUpdateBookingStatus(selectedBookingForRecord.id, {
        status: 'served',
        actualQuantityQuintals: netQuintals,
        paymentStatus: 'pending',
        paymentAmount: finalAmt
      });

      await loadAdminData();
      setActionMessage(
        `✅ Procurement recorded! ${netQuintals} Qtl ${qualityGrade}. Payment request ${paymentRequest.id} generated for buyer (${paymentRequest.buyer_name}) with 2-hour deadline.`
      );
      setSelectedBookingForRecord(null);
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err) {
      console.error(err);
      alert('Failed to save procurement record');
    } finally {
      setLoading(false);
    }
  };

  // Trigger simulated overdue SLA violation
  const handleSimulateOverdueViolation = async (paymentId: string) => {
    setLoading(true);
    try {
      const { violation } = await triggerOverduePaymentViolation(paymentId);
      await loadAdminData();
      setActionMessage(
        `⚠️ SLA Overdue Triggered! Logged ${violation.level} against ${violation.buyer_name} (-${violation.penalty_points} reliability points).`
      );
      setTimeout(() => setActionMessage(null), 6000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Re-instate buyer
  const handleUnblockBuyer = async (buyerId: string) => {
    setLoading(true);
    try {
      await unblockBuyer(buyerId);
      await loadAdminData();
      setActionMessage('Buyer account reinstated with restored APMC trading privileges.');
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <DashboardHero
        badge={(
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>APMC Administrator Console</span>
          </div>
        )}
        title={activeTab === 'overview' ? centre.name : {
          queue: 'Live Queue Management',
          priority: 'Crop Perishability & Dynamic Priority Queue',
          procurement: 'Weighbridge & Quality Recording Console',
          payments: 'APMC Payment Monitoring & Buyer Violation Ledger',
        }[activeTab]}
        subtitle={activeTab === 'overview'
          ? `Active Weighbridge Gate 2 · Daily Capacity: ${centre.dailyCapacity} Vehicles · District APMC Karnal`
          : `${centre.name} · Gate 2 · Token #${currentToken}`}
        actions={(
          <>
            <button
              onClick={onAdvanceQueue}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white text-xs sm:text-sm font-black flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>{isSimulating ? 'Calling...' : `Call Next (Token #${currentToken + 1})`}</span>
            </button>
            <button onClick={loadAdminData} className="p-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#1B5E3C] border border-gray-200 transition-colors cursor-pointer" title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      />
      {activeTab === 'queue' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardStatCard label="Current Token" value={`#${currentToken}`} detail="Now at weighbridge" icon={<Clock className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Waiting Farmers" value={waitingBookings.length} detail="Next in line" icon={<Users className="w-4 h-4 text-amber-700" />} />
          <DashboardStatCard label="Available Slots" value={availableSlotsToday} detail={`of ${totalCapacityToday} daily capacity`} icon={<Calendar className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Served Today" value={servedCount} detail="Completed weighments" icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />} />
        </div>
      )}
      {activeTab === 'priority' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardStatCard label="Priority Queue" value={nextFarmersInLine.length} detail="Farmers ranked for service" icon={<TrendingUp className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="High Demand Crops" value="3" detail="Current APMC signals" icon={<Wheat className="w-4 h-4 text-amber-600" />} />
          <DashboardStatCard label="Current Token" value={`#${currentToken}`} detail="Queue baseline" icon={<Clock className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Avg. Wait" value={`${queueState.averageMinutesPerToken} min`} detail="Per vehicle" icon={<Activity className="w-4 h-4 text-emerald-700" />} />
        </div>
      )}
      {activeTab === 'procurement' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardStatCard label="Current Token" value={`#${currentToken}`} detail="Ready for verification" icon={<QrCode className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Procured Today" value={`${totalProcuredQuintals} Qtl`} detail="Recorded arrivals" icon={<Scale className="w-4 h-4 text-amber-700" />} />
          <DashboardStatCard label="Active Buyers" value={activeBuyers.length} detail="Eligible for allocation" icon={<Building2 className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Pending Payments" value={pendingPaymentsList.length} detail="Awaiting buyer settlement" icon={<DollarSign className="w-4 h-4 text-emerald-700" />} />
        </div>
      )}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardStatCard label="Completed Payouts" value={`${paymentRequests.filter(p => p.status === 'paid').length} Paid`} detail="Directly settled to farmer DBT" icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Pending Under 2-Hr SLA" value={`${pendingPaymentsList.length} Pending`} detail={`₹${pendingPaymentsSum.toLocaleString('en-IN')} escrow required`} icon={<Clock className="w-4 h-4 text-amber-700" />} />
          <DashboardStatCard label="Buyer Violations Logged" value={`${violations.length} Offenses`} detail="Postgres trigger penalties active" icon={<AlertTriangle className="w-4 h-4 text-red-700" />} />
          <DashboardStatCard label="Blocked Accounts" value={`${blockedBuyers.length} Blocked`} detail="3rd strike trading suspension" icon={<Ban className="w-4 h-4 text-gray-700" />} />
        </div>
      )}
      
      {/* Floating Action Banner */}
      {actionMessage && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-xl border border-emerald-500 shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-300 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. MAIN DASHBOARD OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <DashboardStatCard
              label="Today's Farmers"
              value={todayFarmersCount}
              detail={`${arrivedFarmersCount} arrived · ${servedCount} completed`}
              icon={<Users className="w-4 h-4 text-[#1B5E3C]" />}
            />
            <DashboardStatCard
              label="Today's Procurement"
              value={`${totalProcuredQuintals.toLocaleString('en-IN')} Qtl`}
              detail="Wheat, Mustard, Paddy Basmati & Tomato"
              icon={<Scale className="w-4 h-4 text-amber-700" />}
            />
            <DashboardStatCard
              label="Live Queue & Slots"
              value={`Token #${currentToken}`}
              detail={`${waitingBookings.length} waiting · ${availableSlotsToday} slots free`}
              icon={<Clock className="w-4 h-4 text-blue-700" />}
            />
            <DashboardStatCard
              label="Pending Payments / Buyers"
              value={`₹${pendingPaymentsSum.toLocaleString('en-IN')}`}
              detail={`${activeBuyers.length} active buyers · ${blockedBuyers.length} blocked`}
              icon={<DollarSign className="w-4 h-4 text-purple-700" />}
            />

          </div>

          {/* Centre Capacity Bar & Crop Arrivals Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Centre Capacity Progress */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#1B5E3C]" />
                  <span>Centre Gate Capacity</span>
                </h3>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {capacityUtilizedPercent}% Utilized
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                <div 
                  className="bg-[#1B5E3C] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, capacityUtilizedPercent)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#E8DFC9]">
                  <span className="text-gray-500 block">Available Slots</span>
                  <span className="text-lg font-black text-[#1B5E3C]">{availableSlotsToday} / {totalCapacityToday}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-500 block">Throughput Rate</span>
                  <span className="text-lg font-black text-gray-900">~{queueState.averageMinutesPerToken || 3} mins/trolley</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                Gate 2 automated boom barrier and weighbridge active. Capacity ceiling ensures zero Grand Trunk Road tractor congestion.
              </p>
            </div>

            {/* Crop-wise Arrivals Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-[#1B5E3C]" />
                  <span>Today's Crop-Wise Arrivals &amp; Allocation</span>
                </h3>
                <span className="text-xs text-gray-500">APMC Karnal Yard Records</span>
              </div>

              <div className="space-y-3">
                {/* Wheat */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-900">Wheat (PBW 550 / Sharbati)</span>
                    <span className="text-[#1B5E3C]">920 Quintals (62%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '62%' }} />
                  </div>
                </div>

                {/* Paddy Basmati */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-900">Paddy (Basmati 1121)</span>
                    <span className="text-[#1B5E3C]">340 Quintals (23%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '23%' }} />
                  </div>
                </div>

                {/* Mustard */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-900">Mustard (RH 725 Oilseed)</span>
                    <span className="text-[#1B5E3C]">180 Quintals (12%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>

                {/* Tomato */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-900">Tomato (Avinash-2 - Perishable Priority)</span>
                    <span className="text-[#1B5E3C]">40 Quintals (3%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: '3%' }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleTabSelect('priority')}
                  className="text-xs font-bold text-[#1B5E3C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Perishability &amp; Priority Scoreboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleTabSelect('procurement')}
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Record Weighed Produce</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. LIVE QUEUE MANAGEMENT */}
      {/* ===================================================================== */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          
          {/* Currently Processing Card */}
          <div className="bg-[#FAF6EE] rounded-2xl p-6 border-2 border-[#1B5E3C]/30 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFC9] pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                  Currently Processing at Weighbridge (Counter 2)
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-1">
                  TOKEN #{currentToken} · {currentlyProcessingBooking.farmerName}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerifyFarmer(currentlyProcessingBooking as Booking)}
                  className="px-4 py-2 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>Record Weighed Quantity</span>
                </button>

                <button
                  onClick={onAdvanceQueue}
                  disabled={isSimulating}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Call Next Token</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#E8DFC9]">
                <span className="text-gray-500 block">Commodity</span>
                <span className="text-sm font-bold text-gray-900">{currentlyProcessingBooking.cropType}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8DFC9]">
                <span className="text-gray-500 block">Vehicle Registration</span>
                <span className="text-sm font-mono font-bold text-gray-900">{currentlyProcessingBooking.vehicleNo}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8DFC9]">
                <span className="text-gray-500 block">Scheduled Time Slot</span>
                <span className="text-sm font-bold text-[#1B5E3C]">{currentlyProcessingBooking.timeRange}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8DFC9]">
                <span className="text-gray-500 block">Est. Quantity / MSP</span>
                <span className="text-sm font-bold text-gray-900">{currentlyProcessingBooking.estimatedQuantityQuintals} Qtl · ₹{currentlyProcessingBooking.mspRatePerQuintal}</span>
              </div>
            </div>
          </div>

          {/* Next 2-3 Farmers in Line */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Next Farmers in Line (Queue Sequence)</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Ready at Gate 2 holding area. Sorted by arrival token &amp; perishability priority.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Available Capacity: {availableSlotsToday} / {totalCapacityToday} Slots
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nextFarmersInLine.map((nextF, idx) => (
                <div key={nextF.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-950">
                      #{idx + 1} Next in Queue
                    </span>
                    <span className="text-sm font-black text-gray-900 font-mono">
                      TOKEN #{nextF.tokenNumber}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-gray-900">
                    {nextF.farmerName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {nextF.cropType} · {nextF.vehicleNo}
                  </div>
                  <div className="text-xs text-emerald-800 font-semibold">
                    Slot: {nextF.timeRange}
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => handleVerifyFarmer(nextF as Booking)}
                      className="text-xs font-bold text-[#1B5E3C] hover:underline cursor-pointer"
                    >
                      Pre-Check QR Slip
                    </button>
                    <span className="text-[11px] text-gray-500">
                      ETA: ~{(idx + 1) * 3} mins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Queue Safeguard */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Need to reset token sequence for day closure or shift change?
            </span>
            <button
              onClick={() => {
                if (confirm('Reset queue token counter to #19?')) onResetQueue();
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold cursor-pointer"
            >
              Reset Queue Counter
            </button>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. CROP PRIORITY VIEW (RULE-BASED ALGORITHM) */}
      {/* ===================================================================== */}
      {activeTab === 'priority' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>Transparent APMC Rule-Based Scoring Engine (No AI/ML)</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Crop Perishability &amp; Dynamic Priority Queue
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Shows why certain farmers are prioritized at the gate to prevent post-harvest spoilage and satisfy urgent mill demand.
            </p>
          </div>

          {/* Transparent Scoring Formula Box */}
          <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#E8DFC9] space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>The Transparent Priority Scoring Formula</span>
            </h3>
            <div className="font-mono text-xs sm:text-sm bg-white p-3 rounded-xl border border-[#E8DFC9] text-gray-800">
              Priority Score = (Perishability Score × 0.40) + (Market Demand Index × 0.35) + (Wait Time Factor × 0.25)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-white p-3 rounded-xl border border-red-200">
                <span className="font-bold text-red-700 block">🔴 High Priority (Tomato / Fruits)</span>
                <p className="text-[11px] text-gray-600 mt-1">
                  Perishability 10/10. Spoilage risk window &lt;24 hours. Given express lane to cold storage/buyer loading.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-yellow-200">
                <span className="font-bold text-amber-700 block">🟡 Medium Priority (Mustard / Oilseeds)</span>
                <p className="text-[11px] text-gray-600 mt-1">
                  Perishability 4/10. Elevated crushing mill demand index (8/10). Expedited to meet daily freight quotas.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-800 block">🟢 Standard Priority (Wheat / Paddy)</span>
                <p className="text-[11px] text-gray-600 mt-1">
                  Dry cereal grain with storability &gt;12 months. Processed via standard FIFO slot sequence.
                </p>
              </div>
            </div>
          </div>

          {/* Ranked Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3">Token #</th>
                  <th className="py-3 px-3">Farmer &amp; Vehicle</th>
                  <th className="py-3 px-3">Crop Commodity</th>
                  <th className="py-3 px-3">Perishability (40%)</th>
                  <th className="py-3 px-3">Demand (35%)</th>
                  <th className="py-3 px-3">Calculated Score</th>
                  <th className="py-3 px-3">Priority Tier &amp; Transparent Reason</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cropPriorityItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                      #{item.tokenNumber}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-gray-900 block">{item.farmerName}</span>
                      <span className="text-[11px] text-gray-400 font-mono">{item.vehicleNo}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-[#1B5E3C] block">{item.cropName}</span>
                      <span className="text-xs text-gray-500">{item.quantityQuintals} Quintals</span>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-gray-800">
                      {item.perishabilityScore} / 10
                    </td>

                    <td className="py-3.5 px-3 font-bold text-gray-800">
                      {item.demandScore} / 10
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-sm font-black text-gray-900 font-mono">
                        {item.calculatedScore}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.tier === 'High' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : item.tier === 'Medium' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.tier === 'High' ? '🔴 High Priority' : item.tier === 'Medium' ? '🟡 Medium Priority' : '🟢 Standard Priority'}
                        </span>
                        <p className="text-[11px] text-gray-500">{item.primaryFactor}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          const matchedBooking = centreBookings.find(b => b.tokenNumber === item.tokenNumber) || {
                            id: item.id,
                            tokenNumber: item.tokenNumber,
                            farmerName: item.farmerName,
                            farmerPhone: '+919876543210',
                            cropType: item.cropName,
                            estimatedQuantityQuintals: item.quantityQuintals,
                            mspRatePerQuintal: 2460,
                            vehicleNo: item.vehicleNo,
                            timeRange: item.slotTime,
                            date: '2023-10-27',
                            status: 'at_centre' as const,
                            centreId: centre.id,
                            centreName: centre.name,
                            slotId: 'slot-1',
                            tokenDate: '2023-10-27',
                            paymentStatus: 'pending' as const,
                            createdDate: '2023-10-24'
                          };
                          handleVerifyFarmer(matchedBooking as Booking);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold cursor-pointer"
                      >
                        Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. PROCUREMENT RECORDING */}
      {/* ===================================================================== */}
      {activeTab === 'procurement' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#1B5E3C]" />
              <span>Weighbridge &amp; Quality Recording Console</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Verify Gate QR/Booking ID, record electronic weighment (Gross - Tare), test moisture, and disburse payment request to buyer.
            </p>
          </div>

          {/* Quick Lookup Bar */}
          <form onSubmit={handleSearchQRorID} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter Token #, Vehicle No (e.g. HR-05-AA-7821), or Booking ID..."
                value={qrSearchInput}
                onChange={(e) => setQrSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3C]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Verify / Lookup</span>
            </button>
          </form>

          {/* Selection Selector */}
          {!selectedBookingForRecord ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-[#1B5E3C] rounded-full flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Select a Farmer Arrival to Record</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Click on the currently processing farmer below or lookup any token from the queue to open the electronic scale slip.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyFarmer(currentlyProcessingBooking as Booking)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black cursor-pointer shadow-sm"
                >
                  Select Active Token #{currentToken} ({currentlyProcessingBooking.farmerName})
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitProcurement} className="space-y-6">
              
              {/* Selected Farmer Info Box */}
              <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Verified Farmer Arrival</span>
                  <div className="text-lg font-black text-gray-900">
                    Token #{selectedBookingForRecord.tokenNumber} · {selectedBookingForRecord.farmerName}
                  </div>
                  <div className="text-xs text-gray-600">
                    Vehicle: <span className="font-mono font-bold">{selectedBookingForRecord.vehicleNo}</span> · Crop: <span className="font-bold">{selectedBookingForRecord.cropType}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBookingForRecord(null)}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 underline cursor-pointer"
                >
                  Change Selection
                </button>
              </div>

              {/* Weighment & Quality Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Gross Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">
                    Gross Weight (Loaded Trolley in kg)
                  </label>
                  <input
                    type="number"
                    value={grossWeightKg}
                    onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:ring-2 focus:ring-[#1B5E3C]"
                    required
                  />
                  <span className="text-[11px] text-gray-500">Electronic scale sensor live reading</span>
                </div>

                {/* Tare Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">
                    Tare Weight (Empty Trolley in kg)
                  </label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:ring-2 focus:ring-[#1B5E3C]"
                    required
                  />
                  <span className="text-[11px] text-gray-500">Standard tractor unladen weight</span>
                </div>

                {/* Quality Grade */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">
                    Quality Inspection Grade
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:ring-2 focus:ring-[#1B5E3C]"
                  >
                    <option value="Grade A">Grade A (Premium - Zero foreign matter)</option>
                    <option value="Grade B">Grade B (Good standard quality)</option>
                    <option value="Standard">Standard FAQ (Fair Average Quality)</option>
                    <option value="FAQ (Fair Average Quality)">FAQ with Minor Deduction</option>
                  </select>
                </div>

                {/* Moisture Percentage */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">
                    Moisture Meter Reading (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisturePercentage}
                    onChange={(e) => setMoisturePercentage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:ring-2 focus:ring-[#1B5E3C]"
                    required
                  />
                  <span className="text-[11px] text-emerald-700">Permissible standard: &le; 12.0%</span>
                </div>

                {/* Agreed Rate */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">
                    Agreed Rate per Quintal (₹)
                  </label>
                  <input
                    type="number"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:ring-2 focus:ring-[#1B5E3C]"
                    required
                  />
                  <span className="text-[11px] text-gray-500">MSP or matched accepted bid rate</span>
                </div>

                {/* Assigned Buyer */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">
                    Assign Procuring Buyer (Mandatory 2-Hour SLA)
                  </label>
                  <select
                    value={selectedBuyerId}
                    onChange={(e) => setSelectedBuyerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:ring-2 focus:ring-[#1B5E3C]"
                  >
                    {buyers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.business_name} (Reliability: {b.reliability_score}%)
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Automatic Calculation Preview Box */}
              {(() => {
                const netKg = Math.max(0, grossWeightKg - tareWeightKg);
                const netQuintals = Math.round((netKg / 100) * 10) / 10;
                const finalAmt = Math.round(netQuintals * agreedPrice);

                return (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase block">
                        Calculated Final Weighed Values
                      </span>
                      <div className="text-2xl font-black text-[#1B5E3C] mt-0.5">
                        {netQuintals} Quintals ({netKg.toLocaleString('en-IN')} kg)
                      </div>
                      <span className="text-xs text-gray-600">
                        {netQuintals} Qtl × ₹{agreedPrice}/Qtl
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-500 uppercase block">
                        Final Net Payable to Farmer
                      </span>
                      <div className="text-3xl font-black text-[#1B5E3C]">
                        ₹{finalAmt.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] text-emerald-800 font-medium">
                        Payment deadline: Exactly 2 hours from issue
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForRecord(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-900 text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>{loading ? 'Issuing Record...' : 'Save & Issue Payment Request to Buyer'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. PAYMENT MONITORING & VIOLATIONS */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          
          {/* Header overview */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#1B5E3C]" />
                  <span>APMC Payment Monitoring &amp; Buyer Violation Ledger</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tracks buyer payments under mandatory 2-hour APMC SLA. Automatically enforces strikes: 1st Warning &rarr; 2nd Restricted &rarr; 3rd Blocked.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                {paymentRequests.length} Total APMC Records
              </span>
            </div>

          </div>

          {/* Pending & Overdue Payments List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">
                  Active Payment Requests (Farmer Payout SLA)
                </h3>
                <p className="text-xs text-gray-500">
                  Click 'Simulate Expired Deadline' to test automatic violation logging against late buyers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF6EE] text-gray-700 font-bold border-b border-[#E8DFC9]">
                  <tr>
                    <th className="py-3 px-3.5">Payment ID / Token</th>
                    <th className="py-3 px-3.5">Farmer &amp; Commodity</th>
                    <th className="py-3 px-3.5">Assigned Buyer</th>
                    <th className="py-3 px-3.5">Final Amount</th>
                    <th className="py-3 px-3.5">SLA Deadline</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentRequests.map((req) => {
                    const isPaid = req.status === 'paid';
                    const isOverdue = req.status === 'overdue';
                    const isPending = req.status === 'pending';

                    return (
                      <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <span className="font-mono font-bold text-gray-900 block">{req.id}</span>
                          <span className="text-[11px] text-gray-400 font-mono">Token #{req.token_number}</span>
                        </td>

                        <td className="py-3.5 px-3.5">
                          <span className="font-bold text-gray-900 block">{req.farmer_name}</span>
                          <span className="text-xs text-gray-500">{req.crop_name} ({req.quantity_quintals} Qtl)</span>
                        </td>

                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="font-semibold text-gray-800">{req.buyer_name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 font-black text-[#1B5E3C]">
                          ₹{req.final_amount.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3.5">
                          <span className="font-mono text-xs text-gray-700 block">
                            {new Date(req.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(req.deadline).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-3.5">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Paid &amp; Settled</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Pending (Active SLA)</span>
                            </span>
                          )}
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-700" />
                              <span>Overdue</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 text-right">
                          {isPending && (
                            <button
                              onClick={() => handleSimulateOverdueViolation(req.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer"
                              title="Simulate 2-Hour SLA Expiration"
                            >
                              Simulate Overdue SLA
                            </button>
                          )}
                          {isPaid && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              {req.payment_ref}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buyer Violations & Strikes Ledger */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Buyer Violations &amp; Penalty Ledger (`buyer_violations`)</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Automated penalty deduction tracking with progressive enforcement (1st Warning &rarr; 2nd Restricted &rarr; 3rd Strike Blocked).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5">Violation ID</th>
                    <th className="py-3 px-3.5">Buyer Business Name</th>
                    <th className="py-3 px-3.5">Violation Reason</th>
                    <th className="py-3 px-3.5">Penalty Points</th>
                    <th className="py-3 px-3.5">Strike Level</th>
                    <th className="py-3 px-3.5">Audit Notes</th>
                    <th className="py-3 px-3.5">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {violations.map((viol) => (
                    <tr key={viol.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3.5 font-mono font-bold text-gray-900">
                        {viol.id}
                      </td>
                      <td className="py-3.5 px-3.5 font-semibold text-gray-900">
                        {viol.buyer_name}
                      </td>
                      <td className="py-3.5 px-3.5 font-medium text-gray-800">
                        {viol.violation_type}
                      </td>
                      <td className="py-3.5 px-3.5 font-bold text-red-600">
                        -{viol.penalty_points} Pts
                      </td>
                      <td className="py-3.5 px-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          viol.level.includes('Blocked') 
                            ? 'bg-red-600 text-white' 
                            : viol.level.includes('2nd') 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                        }`}>
                          {viol.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-xs text-gray-600 max-w-xs truncate">
                        {viol.notes}
                      </td>
                      <td className="py-3.5 px-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(viol.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blocked Accounts Management */}
          {blockedBuyers.length > 0 && (
            <div className="bg-red-50/80 rounded-2xl p-5 border border-red-200 space-y-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-950">
                  Currently Blocked Buyer Accounts (Trading Privileges Suspended)
                </h3>
              </div>
              <p className="text-xs text-red-800">
                These buyers have reached 3 strikes or a reliability score &le; 50%. They cannot place new bids until unblocked by APMC Admin after escrow clearance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {blockedBuyers.map((b) => (
                  <div key={b.id} className="bg-white p-4 rounded-xl border border-red-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 block">{b.business_name}</span>
                      <span className="text-xs text-red-600 font-semibold">Reliability Score: {b.reliability_score}% · Blocked</span>
                    </div>

                    <button
                      onClick={() => handleUnblockBuyer(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Re-instate Account
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
