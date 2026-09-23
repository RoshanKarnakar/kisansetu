import React from 'react';
import { X, QrCode, Printer, CheckCircle, Wheat, ShieldCheck, MapPin } from 'lucide-react';
import { Booking, FarmerProfile, Language } from '../types';

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  farmer: FarmerProfile;
  language: Language;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({
  isOpen,
  onClose,
  booking,
  farmer,
  language
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Pass Top Banner */}
        <div className="bg-[#1B5E3C] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">Mandi Digital Gate Pass</h3>
              <p className="text-[11px] text-emerald-200">Haryana State Agricultural Marketing Board</p>
            </div>
          </div>
          <button
            id="close-gatepass-modal"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Body (Printable card style) */}
        <div className="p-5 text-gray-800 space-y-4">
          
          {/* Big Token Number Callout */}
          <div className="bg-[#FAF6EE] border-2 border-dashed border-emerald-700/40 rounded-xl p-3.5 text-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Assigned Queue Token
            </span>
            <div className="text-3xl sm:text-4xl font-black text-[#1B5E3C] tracking-tight mt-0.5">
              TOKEN #{booking.tokenNumber}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3 text-emerald-700" />
              Verified Digital E-Pass
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-2">
            <div className="flex justify-between border-b border-gray-200 pb-1.5">
              <span className="text-gray-500 font-medium">Farmer Name:</span>
              <span className="font-bold text-gray-900">{farmer.name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1.5">
              <span className="text-gray-500 font-medium">Registration ID:</span>
              <span className="font-mono font-semibold text-emerald-800">{farmer.registrationNo}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1.5">
              <span className="text-gray-500 font-medium">Procurement Centre:</span>
              <span className="font-semibold text-gray-900">{booking.centreName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1.5">
              <span className="text-gray-500 font-medium">Scheduled Date &amp; Slot:</span>
              <span className="font-bold text-[#1B5E3C]">{booking.date}, {booking.timeRange}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1.5">
              <span className="text-gray-500 font-medium">Vehicle / Trolley No:</span>
              <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-300">
                {booking.vehicleNo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Declared Commodity:</span>
              <span className="font-semibold text-amber-800">{booking.estimatedQuantityQuintals} Quintals ({booking.cropType})</span>
            </div>
          </div>

          {/* Simulated QR Code for Gate Scanner */}
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl">
            <div className="w-32 h-32 bg-gray-900 p-2 rounded-lg flex items-center justify-center">
              {/* Scalable SVG QR code representation */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                <rect x="10" y="10" width="25" height="25" fill="none" stroke="white" strokeWidth="6" />
                <rect x="17" y="17" width="11" height="11" />
                <rect x="65" y="10" width="25" height="25" fill="none" stroke="white" strokeWidth="6" />
                <rect x="72" y="17" width="11" height="11" />
                <rect x="10" y="65" width="25" height="25" fill="none" stroke="white" strokeWidth="6" />
                <rect x="17" y="72" width="11" height="11" />
                <rect x="42" y="15" width="8" height="8" />
                <rect x="52" y="25" width="6" height="6" />
                <rect x="45" y="45" width="14" height="14" />
                <rect x="68" y="55" width="10" height="10" />
                <rect x="72" y="75" width="8" height="8" />
                <rect x="45" y="70" width="12" height="12" />
              </svg>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              PASS-ID: KS-GP-{booking.id.slice(-6).toUpperCase()}
            </p>
            <p className="text-[11px] text-gray-600 mt-1 text-center font-medium">
              Scan at Gate 2 boom barrier for automated entry weighing
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              id="print-pass-btn"
              onClick={() => window.print()}
              className="flex-1 py-2.5 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              id="close-pass-btn"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-lg bg-[#1B5E3C] hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
