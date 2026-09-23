import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  Scale, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Bid, FarmerProfile, Language, SlotConfirmationSummary } from '../types';
import { getBidsForCrop, acceptBid } from '../lib/supabaseService';

interface BuyerBidsSectionProps {
  cropId: string;
  cropName: string;
  listingId?: string;
  farmer: FarmerProfile;
  language: Language;
  onBidAccepted: (confirmation: SlotConfirmationSummary) => void;
  onOpenChat: (buyerId: string, buyerName: string, phone?: string) => void;
  onCallBuyer: (buyer: { company_name: string; contact_person: string; phone: string; trade_license_no?: string; reliability_score?: number }) => void;
}

export const BuyerBidsSection: React.FC<BuyerBidsSectionProps> = ({
  cropId,
  cropName,
  listingId,
  farmer,
  language,
  onBidAccepted,
  onOpenChat,
  onCallBuyer,
}) => {
  const isHindi = language === 'hi';
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadBids = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const fetched = await getBidsForCrop(cropId);
        if (isMounted) {
          setBids(fetched);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load buyer bids');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBids();

    return () => {
      isMounted = false;
    };
  }, [cropId]);

  const handleAccept = async (bid: Bid) => {
    setAcceptingId(bid.id);
    setErrorMsg(null);
    try {
      const { confirmation, error } = await acceptBid(
        bid.id,
        listingId || bid.listing_id,
        farmer
      );

      if (error || !confirmation) {
        setErrorMsg(error || 'Failed to accept bid');
        setAcceptingId(null);
        return;
      }

      // Mark this bid as accepted locally
      setBids((prev) =>
        prev.map((b) =>
          b.id === bid.id ? { ...b, status: 'accepted' as const } : b
        )
      );

      onBidAccepted(confirmation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error accepting bid');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFC9] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-[#1B5E3C] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">
                {isHindi ? 'मंडी थोक खरीदार बोलियां' : 'Live Buyer Bids'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {bids.length} {isHindi ? 'बोलियां उपलब्ध' : 'Bids Available'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {isHindi ? `फसल: ${cropName} के लिए सीधे APMC लाइसेंस प्राप्त खरीदारों की दरें` : `Active offers from licensed APMC buyers for ${cropName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1 text-emerald-800 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {isHindi ? 'प्रतिस्पर्धी मूल्य गारंटी' : 'Guaranteed Best Rate'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bids List */}
      {loading ? (
        <div className="py-8 text-center text-gray-400 space-y-2">
          <div className="w-6 h-6 border-2 border-[#1B5E3C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">{isHindi ? 'बोलियां लोड हो रही हैं...' : 'Loading buyer bids...'}</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="py-8 text-center text-gray-400 space-y-2 bg-[#FBFBF9] rounded-xl border border-dashed border-gray-200">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-600">
            {isHindi ? 'इस फसल के लिए फिलहाल कोई बोली नहीं है' : 'No active bids for this crop right now'}
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {isHindi 
              ? 'खरीदार जल्द ही नई बोलियां पोस्ट करेंगे। आप अपनी फसल की लिस्टिंग सक्रिय रख सकते हैं।' 
              : 'Buyers will post new bids shortly. You can create a crop listing to invite bids directly.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => {
            const buyer = bid.buyer;
            const isAccepted = bid.status === 'accepted';
            const mspRate = bid.msp_per_quintal || 2275;
            const priceDelta = bid.bid_price_per_quintal - mspRate;
            const isAboveMsp = priceDelta >= 0;

            return (
              <div
                key={bid.id}
                className={`p-4 rounded-xl border transition-all ${
                  isAccepted
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white hover:bg-gray-50/80 border-gray-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Buyer & Credentials */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                        {buyer?.company_name || 'APMC Registered Buyer'}
                      </h4>
                      <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        {buyer?.buyer_type || 'Authorized Miller'}
                      </span>
                      {buyer?.reliability_score && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {buyer.reliability_score}% {isHindi ? 'विश्वसनीय' : 'Reliable'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span>{isHindi ? 'लाइसेंस:' : 'License:'} <strong className="text-gray-700">{buyer?.trade_license_no || 'APMC-HR-8812'}</strong></span>
                      <span>•</span>
                      <span>{isHindi ? 'मांग मात्रा:' : 'Req Qty:'} <strong className="text-gray-700">{bid.quantity_quintals} Qtl</strong></span>
                      <span>•</span>
                      <span>{isHindi ? 'डिलीवरी तारीख:' : 'Delivery:'} <strong className="text-gray-700">{bid.expected_delivery_date || '2 Days'}</strong></span>
                    </div>

                    {bid.notes && (
                      <p className="text-xs text-emerald-900/80 bg-[#FAF6EE] p-2 rounded-lg border border-[#E8DFC9] leading-relaxed">
                        <strong className="text-[#1B5E3C]">{isHindi ? 'शर्तें: ' : 'Terms: '}</strong>
                        {bid.notes}
                      </p>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline gap-1.5 sm:justify-end">
                        <span className="text-xl sm:text-2xl font-black text-[#1B5E3C] tracking-tight">
                          ₹{bid.price_per_kg.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">/ kg</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{bid.bid_price_per_quintal.toLocaleString('en-IN')} / Qtl
                        {isAboveMsp && (
                          <span className="text-emerald-700 font-semibold ml-1">
                            (+₹{(priceDelta / 100).toFixed(2)}/kg {isHindi ? 'एमएसपी से अधिक' : 'above MSP'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Call Buyer Button */}
                      {buyer && (
                        <button
                          type="button"
                          onClick={() => onCallBuyer({
                            company_name: buyer.company_name,
                            contact_person: buyer.contact_person,
                            phone: buyer.phone,
                            trade_license_no: buyer.trade_license_no,
                            reliability_score: buyer.reliability_score
                          })}
                          title={isHindi ? 'खरीदार को कॉल करें' : 'Call Buyer'}
                          className="p-2 rounded-lg text-gray-700 hover:text-amber-700 bg-gray-100 hover:bg-amber-50 border border-gray-200 transition-colors cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}

                      {/* Chat Button */}
                      {buyer && (
                        <button
                          type="button"
                          onClick={() => onOpenChat(buyer.id, buyer.company_name, buyer.phone)}
                          title={isHindi ? 'चैट करें' : 'Chat with Buyer'}
                          className="p-2 rounded-lg text-gray-700 hover:text-[#1B5E3C] bg-gray-100 hover:bg-emerald-50 border border-gray-200 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      {/* Accept Bid Button */}
                      {isAccepted ? (
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {isHindi ? 'स्वीकृत' : 'Accepted'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={`accept-bid-${bid.id}`}
                          onClick={() => handleAccept(bid)}
                          disabled={acceptingId === bid.id}
                          className="px-4 py-2 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {acceptingId === bid.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{isHindi ? 'स्वीकार हो रहा...' : 'Accepting...'}</span>
                            </>
                          ) : (
                            <>
                              <span>{isHindi ? 'बोली स्वीकार करें' : 'Accept Bid'}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
