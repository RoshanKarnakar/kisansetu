import React, { useState } from 'react';
import { X, CheckCircle, Wheat, Truck, Scale, AlertCircle } from 'lucide-react';
import { ProcurementCentre, FarmerProfile, Language, TimeSlot } from '../types';
import { t } from '../i18n';

interface ConfirmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  centre: ProcurementCentre;
  dateStr: string;
  slot: TimeSlot | null;
  farmer: FarmerProfile;
  language: Language;
  onConfirm: (data: {
    cropType: string;
    estimatedQuantityQuintals: number;
    vehicleNo: string;
  }) => Promise<void>;
}

export const ConfirmBookingModal: React.FC<ConfirmBookingModalProps> = ({
  isOpen,
  onClose,
  centre,
  dateStr,
  slot,
  farmer,
  language,
  onConfirm
}) => {
  const [cropType, setCropType] = useState('Wheat');
  const [quantity, setQuantity] = useState<number>(55);
  const [vehicleNo, setVehicleNo] = useState('HR 05 Z 7741');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !slot) return null;

  const mspRate = cropType === 'Wheat' ? 2275 : cropType.includes('Paddy') ? 2203 : 5650;
  const estimatedAmount = Math.round(quantity * mspRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      setError('Please enter your vehicle or tractor trolley registration number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm({
        cropType,
        estimatedQuantityQuintals: Number(quantity),
        vehicleNo: vehicleNo.toUpperCase().trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to book slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-[#1B5E3C] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wheat className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg">
              {t(language, 'bookingModalTitle')}
            </h3>
          </div>
          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Booking Summary Box */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#E8DFC9] text-xs sm:text-sm space-y-1 text-gray-800">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Centre:</span>
              <span className="font-bold text-gray-900">{centre.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Slot Timing:</span>
              <span className="font-bold text-[#1B5E3C]">{dateStr}, {slot.timeRange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Remaining Capacity:</span>
              <span className="font-semibold text-emerald-700">{slot.remainingSlots} slots left</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t(language, 'selectCrop')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {centre.activeCrops.map((crop) => (
                <button
                  type="button"
                  key={crop}
                  onClick={() => setCropType(crop)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    cropType === crop
                      ? 'bg-emerald-50 border-[#1B5E3C] text-[#1B5E3C] ring-1 ring-[#1B5E3C]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-gray-500" />
                {t(language, 'cropQuantity')}
              </label>
              <span className="text-[11px] text-gray-500 font-medium">
                Govt MSP: ₹{mspRate}/Quintal
              </span>
            </div>
            <input
              id="booking-crop-quantity"
              type="number"
              min={5}
              max={500}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E3C] focus:outline-none"
              placeholder="e.g. 50"
            />
            <p className="mt-1 text-[11px] text-emerald-800 font-semibold">
              Estimated Procurement Payout: ₹{estimatedAmount.toLocaleString('en-IN')} (Direct to DBT Account)
            </p>
          </div>

          {/* Vehicle Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-gray-500" />
              {t(language, 'vehicleNumber')}
            </label>
            <input
              id="booking-vehicle-number"
              type="text"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              required
              placeholder="HR 05 Z 7741"
              className="w-full px-3.5 py-2 text-sm uppercase font-mono tracking-wider border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E3C] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Required for automated Mandi Gate ANPR entry &amp; weight slip.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t(language, 'cancel')}
            </button>
            <button
              id="submit-confirm-booking-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#1B5E3C] hover:bg-[#154E31] text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? t(language, 'loading') : t(language, 'confirmBooking')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
