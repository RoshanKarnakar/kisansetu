import React, { useState } from 'react';
import { 
  X, 
  Gavel, 
  Wheat, 
  Building2, 
  Calendar, 
  DollarSign, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { CropListing, Buyer, Language, Bid } from '../../types';
import { createBid } from '../../lib/supabaseService';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: CropListing | null;
  buyer: Buyer;
  language: Language;
  onBidPlaced: (newBid: Bid) => void;
}

export const PlaceBidModal: React.FC<PlaceBidModalProps> = ({
  isOpen,
  onClose,
  listing,
  buyer,
  language,
  onBidPlaced,
}) => {
  const isHindi = language === 'hi';

  const [quantity, setQuantity] = useState<string>(listing ? String(listing.quantity_quintals) : '60');
  const [bidPricePerQuintal, setBidPricePerQuintal] = useState<string>(
    listing?.expected_price_per_quintal 
      ? String(listing.expected_price_per_quintal)
      : '2460'
  );
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>(
    'Instant weighbridge DBT settlement within 2 hours of arrival at Mandi Gate 2.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !listing) return null;

  const qty = parseFloat(quantity) || 0;
  const priceQtl = parseFloat(bidPricePerQuintal) || 0;
  const priceKg = priceQtl / 100;
  const totalAmount = Math.round(qty * priceQtl);
  const msp = listing.crop?.current_msp_per_quintal || 2275;
  const priceDelta = priceQtl - msp;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) {
      setErrorMsg(isHindi ? 'कृपया मान्य मात्रा दर्ज करें' : 'Please enter a valid quantity');
      return;
    }
    if (priceQtl <= 0) {
      setErrorMsg(isHindi ? 'कृपया मान्य बोली दर दर्ज करें' : 'Please enter a valid bid price');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { data, error } = await createBid({
      buyer_id: buyer.id,
      listing_id: listing.id,
      crop_id: listing.crop_id,
      crop_name: listing.crop?.name_en || 'Grain',
      variety: listing.variety || 'FAQ Standard',
      farmer_id: listing.farmer_id,
      farmer_name: listing.farmer_name || 'Farmer Partner',
      farmer_village: listing.farmer_village || 'Taraori',
      farmer_district: listing.farmer_district || 'Karnal',
      farmer_phone: listing.farmer_phone || '+919876543210',
      quantity_quintals: qty,
      bid_price_per_quintal: priceQtl,
      expected_delivery_date: expectedDate,
      notes,
    });

    setSubmitting(false);

    if (error || !data) {
      setErrorMsg(error || 'Failed to submit bid');
      return;
    }

    onBidPlaced(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-4">
        
        {/* Modal Header */}
        <div className="bg-[#1B5E3C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300 border border-emerald-500/40">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isHindi ? 'फसल लॉट पर बोली लगाएं' : 'Place Formal Procurement Bid'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {buyer.company_name} ({buyer.trade_license_no})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Farmer Lot Reference */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#E8DFC9] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{isHindi ? 'किसान व स्थान:' : 'Farmer Reference:'}</span>
              <span className="font-bold text-gray-900">
                {listing.farmer_name || 'Farmer Partner'} ({listing.farmer_village || 'Taraori'}, {listing.farmer_district || 'Karnal'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{isHindi ? 'फसल व किस्म:' : 'Crop & Variety:'}</span>
              <span className="font-bold text-emerald-800">
                {listing.crop?.name_en || listing.crop_id} • {listing.variety || 'FAQ'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">{isHindi ? 'उपलब्ध लॉट मात्रा:' : 'Lot Available Quantity:'}</span>
              <span className="font-semibold text-gray-800">
                {listing.quantity_quintals} Quintals (Moisture: {listing.moisture_percentage || '11.5'}%)
              </span>
            </div>
          </div>

          {/* Quantity & Bid Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isHindi ? 'खरीद मात्रा (क्विंटल) *' : 'Procurement Qty (Quintals) *'}
              </label>
              <div className="relative">
                <input
                  id="bid-form-quantity"
                  type="number"
                  min="1"
                  max={listing.quantity_quintals}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] focus:border-transparent outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">Qtl</span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                = {(qty * 100).toLocaleString('en-IN')} kg
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isHindi ? 'बोली दर (प्रति क्विंटल) *' : 'Bid Price (per Quintal) *'}
              </label>
              <div className="relative">
                <input
                  id="bid-form-price"
                  type="number"
                  min="500"
                  step="10"
                  value={bidPricePerQuintal}
                  onChange={(e) => setBidPricePerQuintal(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1B5E3C] focus:ring-2 focus:ring-[#1B5E3C] focus:border-transparent outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">₹/Qtl</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
                = ₹{priceKg.toFixed(2)}/kg {priceDelta >= 0 ? `(+₹${(priceDelta / 100).toFixed(2)} vs MSP)` : ''}
              </span>
            </div>
          </div>

          {/* Expected Date & Calculation Card */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {isHindi ? 'अपेक्षित मंडी डिलीवरी तारीख *' : 'Expected Delivery Date *'}
            </label>
            <input
              id="bid-form-date"
              type="date"
              value={expectedDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Special Terms / Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {isHindi ? 'खरीद शर्तें व भुगतान निर्देश' : 'Payment & Unloading Terms'}
            </label>
            <textarea
              id="bid-form-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] focus:border-transparent outline-none"
              placeholder="e.g. Payment via RTGS/DBT within 2 hours of weighment..."
            />
          </div>

          {/* Financial Calculation Box */}
          <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>{isHindi ? 'प्रति किग्रा प्रभावी दर:' : 'Effective Price per kg:'}</span>
              <span className="font-bold text-[#1B5E3C]">₹{priceKg.toFixed(2)} / kg</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{isHindi ? 'कुल अनुमानित सौदा राशि:' : 'Total Estimated Deal Value:'}</span>
              <span className="font-bold text-base text-[#1B5E3C]">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 text-[11px] pt-1 border-t border-emerald-200">
              <span>{isHindi ? 'मंडी शुल्क (1.5%) + आरडीएफ (1%):' : 'APMC Mandi Fee & Cess (Buyer paid):'}</span>
              <span>₹{Math.round(totalAmount * 0.025).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              id="submit-bid-btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isHindi ? 'बोली जमा हो रही...' : 'Submitting Bid...'}</span>
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" />
                  <span>{isHindi ? 'बोली जमा करें' : 'Submit Formal Bid'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
