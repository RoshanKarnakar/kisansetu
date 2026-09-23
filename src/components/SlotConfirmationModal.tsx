import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  Scale, 
  DollarSign, 
  Phone, 
  MessageSquare, 
  Download, 
  Printer, 
  ShieldCheck, 
  Ticket,
  ChevronRight,
  Truck
} from 'lucide-react';
import { SlotConfirmationSummary, Language } from '../types';

interface SlotConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmation: SlotConfirmationSummary | null;
  language: Language;
  onOpenChat: () => void;
  onCallBuyer: () => void;
  onNavigateToBookings?: () => void;
}

export const SlotConfirmationModal: React.FC<SlotConfirmationModalProps> = ({
  isOpen,
  onClose,
  confirmation,
  language,
  onOpenChat,
  onCallBuyer,
  onNavigateToBookings,
}) => {
  const isHindi = language === 'hi';

  if (!isOpen || !confirmation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-4">
        
        {/* Header with Success Banner */}
        <div className="bg-[#1B5E3C] text-white p-5 sm:p-6 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-emerald-300/40 text-amber-300 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-amber-300" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/90 text-emerald-200 border border-emerald-500/40 mb-2">
            {isHindi ? 'खरीदार बोली स्वीकृत' : 'Buyer Bid Accepted & Confirmed'}
          </span>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isHindi ? 'मंडी डिलीवरी स्लॉट कन्फर्मेशन' : 'Mandi Delivery Slot Confirmation'}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {isHindi 
              ? 'आपका स्लॉट बुक हो चुका है। नीचे दिए गए समय पर गेट पर रिपोर्ट करें।' 
              : 'Your unloading slot has been confirmed with the buyer at APMC Mandi.'}
          </p>

          {/* Token Card */}
          <div className="mt-4 bg-emerald-950/60 border border-emerald-400/30 rounded-xl py-2 px-4 inline-flex items-center gap-4 text-left">
            <div>
              <span className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider block">
                {isHindi ? 'स्लॉट टोकन नंबर' : 'Slot Token Number'}
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-amber-300">
                {confirmation.slotNumber}
              </span>
            </div>
            <div className="h-8 w-px bg-emerald-700/60" />
            <div>
              <span className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider block">
                {isHindi ? 'गेट टोकन' : 'Gate Token'}
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-white">
                #{confirmation.tokenNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* 1. Buyer Information */}
          <div className="bg-[#FAF6EE] rounded-xl p-4 border border-[#E8DFC9] space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1B5E3C]" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                    {confirmation.buyer.company_name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {confirmation.buyer.buyer_type} • {isHindi ? 'लाइसेंस:' : 'Lic:'} {confirmation.buyer.trade_license_no}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                {confirmation.buyer.reliability_score}% {isHindi ? 'विश्वसनीय' : 'Reliable'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E8DFC9] text-gray-700">
              <div>
                <span className="text-gray-500 block">{isHindi ? 'संपर्क प्रतिनिधि:' : 'Representative:'}</span>
                <span className="font-semibold">{confirmation.buyer.contact_person}</span>
              </div>
              <div>
                <span className="text-gray-500 block">{isHindi ? 'जीएसटीआईएन:' : 'GSTIN:'}</span>
                <span className="font-mono font-semibold">{confirmation.buyer.gstin}</span>
              </div>
            </div>
          </div>

          {/* 2. Centre, Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-[#1B5E3C] font-semibold mb-1">
                <MapPin className="w-4 h-4" />
                <span>{isHindi ? 'खरीद केंद्र / गेट' : 'Procurement Centre & Gate'}</span>
              </div>
              <p className="font-bold text-gray-900">{confirmation.centre.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{confirmation.centre.gate}</p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-[#1B5E3C] font-semibold mb-1">
                <Clock className="w-4 h-4" />
                <span>{isHindi ? 'तारीख व समय' : 'Date & Delivery Window'}</span>
              </div>
              <p className="font-bold text-gray-900">{confirmation.date}</p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">{confirmation.timeRange}</p>
            </div>
          </div>

          {/* 3. Crop & Price Summary */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 text-xs sm:text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{isHindi ? 'फसल व किस्म:' : 'Crop & Variety:'}</span>
              <span className="font-bold text-gray-900">{confirmation.crop.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{isHindi ? 'मात्रा:' : 'Agreed Quantity:'}</span>
              <span className="font-bold text-gray-900">
                {confirmation.quantity_quintals} Quintals ({confirmation.quantity_kg.toLocaleString('en-IN')} kg)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{isHindi ? 'स्वीकृत दर (प्रति किग्रा):' : 'Agreed Rate (per kg):'}</span>
              <span className="font-bold text-[#1B5E3C]">₹{confirmation.agreed_price_per_kg.toFixed(2)} / kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{isHindi ? 'दर (प्रति क्विंटल):' : 'Rate (per quintal):'}</span>
              <span className="font-semibold text-gray-800">₹{confirmation.agreed_price_per_quintal.toLocaleString('en-IN')} / Qtl</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
              <span className="text-gray-800 font-bold">{isHindi ? 'कुल अनुमानित भुगतान:' : 'Total Estimated Payout:'}</span>
              <span className="text-base sm:text-lg font-bold text-[#1B5E3C]">
                ₹{confirmation.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 4. Action Buttons (Call Buyer, Chat, etc.) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="slot-call-buyer-btn"
              type="button"
              onClick={onCallBuyer}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-gray-900" />
              <span>{isHindi ? 'खरीदार को कॉल करें' : 'Call Buyer'}</span>
            </button>

            <button
              id="slot-chat-buyer-btn"
              type="button"
              onClick={onOpenChat}
              className="py-3 px-4 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>{isHindi ? 'खरीदार से चैट करें' : 'Chat with Buyer'}</span>
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>{isHindi ? 'स्लिप प्रिंट करें' : 'Print Slip'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onNavigateToBookings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToBookings();
                }}
                className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isHindi ? 'मेरी बुकिंग्स देखें' : 'View in Bookings'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
            >
              {isHindi ? 'पूर्ण' : 'Done'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
