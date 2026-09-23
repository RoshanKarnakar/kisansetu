import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Wheat, 
  Gavel, 
  FileCheck2, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  DollarSign, 
  Scale, 
  MessageSquare, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Sparkles, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Truck,
  Droplets,
  Layers,
  FileText
} from 'lucide-react';
import { 
  Buyer, 
  CropListing, 
  Bid, 
  CropMarketData, 
  BuyerTransaction, 
  Language, 
  Crop,
  PaymentRequest,
  BuyerViolation
} from '../../types';
import { 
  getBuyers, 
  getBuyerBids, 
  getAvailableProduceLots, 
  getCropMarketData, 
  getBuyerTransactions,
  getCrops,
  getPaymentRequests,
  payPaymentRequest,
  getBuyerViolations,
  triggerOverduePaymentViolation,
  INITIAL_BUYERS,
  getCurrentBuyer,
} from '../../lib/supabaseService';
import { PlaceBidModal } from './PlaceBidModal';
import { BuyerRegistrationModal } from './BuyerRegistrationModal';
import { ChatModal } from '../ChatModal';
import { CallBuyerModal } from '../CallBuyerModal';
import { DashboardHero } from '../DashboardHero';
import { DashboardStatCard } from '../DashboardStatCard';

export type BuyerNavTab = 
  | 'home' 
  | 'market-overview' 
  | 'available-crops' 
  | 'my-bids' 
  | 'transactions' 
  | 'reliability' 
  | 'profile';

interface BuyerDashboardProps {
  currentTab: BuyerNavTab;
  onTabChange: (tab: BuyerNavTab) => void;
  language: Language;
  onSwitchToFarmer: () => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  currentTab,
  onTabChange,
  language,
  onSwitchToFarmer,
}) => {
  const isHindi = language === 'hi';

  // Buyer state (active logged in buyer)
  const [buyer, setBuyer] = useState<Buyer>(INITIAL_BUYERS[0]);
  const [availableLots, setAvailableLots] = useState<CropListing[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [marketData, setMarketData] = useState<CropMarketData[]>([]);
  const [transactions, setTransactions] = useState<BuyerTransaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [buyerViolations, setBuyerViolations] = useState<BuyerViolation[]>([]);
  const [payingRequestId, setPayingRequestId] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bidStatusFilter, setBidStatusFilter] = useState<string>('all');

  // Modals
  const [selectedLotForBid, setSelectedLotForBid] = useState<CropListing | null>(null);
  const [isPlaceBidOpen, setIsPlaceBidOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [chatBookingId, setChatBookingId] = useState<string | undefined>(undefined);
  const [chatFarmer, setChatFarmer] = useState<{ id: string; name: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [callModalInfo, setCallModalInfo] = useState<{ name: string; phone: string; village: string } | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [fetchedBuyers, fetchedLots, fetchedMarket, fetchedCrops] = await Promise.all([
        getBuyers(),
        getAvailableProduceLots(),
        getCropMarketData(),
        getCrops(),
      ]);

      const activeBuyer = await getCurrentBuyer();
      if (!activeBuyer) {
        throw new Error('Authenticated buyer profile was not found');
      }
      setBuyer(activeBuyer);
      setAvailableLots(fetchedLots);
      setMarketData(fetchedMarket);
      setCrops(fetchedCrops);

      const [bids, txns, reqs, viols] = await Promise.all([
        getBuyerBids(activeBuyer.id),
        getBuyerTransactions(activeBuyer.id),
        getPaymentRequests({ buyer_id: activeBuyer.id }),
        getBuyerViolations(activeBuyer.id),
      ]);
      setMyBids(bids);
      setTransactions(txns);
      setPaymentRequests(reqs);
      setBuyerViolations(viols);
    } catch (e) {
      console.warn('Failed to load buyer dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (requestId: string) => {
    setPayingRequestId(requestId);
    try {
      const { paymentRequest } = await payPaymentRequest(requestId);
      setPaymentSuccessMsg(
        `✅ Payment of ₹${paymentRequest.final_amount.toLocaleString('en-IN')} successfully settled via APMC Escrow! Direct Benefit Transfer (DBT) released to farmer ${paymentRequest.farmer_name}. (Ref: ${paymentRequest.payment_ref})`
      );
      await loadAllData();
      setTimeout(() => setPaymentSuccessMsg(null), 7000);
    } catch (err) {
      console.error(err);
      alert('Failed to process payment');
    } finally {
      setPayingRequestId(null);
    }
  };

  const handleSimulateOverdueSla = async (requestId: string) => {
    setPayingRequestId(requestId);
    try {
      const { violation } = await triggerOverduePaymentViolation(requestId);
      alert(`⚠️ SLA Overdue Triggered: Logged ${violation.level} (-${violation.penalty_points} reliability points).`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setPayingRequestId(null);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenPlaceBid = (lot: CropListing) => {
    setSelectedLotForBid(lot);
    setIsPlaceBidOpen(true);
  };

  const handleBidPlaced = (newBid: Bid) => {
    setMyBids((prev) => [newBid, ...prev]);
    onTabChange('my-bids');
  };

  const handleOpenChatWithFarmer = (bid: Bid) => {
    setChatBookingId(bid.id);
    setChatFarmer({
      id: bid.farmer_id || 'farmer-01',
      name: bid.farmer_name || 'Farmer Partner',
    });
    setIsChatOpen(true);
  };

  const handleCallFarmer = (bid: Bid) => {
    setCallModalInfo({
      name: bid.farmer_name || 'Farmer Partner',
      phone: bid.farmer_phone || '+919876543210',
      village: bid.farmer_village || 'Taraori',
    });
  };

  // Filtered available lots
  const filteredLots = availableLots.filter((lot) => {
    const matchesCrop = cropFilter === 'all' || lot.crop_id === cropFilter;
    const matchesSearch =
      !searchQuery ||
      (lot.variety && lot.variety.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lot.farmer_name && lot.farmer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lot.farmer_village && lot.farmer_village.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCrop && matchesSearch;
  });

  // Filtered bids
  const filteredBids = myBids.filter((bid) => {
    if (bidStatusFilter === 'all') return true;
    return bid.status === bidStatusFilter;
  });

  const activeBidsCount = myBids.filter((b) => b.status === 'pending').length;
  const acceptedBidsCount = myBids.filter((b) => b.status === 'accepted').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <DashboardHero
        badge={(
          <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-800/90 text-amber-300 border border-emerald-500/40">
                <Building2 className="w-3.5 h-3.5" />
                {isHindi ? 'APMC थोक खरीदार पोर्टल' : 'APMC Licensed Buyer Portal'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-200 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                {buyer.trade_license_no}
              </span>
          </div>
        )}
        title={currentTab === 'home' ? buyer.company_name : {
          'market-overview': isHindi ? 'मंडी बाज़ार अवलोकन व मांग' : 'APMC Market Overview & Demand',
          'available-crops': isHindi ? 'उपलब्ध किसान फसल लॉट' : 'Browse Available Produce Lots',
          'my-bids': isHindi ? 'मेरी बोलियां' : 'My Active & Historical Bids',
          transactions: isHindi ? 'खरीद लेन-देन व मंडी शुल्क' : 'Procurement Settlements & Mandi Fees',
          reliability: isHindi ? 'खरीदार विश्वसनीयता स्कोरकार्ड' : 'Buyer Reliability & Trust Scorecard',
          profile: isHindi ? 'APMC खरीदार प्रोफाइल' : 'APMC Buyer Profile & Credentials',
        }[currentTab]}
        subtitle={isHindi
          ? (currentTab === 'home' ? `${buyer.buyer_type} • ${buyer.district}, ${buyer.state} • सीधे किसान से खरीद, पारदर्शी बोलियां व मंडी धर्मकांटा तौल` : buyer.company_name)
          : (currentTab === 'home' ? `${buyer.buyer_type} • ${buyer.district}, ${buyer.state} • Direct farmer procurement, competitive transparent bidding & APMC escrow` : `${buyer.company_name} · APMC buyer workspace`)}
        actions={(
          <button
              id="switch-to-farmer-btn"
              type="button"
              onClick={onSwitchToFarmer}
              className="px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700/80 text-emerald-100 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wheat className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? 'किसान मोड में जाएं' : 'Switch to Farmer Mode'}</span>
          </button>
        )}
      />

      {currentTab === 'home' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardStatCard label={isHindi ? 'विश्वसनीयता स्कोर' : 'Reliability Score'} value={`${buyer.reliability_score}%`} detail="Grade A+ verified" icon={<ShieldCheck className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label={isHindi ? 'सक्रिय बोलियां' : 'Active Bids'} value={activeBidsCount} detail="Awaiting farmer acceptance" icon={<Gavel className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label={isHindi ? 'उपलब्ध किसान लॉट' : 'Available Lots'} value={availableLots.length} detail="Ready for direct bidding" icon={<Wheat className="w-4 h-4 text-amber-600" />} />
          <DashboardStatCard label={isHindi ? 'स्वीकृत सौदे' : 'Accepted Deals'} value={acceptedBidsCount} detail="Scheduled at APMC gates" icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />} />
        </div>
      )}

      {currentTab !== 'home' && currentTab !== 'reliability' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardStatCard label="Available Lots" value={availableLots.length} detail="Verified farmer produce" icon={<Wheat className="w-4 h-4 text-amber-600" />} />
          <DashboardStatCard label="Active Bids" value={activeBidsCount} detail="Awaiting acceptance" icon={<Gavel className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Settled Deals" value={acceptedBidsCount} detail="Scheduled procurement" icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label="Reliability Score" value={`${buyer.reliability_score}%`} detail="Current buyer standing" icon={<ShieldCheck className="w-4 h-4 text-emerald-700" />} />
        </div>
      )}
      {currentTab === 'reliability' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardStatCard label={isHindi ? 'वर्तमान विश्वसनीयता स्कोर' : 'Current Reliability Score'} value={`${buyer.reliability_score}%`} detail="Grade A+ Verified" icon={<ShieldCheck className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label={isHindi ? 'कुल संपन्न सौदे' : 'Total APMC Deals'} value={`${buyer.total_deals} Trades`} detail="100% on-time electronic settlement" icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />} />
          <DashboardStatCard label={isHindi ? 'उल्लंघन दंड (Triggers)' : 'Penalty Points'} value={`${buyerViolations.reduce((sum, v) => sum + v.penalty_points, 0)} Points`} detail="Automated APMC compliance tracking" icon={<AlertCircle className="w-4 h-4 text-red-600" />} />
        </div>
      )}

      {/* Payment Success Alert */}
      {paymentSuccessMsg && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-xl border border-emerald-500 shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{paymentSuccessMsg}</span>
          </div>
          <button onClick={() => setPaymentSuccessMsg(null)} className="text-emerald-300 text-xs font-bold ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Urgent Payment Required Banners */}
      {paymentRequests.filter(p => p.status === 'pending').map((pendingReq) => {
        const deadlineDate = new Date(pendingReq.deadline);
        const minsLeft = Math.max(0, Math.round((deadlineDate.getTime() - Date.now()) / (60 * 1000)));

        return (
          <div 
            key={pendingReq.id}
            className="bg-amber-400 text-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-amber-500 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
                    APMC 2-Hour SLA Mandate
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    Token #{pendingReq.token_number} · Ref: {pendingReq.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1">
                  Payment Required: ₹{pendingReq.final_amount.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs font-medium text-slate-900 mt-0.5">
                  Farmer: <strong>{pendingReq.farmer_name}</strong> · Crop: <strong>{pendingReq.crop_name} ({pendingReq.quantity_quintals} Qtl)</strong> · Deadline: <strong>{deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({minsLeft > 0 ? `${minsLeft} mins left` : 'Due now'})</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handlePayNow(pendingReq.id)}
                disabled={payingRequestId === pendingReq.id}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-transform cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>{payingRequestId === pendingReq.id ? 'Settling...' : 'Pay Now (Placeholder Gateway)'}</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* TAB 1: HOME VIEW (4 Main Cards / Sections) */}
      {/* ========================================================================= */}
      {currentTab === 'home' && (
        <div className="space-y-6">
          
          {/* 4 Primary Sections as Cards/Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Card 1: Market Overview */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E3C] flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {isHindi ? 'लाइव मंडी दरें' : 'Live Trends'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg">
                  {isHindi ? 'बाज़ार मांग व मूल्य पूर्वानुमान' : 'Market Overview'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'करनाल, पानीपत व अंबाला मंडियों में लाइव आगमन, मॉडल कीमतें व अगले सप्ताह का मूल्य पूर्वानुमान।'
                    : 'Live crop arrivals, modal prices vs MSP, demand indices, and next-week price forecasts across Haryana APMCs.'}
                </p>

                {/* Mini Preview Table */}
                <div className="mt-3.5 space-y-2 text-xs">
                  {marketData.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800">{item.crop?.name_en || item.crop_id}</span>
                      <div className="text-right">
                        <span className="font-bold text-[#1B5E3C]">₹{item.modal_price_per_quintal}/Qtl</span>
                        <span className="text-[10px] text-gray-500 block">Forecast: ₹{item.price_forecast_next_week || item.modal_price_per_quintal}/Qtl</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onTabChange('market-overview')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-900 hover:text-[#1B5E3C] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isHindi ? 'पूर्ण बाज़ार विश्लेषण देखें' : 'View Full Market Overview'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Available Produce */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    <Wheat className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {availableLots.length} {isHindi ? 'लॉट उपलब्ध' : 'Lots Available'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg">
                  {isHindi ? 'उपलब्ध किसान फसल लॉट' : 'Available Produce'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'पंजीकृत किसानों द्वारा पोस्ट की गई नई गेहूं, बासमती धान व सरसों की फसलें। सीधे बोली लगाएं।'
                    : 'Verified farmer lots ready for bidding with moisture reports, estimated harvest dates, and locations.'}
                </p>

                {/* Mini Preview of Lots */}
                <div className="mt-3.5 space-y-2 text-xs">
                  {availableLots.slice(0, 3).map((lot) => (
                    <div key={lot.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <span className="font-semibold text-gray-800 block">{lot.crop?.name_en || lot.crop_id}</span>
                        <span className="text-[10px] text-gray-500">{lot.farmer_name || 'Farmer'} • {lot.farmer_village}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#1B5E3C]">{lot.quantity_quintals} Qtl</span>
                        <span className="text-[10px] text-gray-500 block">Moisture: {lot.moisture_percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onTabChange('available-crops')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>{isHindi ? 'फसलें ब्राउज़ करें व बोली लगाएं' : 'Browse Produce & Place Bids'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 3: My Bids */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E3C] flex items-center justify-center font-bold">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {myBids.length} {isHindi ? 'कुल बोलियां' : 'Total Bids'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg">
                  {isHindi ? 'मेरी बोलियां व वार्ता' : 'My Bids & Negotiations'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'आपकी सभी सक्रिय, स्वीकृत व समाप्त बोलियों की स्थिति। स्वीकृत बोलियों पर किसान से सीधे चैट व कॉल करें।'
                    : 'Manage active, accepted, and expired procurement bids with one-touch farmer chat and delivery tracking.'}
                </p>

                {/* Mini Bids Preview */}
                <div className="mt-3.5 space-y-2 text-xs">
                  {myBids.slice(0, 3).map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <span className="font-semibold text-gray-800 block">{bid.crop_name}</span>
                        <span className="text-[10px] text-gray-500">{bid.quantity_quintals} Qtl • ₹{bid.price_per_kg}/kg</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bid.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bid.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onTabChange('my-bids')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-900 hover:text-[#1B5E3C] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isHindi ? 'मेरी बोलियां प्रबंधित करें' : 'Manage My Bids'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 4: Transactions */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E3C] flex items-center justify-center font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {transactions.length} {isHindi ? 'निपटान' : 'Settlements'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg">
                  {isHindi ? 'खरीद लेन-देन व मंडी शुल्क' : 'Procurement Transactions'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {isHindi
                    ? 'धर्मकांटा तौल पर्चियां, 1.5% APMC मंडी शुल्क, 1% RDF सेस व किसान DBT भुगतान रिकॉर्ड।'
                    : 'Weighbridge slips, 1.5% APMC market fees, 1.0% RDF cess, and direct farmer DBT release vouchers.'}
                </p>

                {/* Mini Preview of Transactions */}
                <div className="mt-3.5 space-y-2 text-xs">
                  {transactions.slice(0, 2).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <span className="font-semibold text-gray-800 block">{txn.farmer_name} • {txn.crop_name}</span>
                        <span className="text-[10px] text-gray-500">Slip: {txn.weighbridge_slip_no}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#1B5E3C]">₹{txn.gross_amount.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-emerald-700 block font-medium">DBT Released</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onTabChange('transactions')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-900 hover:text-[#1B5E3C] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isHindi ? 'सभी लेन-देन विवरण देखें' : 'View All Transactions'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MARKET OVERVIEW */}
      {/* ========================================================================= */}
      {currentTab === 'market-overview' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1B5E3C]" />
                {isHindi ? 'मंडी बाज़ार अवलोकन व मांग' : 'APMC Market Overview & Demand'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHindi ? 'हरियाणा की प्रमुख मंडियों में दैनिक आवक, मॉडल मूल्य व मांग सूचकांक' : 'Daily arrivals, modal prices vs MSP, and rule-based forecasts across APMC yards'}
              </p>
            </div>
            <button
              type="button"
              onClick={loadAllData}
              className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isHindi ? 'रिफ्रेश करें' : 'Refresh Market'}</span>
            </button>
          </div>

          {/* Cards for each crop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketData.map((data) => {
              const msp = data.crop?.current_msp_per_quintal || 2275;
              const modalDelta = data.modal_price_per_quintal - msp;
              const isAboveMsp = modalDelta >= 0;

              return (
                <div key={data.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 hover:border-emerald-300 transition-colors shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {data.crop?.name_en || data.crop_id}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {data.district}, {data.state} • {data.date}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Demand: {data.demand_index}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#FAF6EE] p-3 rounded-lg border border-[#E8DFC9] text-xs">
                    <div>
                      <span className="text-gray-500 block">{isHindi ? 'मॉडल दर:' : 'Modal Rate:'}</span>
                      <span className="font-bold text-base text-[#1B5E3C]">₹{data.modal_price_per_quintal}</span>
                      <span className="text-[10px] text-gray-400 block">/ Quintal</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">{isHindi ? 'न्यूनतम समर्थन मूल्य:' : 'Govt MSP:'}</span>
                      <span className="font-bold text-gray-800">₹{msp}</span>
                      <span className={`text-[10px] font-semibold block ${isAboveMsp ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isAboveMsp ? `+₹${modalDelta} above MSP` : `₹${Math.abs(modalDelta)} below MSP`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">{isHindi ? 'अनुमानित आवक:' : 'Est Supply:'}</span>
                      <span className="font-bold text-gray-800">{data.total_estimated_supply_quintals} Qtl</span>
                      <span className="text-[10px] text-gray-400 block">Active arrivals</span>
                    </div>
                  </div>

                  {data.recommendation_text && (
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{data.recommendation_text}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-500">
                      Forecast Next Week: <strong className="text-gray-800">₹{data.price_forecast_next_week || data.modal_price_per_quintal}/Qtl</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCropFilter(data.crop_id);
                        onTabChange('available-crops');
                      }}
                      className="font-bold text-emerald-800 hover:text-[#1B5E3C] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isHindi ? 'लॉट देखें' : 'View Available Lots'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BROWSE AVAILABLE CROPS (Farmer Lots for Bidding) */}
      {/* ========================================================================= */}
      {currentTab === 'available-crops' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Wheat className="w-5 h-5 text-[#1B5E3C]" />
                {isHindi ? 'उपलब्ध किसान फसल लॉट (बोली लगाएं)' : 'Browse Available Produce Lots'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHindi
                  ? 'हरियाणा के सत्यापित किसानों द्वारा मंडी में बिक्री हेतु पंजीकृत लॉट। बोली लगाएं व टोकन सुरक्षित करें।'
                  : 'Verified farmer lots ready for bidding. Select a lot to place your procurement offer.'}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? 'किसान, गांव या किस्म खोजें...' : 'Search by farmer name, village, or variety...'}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#1B5E3C] outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {[
                { id: 'all', label: isHindi ? 'सभी फसलें' : 'All Crops' },
                { id: 'wheat', label: 'Wheat (गेहूं)' },
                { id: 'paddy_basmati', label: 'Paddy Basmati (धान)' },
                { id: 'mustard', label: 'Mustard (सरसों)' },
                { id: 'gram', label: 'Gram (चना)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCropFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    cropFilter === c.id
                      ? 'bg-[#1B5E3C] text-white font-bold shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lots Grid */}
          {filteredLots.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2 bg-[#FBFBF9] rounded-xl border border-dashed border-gray-200">
              <Wheat className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-600">
                {isHindi ? 'कोई फसल लॉट नहीं मिला' : 'No available lots match your filter'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCropFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                {isHindi ? 'फ़िल्टर हटाएं' : 'Clear filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLots.map((lot) => {
                const msp = lot.crop?.current_msp_per_quintal || 2275;
                const expPrice = lot.expected_price_per_quintal || msp;

                return (
                  <div
                    key={lot.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {lot.crop?.name_en || lot.crop_id}
                          </span>
                          <h3 className="font-bold text-gray-900 text-base mt-1">
                            {lot.variety || 'FAQ Quality Standard'}
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">
                          {lot.quantity_quintals} Quintals
                        </span>
                      </div>

                      {/* Farmer Details */}
                      <div className="bg-[#FAF6EE] p-3 rounded-lg border border-[#E8DFC9] text-xs space-y-1 text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isHindi ? 'किसान:' : 'Farmer:'}</span>
                          <span className="font-bold text-gray-900">{lot.farmer_name || 'Farmer Partner'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isHindi ? 'गांव व जिला:' : 'Location:'}</span>
                          <span className="font-medium text-gray-800">{lot.farmer_village || 'Taraori'}, {lot.farmer_district || 'Karnal'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isHindi ? 'नमी प्रतिशत:' : 'Moisture %:'}</span>
                          <span className="font-semibold text-emerald-800">{lot.moisture_percentage || '11.5'}% (Compliant)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isHindi ? 'कटाई तारीख:' : 'Harvest Date:'}</span>
                          <span className="font-medium text-gray-800">{lot.harvest_date}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-gray-500 block">{isHindi ? 'किसान अपेक्षित दर:' : 'Farmer Expectation:'}</span>
                          <span className="font-bold text-base text-[#1B5E3C]">₹{expPrice}/Qtl</span>
                          <span className="text-[11px] text-gray-400 font-medium"> (₹{(expPrice / 100).toFixed(2)}/kg)</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          MSP: ₹{msp}/Qtl
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        id={`place-bid-btn-${lot.id}`}
                        type="button"
                        onClick={() => handleOpenPlaceBid(lot)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Gavel className="w-4 h-4 text-amber-300" />
                        <span>{isHindi ? 'इस लॉट पर बोली लगाएं' : 'Place Procurement Bid'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MY BIDS */}
      {/* ========================================================================= */}
      {currentTab === 'my-bids' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-[#1B5E3C]" />
                {isHindi ? 'मेरी बोलियां (My Bids)' : 'My Active & Historical Bids'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHindi ? 'आपके द्वारा प्रस्तुत बोलियों की वर्तमान स्थिति व स्वीकृत सौदों का प्रबंधन' : 'Track bid status, negotiate directly with farmers, and manage unloading schedules'}
              </p>
            </div>

            {/* Bid Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: isHindi ? 'सभी' : 'All' },
                { id: 'pending', label: isHindi ? 'प्रतीक्षित' : 'Pending' },
                { id: 'accepted', label: isHindi ? 'स्वीकृत' : 'Accepted' },
                { id: 'rejected', label: isHindi ? 'अस्वीकृत / समाप्त' : 'Rejected' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setBidStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    bidStatusFilter === s.id
                      ? 'bg-[#1B5E3C] text-white font-bold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {filteredBids.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2 bg-[#FBFBF9] rounded-xl border border-dashed border-gray-200">
              <Gavel className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-600">
                {isHindi ? 'कोई बोली नहीं मिली' : 'No bids found for this status'}
              </p>
              <button
                type="button"
                onClick={() => onTabChange('available-crops')}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                {isHindi ? 'उपलब्ध फसलों पर नई बोली लगाएं' : 'Browse available lots to place a bid'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBids.map((bid) => {
                const isAccepted = bid.status === 'accepted';
                const totalAmount = Math.round(bid.quantity_quintals * bid.bid_price_per_quintal);

                return (
                  <div
                    key={bid.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isAccepted
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                        : 'bg-white border-gray-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Crop & Farmer Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base">
                            {bid.crop_name}
                          </h3>
                          <span className="text-xs text-gray-500 font-medium">
                            • {bid.variety || 'FAQ'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAccepted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : bid.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {bid.status === 'accepted' ? (isHindi ? 'स्वीकृत (Slot Confirmed)' : 'Accepted') : bid.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                          <div>
                            <span className="text-gray-400 block">{isHindi ? 'किसान:' : 'Farmer:'}</span>
                            <span className="font-bold text-gray-800">{bid.farmer_name || 'Rakesh Singh'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">{isHindi ? 'मात्रा:' : 'Quantity:'}</span>
                            <span className="font-bold text-gray-800">{bid.quantity_quintals} Qtl</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">{isHindi ? 'डिलीवरी तारीख:' : 'Expected Date:'}</span>
                            <span className="font-bold text-gray-800">{bid.expected_delivery_date || '2 Days'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">{isHindi ? 'कुल सौदा मूल्य:' : 'Total Deal:'}</span>
                            <span className="font-bold text-[#1B5E3C]">₹{totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {bid.notes && (
                          <p className="text-xs text-gray-500 italic">
                            "{bid.notes}"
                          </p>
                        )}
                      </div>

                      {/* Right: Rates & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="flex items-baseline gap-1 sm:justify-end">
                            <span className="text-xl sm:text-2xl font-black text-[#1B5E3C]">
                              ₹{bid.price_per_kg.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">/ kg</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ₹{bid.bid_price_per_quintal.toLocaleString('en-IN')} / Qtl
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCallFarmer(bid)}
                            className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isHindi ? 'कॉल' : 'Call'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenChatWithFarmer(bid)}
                            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#1B5E3C] hover:bg-[#14472D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                            <span>{isHindi ? 'चैट करें' : 'Chat with Farmer'}</span>
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRANSACTIONS & SETTLEMENTS */}
      {/* ========================================================================= */}
      {currentTab === 'transactions' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#1B5E3C]" />
                {isHindi ? 'खरीद लेन-देन व मंडी शुल्क' : 'Procurement Settlements & Mandi Fees'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHindi ? '1.5% APMC मंडी शुल्क, 1% RDF सेस व किसान DBT भुगतान रिकॉर्ड' : 'APMC Mandi Fee (1.5%), Rural Development Fund (1.0%), and direct farmer settlements'}
              </p>
            </div>
          </div>

          {/* APMC Mandatory Payment Invoices (2-Hour SLA) */}
          <div className="bg-[#FAF6EE] rounded-2xl p-5 border border-[#E8DFC9] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFC9] pb-3">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{isHindi ? 'APMC अनिवार्य भुगतान मांग (2 घंटे की समय सीमा)' : 'APMC Mandatory Payment Invoices (2-Hour SLA)'}</span>
                </h3>
                <p className="text-xs text-gray-600">
                  {isHindi ? 'तौल के बाद 2 घंटे के भीतर भुगतान न करने पर विश्वसनीयता स्कोर में कटौती व खाता ब्लॉक' : 'Invoices issued after gate weighment. Unpaid invoices trigger automatic strikes and penalties.'}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                {paymentRequests.length} Total Invoices
              </span>
            </div>

            {paymentRequests.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">
                {isHindi ? 'कोई बकाया भुगतान मांग नहीं है।' : 'No active payment requests currently pending.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Invoice Ref</th>
                      <th className="py-2.5 px-3">Farmer &amp; Crop</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Payable Amount</th>
                      <th className="py-2.5 px-3">2-Hr SLA Deadline</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paymentRequests.map((req) => {
                      const isPaid = req.status === 'paid';
                      const isOverdue = req.status === 'overdue';
                      const isPending = req.status === 'pending';
                      const dDate = new Date(req.deadline);
                      const minsLeft = Math.max(0, Math.round((dDate.getTime() - Date.now()) / (60 * 1000)));

                      return (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-gray-900 block">{req.id}</span>
                            <span className="text-[10px] text-gray-400">Token #{req.token_number}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-gray-900 block">{req.farmer_name}</span>
                            <span className="text-[11px] text-gray-500">{req.crop_name}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-800">
                            {req.quantity_quintals} Qtl
                          </td>
                          <td className="py-3 px-3 font-black text-[#1B5E3C] text-sm">
                            ₹{req.final_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-gray-800 block">
                              {dDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isPending && (
                              <span className={`text-[10px] font-semibold ${minsLeft < 30 ? 'text-red-600' : 'text-amber-700'}`}>
                                {minsLeft > 0 ? `${minsLeft} mins left` : 'Due now'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Paid (DBT Sent)</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pending</span>
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 text-red-700" />
                                <span>Overdue</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPending && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePayNow(req.id)}
                                  disabled={payingRequestId === req.id}
                                  className="px-3 py-1.5 rounded-lg bg-[#1B5E3C] hover:bg-emerald-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  {payingRequestId === req.id ? 'Processing...' : 'Pay Now'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSimulateOverdueSla(req.id)}
                                  title="Test auto-violation trigger"
                                  className="px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-500 text-[10px] font-semibold border border-gray-200 cursor-pointer"
                                >
                                  Test SLA Overdue
                                </button>
                              </div>
                            )}
                            {isPaid && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                Ref: {req.payment_ref}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF6EE] text-gray-700 font-bold border-b border-[#E8DFC9]">
                <tr>
                  <th className="py-3 px-3">{isHindi ? 'लेन-देन आईडी' : 'Txn / Slip'}</th>
                  <th className="py-3 px-3">{isHindi ? 'किसान व फसल' : 'Farmer & Crop'}</th>
                  <th className="py-3 px-3">{isHindi ? 'मात्रा (क्विंटल)' : 'Quantity'}</th>
                  <th className="py-3 px-3">{isHindi ? 'कुल सौदा राशि' : 'Gross Value'}</th>
                  <th className="py-3 px-3">{isHindi ? 'APMC शुल्क (2.5%)' : 'Mandi Fee + RDF'}</th>
                  <th className="py-3 px-3">{isHindi ? 'स्थिति' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-gray-900 block">{txn.id}</span>
                      <span className="text-[11px] text-gray-400 font-mono">Slip: {txn.weighbridge_slip_no}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-gray-900 block">{txn.farmer_name}</span>
                      <span className="text-xs text-gray-500">{txn.crop_name} ({txn.variety})</span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-gray-800">
                      {txn.quantity_quintals} Qtl
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#1B5E3C]">
                      ₹{txn.gross_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      ₹{(txn.apmc_market_fee + txn.rdf_cess).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        txn.payment_status === 'released_to_farmer'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {txn.payment_status === 'released_to_farmer' ? (isHindi ? 'डीबीटी जारी' : 'DBT Released') : 'In Escrow'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RELIABILITY SCORECARD */}
      {/* ========================================================================= */}
      {currentTab === 'reliability' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1B5E3C]" />
                {isHindi ? 'खरीदार विश्वसनीयता स्कोरकार्ड' : 'Buyer Reliability & Trust Scorecard'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHindi ? 'समय पर भुगतान, शून्य डिफ़ॉल्ट व APMC नियमों के अनुपालन का आधिकारिक रिकॉर्ड' : 'APMC reliability score, on-time payment track record, and compliance history'}
              </p>
            </div>
          </div>

          {/* Violations Log Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{isHindi ? 'आधिकारिक उल्लंघन व अनुशासनात्मक रिकॉर्ड' : 'Official Violation & Strike History (buyer_violations)'}</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                {buyerViolations.length} {isHindi ? 'दर्ज मामले' : 'Incidents'}
              </span>
            </div>

            {buyerViolations.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-800 font-semibold bg-emerald-50/50">
                ✅ Clean Record: Zero strikes or payment delays recorded against this buyer account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6EE] text-gray-700 font-bold border-b border-[#E8DFC9]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Offense / Violation</th>
                      <th className="py-2.5 px-3">Penalty</th>
                      <th className="py-2.5 px-3">Enforcement Level</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {buyerViolations.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                          {new Date(v.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {v.violation_type}
                        </td>
                        <td className="py-2.5 px-3 font-black text-red-600">
                          -{v.penalty_points} Pts
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            v.level.includes('Blocked') ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {v.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {v.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROFILE & REGISTRATION */}
      {/* ========================================================================= */}
      {currentTab === 'profile' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#1B5E3C]" />
                {isHindi ? 'APMC खरीदार प्रोफाइल' : 'APMC Buyer Profile & Credentials'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHindi ? 'कंपनी विवरण, लाइसेंस व खरीद क्षमता' : 'Business details, trade licenses, and monthly procurement capacity'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isHindi ? 'विवरण संपादित करें / नया पंजीकरण' : 'Edit Credentials / Register'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs text-gray-400 font-semibold block">{isHindi ? 'कंपनी / फर्म:' : 'Company Name:'}</span>
              <p className="font-bold text-gray-900 text-base">{buyer.company_name}</p>
              <p className="text-xs text-gray-600">{buyer.buyer_type}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs text-gray-400 font-semibold block">{isHindi ? 'APMC लाइसेंस व जीएसटी:' : 'License & Tax:'}</span>
              <p className="font-mono font-bold text-gray-900">{buyer.trade_license_no}</p>
              <p className="font-mono text-xs text-gray-600">GSTIN: {buyer.gstin}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs text-gray-400 font-semibold block">{isHindi ? 'संपर्क प्रतिनिधि:' : 'Authorized Representative:'}</span>
              <p className="font-bold text-gray-900">{buyer.contact_person}</p>
              <p className="text-xs text-gray-600">{buyer.phone} • {buyer.email}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs text-gray-400 font-semibold block">{isHindi ? 'मंडी यार्ड / मिल स्थान:' : 'Plant / Mandi Location:'}</span>
              <p className="font-bold text-gray-900">{buyer.district}, {buyer.state}</p>
              <p className="text-xs text-gray-600">{buyer.address}</p>
            </div>
          </div>

        </div>
      )}

      {/* Modals */}
      <PlaceBidModal
        isOpen={isPlaceBidOpen}
        onClose={() => setIsPlaceBidOpen(false)}
        listing={selectedLotForBid}
        buyer={buyer}
        language={language}
        onBidPlaced={handleBidPlaced}
      />

      <BuyerRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        language={language}
        onRegistered={(newBuyer) => setBuyer(newBuyer)}
      />

      {chatFarmer && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          bookingId={chatBookingId}
          farmerId={chatFarmer.id}
          farmerName={chatFarmer.name}
          buyerId={buyer.id}
          buyerName={buyer.company_name}
          buyerPhone={buyer.phone}
          currentUserRole="buyer"
          language={language}
          onCallBuyer={() => {}}
        />
      )}

      {callModalInfo && (
        <CallBuyerModal
          isOpen={!!callModalInfo}
          onClose={() => setCallModalInfo(null)}
          buyer={{
            company_name: callModalInfo.name,
            contact_person: callModalInfo.name,
            phone: callModalInfo.phone,
            district: callModalInfo.village,
          }}
          language={language}
        />
      )}

    </div>
  );
};
