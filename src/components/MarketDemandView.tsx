import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wheat,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
  Scale,
  Sparkles,
  BarChart3,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Crop, CropMarketData, FarmerProfile, Language } from '../types';
import { getCrops, getCropMarketData } from '../lib/supabaseService';
import { DashboardHero } from './DashboardHero';
import { DashboardStatCard } from './DashboardStatCard';

interface MarketDemandViewProps {
  farmer: FarmerProfile;
  language: Language;
  onNavigateToListings: () => void;
  onNavigateToSlotBooking: (cropId?: string) => void;
}

export const MarketDemandView: React.FC<MarketDemandViewProps> = ({
  farmer,
  language,
  onNavigateToListings,
  onNavigateToSlotBooking,
}) => {
  const isHindi = language === 'hi';

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(farmer.district || 'Karnal');
  const [marketRows, setMarketRows] = useState<CropMarketData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Available districts in Haryana procurement belt
  const districts = ['Karnal', 'Panipat', 'Kurukshetra', 'Kaithal', 'Ambala'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCrops, dataRows] = await Promise.all([
        getCrops(),
        getCropMarketData(selectedDistrict, selectedCropId),
      ]);
      setCrops(allCrops);
      setMarketRows(dataRows);
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCropId, selectedDistrict]);

  // Selected crop details
  const activeCrop = crops.find((c) => c.id === selectedCropId) || crops[0];
  const activeRecord = marketRows.find((r) => r.crop_id === selectedCropId) || marketRows[0];

  const handleCopySql = () => {
    const seedSql = `-- Run in Supabase SQL Editor:
INSERT INTO public.crops (id, name_en, name_hi, category, current_msp_per_quintal, is_procurement_active)
VALUES
  ('wheat', 'Wheat (Sharbati / PBW 550)', 'गेहूं (शरबती)', 'Cereal', 2275.00, true),
  ('paddy_basmati', 'Paddy (Basmati 1121)', 'धान (बासमती 1121)', 'Cereal', 2320.00, true),
  ('mustard', 'Mustard (RH 725)', 'सरसों (आरएच 725)', 'Oilseed', 5650.00, true),
  ('gram', 'Gram / Chana (JG 14)', 'चना (देसी)', 'Pulse', 5440.00, true)
ON CONFLICT (id) DO UPDATE SET current_msp_per_quintal = EXCLUDED.current_msp_per_quintal;

INSERT INTO public.crop_market_data (
  crop_id, district, state, date, demand_index, total_estimated_supply_quintals,
  min_price_per_quintal, max_price_per_quintal, modal_price_per_quintal,
  price_forecast_next_week, recommendation_text
)
VALUES
  ('wheat', 'Karnal', 'Haryana', CURRENT_DATE, 1.85, 14500.00, 2275.00, 2480.00, 2410.00, 2450.00, 'Strong flour mill demand in Karnal APMC. Modal price is trending ₹135 above MSP. Optimal harvest window: book delivery slot for Thursday or Friday.'),
  ('paddy_basmati', 'Karnal', 'Haryana', CURRENT_DATE, 2.15, 28500.00, 3850.00, 4420.00, 4260.00, 4380.00, 'High exporter competition for Basmati 1121 with moisture under 12%. Buyers actively placing bids with quick 24-hr payment settlement.'),
  ('mustard', 'Karnal', 'Haryana', CURRENT_DATE, 1.45, 8200.00, 5650.00, 5980.00, 5840.00, 5880.00, 'Crushing mills active across northern Haryana. Steady spot trading at ₹190 above MSP. Demand is stable.'),
  ('gram', 'Karnal', 'Haryana', CURRENT_DATE, 1.30, 4200.00, 5440.00, 5750.00, 5620.00, 5650.00, 'Firm pulse mill procurement with minimal arrival queues. Direct mandi gate unloading available.')
ON CONFLICT (crop_id, district, date) DO UPDATE SET demand_index = EXCLUDED.demand_index, updated_at = NOW();`;

    navigator.clipboard.writeText(seedSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Helper for demand badge color
  const getDemandColor = (idx: number) => {
    if (idx >= 2.0) return { label: 'Very High Demand', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' };
    if (idx >= 1.5) return { label: 'High Demand', bg: 'bg-emerald-50', text: 'text-[#1B5E3C]', border: 'border-emerald-200' };
    if (idx >= 1.0) return { label: 'Moderate Demand', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' };
    return { label: 'Normal / Steady', bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <DashboardHero
        tone="cream"
        badge={(
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isHindi ? 'लाइव APMC बाज़ार विश्लेषण • क्षेत्रीय भाव' : 'Live APMC Market Intelligence • Regional Demand'}</span>
          </div>
        )}
        title={isHindi ? 'बाज़ार मांग, आपूर्ति एवं भाव सूचकांक' : 'Market Demand & Price Intelligence'}
        subtitle={isHindi
          ? 'हरियाणा के मंडियों में लाइव खरीद मांग, वास्तविक थोक भाव और आगामी सप्ताह के मूल्य पूर्वानुमान की समीक्षा करें।'
          : 'Analyze real-time APMC procurement volume, spot trading ranges, and price forecasts to decide when to list or book slots.'}
        actions={(
          <>
          <button
            onClick={loadData}
            title="Refresh from Supabase"
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={onNavigateToListings}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Wheat className="w-4 h-4" />
            <span>{isHindi ? 'मेरी फसलें देखें' : 'Manage My Crops'}</span>
          </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardStatCard label={isHindi ? 'वर्तमान थोक भाव (Modal Price)' : 'Current Modal APMC Price'} value={activeRecord ? `₹${activeRecord.modal_price_per_quintal.toLocaleString()}` : '—'} detail={activeRecord ? `Official MSP: ₹${activeCrop?.current_msp_per_quintal || 2275}/Q` : 'Loading market data'} icon={<Scale className="w-4 h-4 text-emerald-700" />} />
        <DashboardStatCard label={isHindi ? 'मांग सूचकांक (Demand Index)' : 'Buyer Demand Index'} value={activeRecord ? `${Number(activeRecord.demand_index).toFixed(2)}x` : '—'} detail={activeRecord ? `${Number(activeRecord.total_estimated_supply_quintals).toLocaleString()} Q estimated arrivals` : 'Loading market data'} icon={<TrendingUp className="w-4 h-4 text-amber-600" />} />
        <DashboardStatCard label={isHindi ? 'आगामी सप्ताह पूर्वानुमान' : 'Next Week Price Forecast'} value={activeRecord ? `₹${activeRecord.price_forecast_next_week?.toLocaleString() || activeRecord.modal_price_per_quintal}` : '—'} detail={activeRecord ? 'Price trend forecast' : 'Loading market data'} icon={<Sparkles className="w-4 h-4 text-emerald-600" />} />
      </div>

      {/* Selectors Bar */}
      <div className="bg-[#FAF6EE] rounded-2xl p-4 sm:p-5 border border-[#E7DFCD] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Crop Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {isHindi ? 'फसल:' : 'Crop:'}
            </span>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {isHindi ? c.name_hi : c.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {isHindi ? 'मंडी क्षेत्र / ज़िला:' : 'APMC District:'}
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d} {d === farmer.district ? `(${isHindi ? 'आपका ज़िला' : 'Your District'})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-800" />
          <span>{isHindi ? 'अद्यतन तिथि:' : 'Latest Data:'}</span>
          <span className="font-semibold text-gray-900">
            {activeRecord?.date || new Date().toISOString().slice(0, 10)}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border border-[#E7DFCD]">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">{isHindi ? 'Supabase crop_market_data से लोड हो रहा है...' : 'Querying crop_market_data from Supabase...'}</p>
        </div>
      ) : activeRecord ? (
        <div className="space-y-6">
          {/* Price Range Breakdown & Rule-based Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Price Range Band */}
            <div className="bg-white rounded-2xl p-6 border border-[#E7DFCD] shadow-xs lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>{isHindi ? 'मंडी मूल्य परास (Trading Range)' : 'APMC Trading Price Range'}</span>
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {isHindi ? `${selectedDistrict} मंडी में आज दर्ज की गई दरें` : `Recorded today across ${selectedDistrict} APMC yards`}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                    <span className="text-gray-600">{isHindi ? 'न्यूनतम दर (Min Price):' : 'Min Spot Price:'}</span>
                    <span className="font-bold text-gray-900">₹{activeRecord.min_price_per_quintal}/Q</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-xs border border-emerald-200">
                    <span className="text-emerald-900 font-bold">{isHindi ? 'औसत थोक दर (Modal):' : 'Modal Price:'}</span>
                    <span className="font-extrabold text-[#1B5E3C] text-sm">₹{activeRecord.modal_price_per_quintal}/Q</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                    <span className="text-gray-600">{isHindi ? 'उच्चतम दर (Max Premium):' : 'Max Premium Price:'}</span>
                    <span className="font-bold text-gray-900">₹{activeRecord.max_price_per_quintal}/Q</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => onNavigateToSlotBooking(activeCrop?.id)}
                  className="w-full py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isHindi ? 'इस फसल के लिए स्लॉट बुक करें' : 'Book Delivery Slot for this Crop'}</span>
                </button>
              </div>
            </div>

            {/* Recommendation & Advice */}
            <div className="bg-white rounded-2xl p-6 border border-[#E7DFCD] shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>{isHindi ? 'मंडी विश्लेषण एवं किसान परामर्श' : 'Market Analysis & Recommended Action'}</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {isHindi ? 'नियम-आधारित विश्लेषण' : 'Rule-based Assessment'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#E7DFCD] text-sm text-gray-800 leading-relaxed mb-4">
                  {activeRecord.recommendation_text ||
                    (isHindi
                      ? `${selectedDistrict} मंडी में खरीद मांग मजबूत है। बेहतर मूल्य प्राप्ति के लिए नमी 12% से कम रखें और समय पर स्लॉट बुक करें।`
                      : `Procurement demand in ${selectedDistrict} APMC is healthy. Ensure moisture remains within allowable thresholds (<12%) to secure premium prices.`)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
                    <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>{isHindi ? 'गुणवत्ता मानक (Moisture Limits)' : 'Quality Standards'}</span>
                    </div>
                    <p className="text-gray-600">
                      {isHindi
                        ? 'अधिकतम स्वीकार्य नमी 12.0% है। कम नमी वाले लॉट को व्यापारी उच्च प्राथमिकता देते हैं।'
                        : 'Permissible moisture cap is 12.0%. Grain lots meeting this specification clear intake with 0 deductions.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
                    <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>{isHindi ? 'व्यापारी बोलियां (Buyer Bids)' : 'Direct Buyer Bidding'}</span>
                    </div>
                    <p className="text-gray-600">
                      {isHindi
                        ? 'व्यापारी सीधे आपके खेत या मंडी यार्ड के लिए बोलियां भेज सकते हैं। आप स्वीकार कर सकते हैं।'
                        : 'Licensed millers and institutional buyers can place bids on your crop listings directly in the app.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={onNavigateToListings}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  {isHindi ? 'फसल लिस्टिंग में जोड़ें' : 'List in Marketplace'}
                </button>
                <button
                  onClick={() => onNavigateToSlotBooking(activeCrop?.id)}
                  className="px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isHindi ? 'मंडी स्लॉट चुनें' : 'Proceed to Slot Booking'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State with Seed SQL Helper */
        <div className="bg-white rounded-2xl p-8 border border-[#E7DFCD] text-center shadow-xs">
          <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Info className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {isHindi ? 'कोई बाज़ार डेटा नहीं मिला' : 'No Market Records Found For Selected Region'}
          </h3>
          <p className="text-xs text-gray-600 max-w-lg mx-auto mt-1 mb-6">
            {isHindi
              ? `डेटाबेस में "${selectedDistrict}" ज़िले और "${activeCrop?.name_en}" के लिए कोई रिकॉर्ड उपलब्ध नहीं है। आप Supabase SQL Editor में नमूना डेटा चला सकते हैं।`
              : `The crop_market_data table currently has no entries for ${selectedDistrict} and ${activeCrop?.name_en}. Run the seed SQL in your Supabase SQL Editor to populate live realistic sample data.`}
          </p>

          <div className="max-w-xl mx-auto bg-gray-900 text-gray-200 p-4 rounded-xl text-left text-xs font-mono relative overflow-x-auto mb-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-gray-400">
              <span>SQL Seed Snippet</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer font-sans text-xs"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="text-[11px] leading-relaxed">
{`INSERT INTO public.crop_market_data (
  crop_id, district, state, date, demand_index, 
  total_estimated_supply_quintals, min_price_per_quintal, 
  max_price_per_quintal, modal_price_per_quintal, 
  price_forecast_next_week, recommendation_text
) VALUES (
  '${selectedCropId}', '${selectedDistrict}', 'Haryana', CURRENT_DATE,
  1.85, 14500.00, 2275.00, 2480.00, 2410.00, 2450.00,
  'Strong mill procurement. Spot rates above MSP.'
);`}
            </pre>
          </div>

          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white font-semibold text-xs shadow-xs cursor-pointer"
          >
            {copiedSql ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Seed SQL Copied to Clipboard!' : 'Copy Full Seed SQL'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
