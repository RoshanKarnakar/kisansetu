import React from 'react';
import { X, Phone, Building2, ShieldCheck, Clock, User, ExternalLink } from 'lucide-react';
import { Buyer, Language } from '../types';

interface CallBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyer: {
    company_name: string;
    contact_person: string;
    phone: string;
    trade_license_no?: string;
    reliability_score?: number;
    district?: string;
  };
  language: Language;
}

export const CallBuyerModal: React.FC<CallBuyerModalProps> = ({
  isOpen,
  onClose,
  buyer,
  language,
}) => {
  const isHindi = language === 'hi';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1B5E3C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">
              {isHindi ? 'खरीदार से संपर्क करें' : 'Call Buyer Representative'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#1B5E3C] mx-auto flex items-center justify-center border-2 border-emerald-200">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg">
              {buyer.company_name}
            </h4>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isHindi ? 'मंडी अधिकृत' : 'APMC Licensed'}
              </span>
              {buyer.reliability_score && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {buyer.reliability_score}% {isHindi ? 'विश्वसनीयता' : 'Reliable'}
                </span>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#E8DFC9] text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1 text-gray-500">
                <User className="w-3.5 h-3.5" />
                {isHindi ? 'संपर्क व्यक्ति:' : 'Contact Person:'}
              </span>
              <span className="font-bold text-gray-900">{buyer.contact_person}</span>
            </div>
            {buyer.trade_license_no && (
              <div className="flex items-center justify-between text-gray-600">
                <span>{isHindi ? 'लाइसेंस नं.:' : 'License No:'}</span>
                <span className="font-mono text-gray-800 font-semibold">{buyer.trade_license_no}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {isHindi ? 'कॉलिंग समय:' : 'Mandi Hours:'}
              </span>
              <span className="text-gray-800 font-medium">08:00 AM – 07:00 PM</span>
            </div>
          </div>

          {/* Phone Action */}
          <div className="pt-2">
            <a
              id="call-buyer-direct-btn"
              href={`tel:${buyer.phone}`}
              className="w-full py-3 px-4 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all"
            >
              <Phone className="w-5 h-5 animate-bounce" />
              <span>{buyer.phone}</span>
            </a>
            <p className="text-[11px] text-gray-400 mt-2">
              {isHindi ? 'कॉल करने के लिए ऊपर टैप करें' : 'Tap above to dial via your mobile dialer'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
