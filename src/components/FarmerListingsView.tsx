import React, { useState, useEffect } from 'react';
import {
  Wheat,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Droplets,
  DollarSign,
  Tag,
  Copy,
  ExternalLink,
  Building2,
  MessageSquare,
  Phone,
  Gavel,
} from 'lucide-react';
import { Crop, CropListing, FarmerProfile, Language, ListingStatus, SlotConfirmationSummary } from '../types';
import {
  getCrops,
  getCropListings,
  createCropListing,
  updateCropListing,
  deleteCropListing,
} from '../lib/supabaseService';
import { BuyerBidsSection } from './BuyerBidsSection';
import { SlotConfirmationModal } from './SlotConfirmationModal';
import { ChatModal } from './ChatModal';
import { CallBuyerModal } from './CallBuyerModal';
import { DashboardHero } from './DashboardHero';
import { DashboardStatCard } from './DashboardStatCard';

interface FarmerListingsViewProps {
  farmer: FarmerProfile;
  language: Language;
  onNavigateToMarket: () => void;
  onNavigateToSlotBooking: (cropId?: string) => void;
}

export const FarmerListingsView: React.FC<FarmerListingsViewProps> = ({
  farmer,
  language,
  onNavigateToMarket,
  onNavigateToSlotBooking,
}) => {
  const isHindi = language === 'hi';

  const [listings, setListings] = useState<CropListing[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<CropListing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formCropId, setFormCropId] = useState<string>('wheat');
  const [formVariety, setFormVariety] = useState<string>('Sharbati / PBW 550');
  const [formQuantity, setFormQuantity] = useState<string>('80');
  const [formExpectedPrice, setFormExpectedPrice] = useState<string>('2400');
  const [formHarvestDate, setFormHarvestDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );
  const [formMoisture, setFormMoisture] = useState<string>('11.5');
  const [formStatus, setFormStatus] = useState<ListingStatus>('active');

  // Buyer Bids interactive state
  const [selectedCropForBids, setSelectedCropForBids] = useState<string>('wheat');
  const [selectedCropNameForBids, setSelectedCropNameForBids] = useState<string>('Wheat (गेहूं)');
  const [selectedListingIdForBids, setSelectedListingIdForBids] = useState<string | undefined>(undefined);
  
  // Modals for Buyer actions
  const [slotConfirmation, setSlotConfirmation] = useState<SlotConfirmationSummary | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState<{ id: string; name: string; phone?: string; bookingId?: string } | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callPartner, setCallPartner] = useState<{
    company_name: string;
    contact_person: string;
    phone: string;
    trade_license_no?: string;
    reliability_score?: number;
  } | null>(null);

  // Load crops & listings from Supabase
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedCrops, fetchedListings] = await Promise.all([
        getCrops(),
        getCropListings(farmer.id),
      ]);
      setCrops(fetchedCrops);
      setListings(fetchedListings);
    } catch (err: any) {
      console.error('Failed to load listings:', err);
      setErrorMsg(isHindi ? 'डेटा लोड करने में विफल' : 'Failed to load crop listings from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmer.id]);

  const openCreateModal = () => {
    setEditingListing(null);
    setFormCropId(crops[0]?.id || 'wheat');
    setFormVariety('PBW 550 Premium');
    setFormQuantity('80');
    const selectedCrop = crops.find((c) => c.id === (crops[0]?.id || 'wheat'));
    setFormExpectedPrice(
      selectedCrop ? String(Math.round(selectedCrop.current_msp_per_quintal * 1.05)) : '2400'
    );
    setFormHarvestDate(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
    setFormMoisture('11.5');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (listing: CropListing) => {
    setEditingListing(listing);
    setFormCropId(listing.crop_id);
    setFormVariety(listing.variety || '');
    setFormQuantity(String(listing.quantity_quintals));
    setFormExpectedPrice(listing.expected_price_per_quintal ? String(listing.expected_price_per_quintal) : '');
    setFormHarvestDate(listing.harvest_date);
    setFormMoisture(listing.moisture_percentage ? String(listing.moisture_percentage) : '12.0');
    setFormStatus(listing.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const qty = parseFloat(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg(isHindi ? 'कृपया मान्य मात्रा (क्विंटल) दर्ज करें' : 'Please enter a valid quantity in quintals');
      setSubmitting(false);
      return;
    }

    const expPrice = formExpectedPrice ? parseFloat(formExpectedPrice) : undefined;
    const moisture = formMoisture ? parseFloat(formMoisture) : undefined;

    if (editingListing) {
      // UPDATE existing listing
      const { data, error } = await updateCropListing(editingListing.id, {
        crop_id: formCropId,
        variety: formVariety,
        quantity_quintals: qty,
        expected_price_per_quintal: expPrice,
        harvest_date: formHarvestDate,
        moisture_percentage: moisture,
        status: formStatus,
      });

      if (error) {
        setErrorMsg(error);
      } else {
        setSuccessMsg(isHindi ? 'फसल लिस्टिंग सफलतापूर्वक अपडेट की गई!' : 'Crop listing updated successfully in Supabase!');
        setIsModalOpen(false);
        await loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } else {
      // CREATE new listing
      const { data, error } = await createCropListing({
        farmer_id: farmer.id,
        crop_id: formCropId,
        variety: formVariety,
        quantity_quintals: qty,
        expected_price_per_quintal: expPrice,
        harvest_date: formHarvestDate,
        moisture_percentage: moisture,
        status: 'active',
      });

      if (error) {
        // If foreign key constraint or RLS error
        setErrorMsg(`Supabase Error: ${error}`);
      } else {
        setSuccessMsg(isHindi ? 'नई फसल लिस्टिंग लाइव हो गई!' : 'New crop listing is now live for buyers to bid on!');
        setIsModalOpen(false);
        await loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm(isHindi ? 'क्या आप वाकई इस लिस्टिंग को हटाना चाहते हैं?' : 'Are you sure you want to delete this listing?')) {
      return;
    }
    const { success, error } = await deleteCropListing(listingId);
    if (!success) {
      setErrorMsg(error || 'Failed to delete listing');
    } else {
      setSuccessMsg(isHindi ? 'लिस्टिंग सफलतापूर्वक हटा दी गई' : 'Listing removed from marketplace');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  // Calculate totals
  const totalQuintals = listings.reduce((acc, l) => acc + Number(l.quantity_quintals || 0), 0);
  const activeCount = listings.filter((l) => l.status === 'active').length;
  const totalValueEst = listings.reduce((acc, l) => {
    const rate = l.expected_price_per_quintal || l.crop?.current_msp_per_quintal || 2275;
    return acc + Number(l.quantity_quintals || 0) * rate;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <DashboardHero
        tone="cream"
        badge={(
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <Wheat className="w-3.5 h-3.5" />
            <span>{isHindi ? '3-साइडेड कृषि बाज़ार • किसान पोर्टल' : '3-Sided APMC Marketplace • Farmer App'}</span>
          </div>
        )}
        title={isHindi ? 'मेरी फसल लिस्टिंग एवं लॉट्स' : 'My Crops & Harvest Lots'}
        subtitle={isHindi
          ? 'अपनी उपज को सीधे पंजीकृत व्यापारियों के सामने रखें, प्रतिस्पर्धी बोलियां (Bids) प्राप्त करें, और सीधे मंडी स्लॉट बुक करें।'
          : 'List your harvested crops directly to licensed APMC buyers, receive real-time bids, and seamlessly book mandi intake slots.'}
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
            id="btn-add-crop-listing"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? 'नई फसल जोड़ें' : 'List New Crop'}</span>
          </button>
          </>
        )}
      />

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold block">{isHindi ? 'त्रुटि (Database Notice)' : 'Database Notice'}</span>
            <p className="mt-0.5 text-xs text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard label={isHindi ? 'सक्रिय फसलें' : 'Active Lots'} value={activeCount} detail={isHindi ? `${listings.length} कुल लिस्टिंग` : `out of ${listings.length} total listings`} icon={<Layers className="w-4 h-4 text-emerald-700" />} />
        <DashboardStatCard label={isHindi ? 'कुल मात्रा (क्विंटल)' : 'Total Quantity'} value={`${totalQuintals.toLocaleString()} Q`} detail={isHindi ? `ज़िला: ${farmer.district}` : `Registered in ${farmer.district}`} icon={<Wheat className="w-4 h-4 text-amber-600" />} />
        <DashboardStatCard label={isHindi ? 'अनुमानित मूल्य' : 'Est. Total Value'} value={`₹${(totalValueEst / 100000).toFixed(2)} L`} detail={isHindi ? 'MSP / अपेक्षित मूल्य पर' : 'Based on expected/MSP rates'} icon={<DollarSign className="w-4 h-4 text-emerald-700" />} />

        <DashboardStatCard
          label={isHindi ? 'बाज़ार मांग' : 'Market Demand'}
          value="High"
          detail={isHindi ? `${farmer.district} में उच्च मांग` : `High demand in ${farmer.district}`}
          icon={<TrendingUp className="w-4 h-4 text-amber-700" />}
          onClick={onNavigateToMarket}
        />
      </div>

      {/* Main Listings Table & Filters */}
      <div className="bg-white rounded-2xl border border-[#E7DFCD] shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-[#E7DFCD] flex flex-wrap items-center justify-between gap-3 bg-[#FAF6EE]/50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {isHindi ? 'स्थिति अनुसार फ़िल्टर:' : 'Filter by Status:'}
            </span>
            <div className="flex items-center gap-1">
              {(['all', 'active', 'bid_accepted', 'sold', 'withdrawn'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#1B5E3C] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {st === 'all'
                    ? isHindi ? 'सभी' : 'All'
                    : st === 'active'
                    ? isHindi ? 'सक्रिय' : 'Active'
                    : st === 'bid_accepted'
                    ? isHindi ? 'बोली स्वीकृत' : 'Bid Accepted'
                    : st === 'sold'
                    ? isHindi ? 'बिक गया' : 'Sold'
                    : isHindi ? 'वापस लिया' : 'Withdrawn'}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {isHindi ? `${filteredListings.length} परिणाम प्रदर्शित` : `Showing ${filteredListings.length} lot(s)`}
          </div>
        </div>

        {/* Listings Content */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600 mb-3" />
            <p className="text-sm">{isHindi ? 'Supabase डेटाबेस से लोड हो रहा है...' : 'Fetching your crop listings from Supabase...'}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-[#1B5E3C] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wheat className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {isHindi ? 'कोई फसल लिस्टिंग नहीं मिली' : 'No crop listings found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {isHindi
                ? 'आपने अभी तक अपनी फसल को बाज़ार में लिस्ट नहीं किया है। "नई फसल जोड़ें" पर क्लिक करके अपनी पहली उपज दर्ज करें।'
                : 'You have not listed any harvested lots in the marketplace yet. Click below to add your first crop listing.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white font-medium text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHindi ? 'पहली फसल लिस्ट करें' : 'Create First Crop Listing'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
            {filteredListings.map((item) => {
              const cropName = isHindi ? item.crop?.name_hi || item.crop_id : item.crop?.name_en || item.crop_id;
              const msp = item.crop?.current_msp_per_quintal || 2275;
              const isAboveMsp = item.expected_price_per_quintal ? item.expected_price_per_quintal >= msp : false;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-emerald-600/40 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Crop name & Status badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                          <Wheat className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                          <span>{cropName}</span>
                        </h4>
                        <span className="text-xs text-gray-500 block mt-0.5">
                          {item.variety || 'Standard APMC Grade'}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'bid_accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'sold'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Metric Grid */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-[#FAF6EE] border border-[#E7DFCD] text-xs mb-4">
                      <div>
                        <span className="text-gray-500 block">{isHindi ? 'मात्रा:' : 'Quantity:'}</span>
                        <span className="font-bold text-gray-900 text-sm">{item.quantity_quintals} Quintals</span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">{isHindi ? 'अपेक्षित मूल्य:' : 'Expected Price:'}</span>
                        <span className="font-bold text-[#1B5E3C] text-sm">
                          {item.expected_price_per_quintal ? `₹${item.expected_price_per_quintal}/Q` : `MSP ₹${msp}/Q`}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{isHindi ? 'कटाई तिथि:' : 'Harvest Date:'}</span>
                        </span>
                        <span className="font-medium text-gray-800">{item.harvest_date}</span>
                      </div>

                      <div>
                        <span className="text-gray-500 block flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span>{isHindi ? 'नमी (Moisture):' : 'Moisture:'}</span>
                        </span>
                        <span className="font-medium text-gray-800">
                          {item.moisture_percentage ? `${item.moisture_percentage}%` : 'Standard (<12%)'}
                        </span>
                      </div>
                    </div>

                    {/* Official MSP baseline badge */}
                    <div className="flex items-center justify-between text-[11px] text-gray-600 px-1 mb-3">
                      <span>Official MSP: ₹{msp}/Q</span>
                      {isAboveMsp && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          +₹{(item.expected_price_per_quintal || 0) - msp} above MSP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedCropForBids(item.crop_id);
                          setSelectedCropNameForBids(cropName);
                          setSelectedListingIdForBids(item.id);
                          document.getElementById('buyer-bids-section-anchor')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold inline-flex items-center gap-1 border border-amber-200 cursor-pointer transition-colors"
                      >
                        <Gavel className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isHindi ? 'खरीदार बोलियां देखें' : 'View Buyer Bids'}</span>
                      </button>

                      <button
                        onClick={() => onNavigateToSlotBooking(item.crop_id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1B5E3C] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'स्लॉट बुक करें' : 'Book Mandi Slot'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        title="Edit Listing"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete Listing"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BUYER BIDS SECTION (Interactive for selected crop) */}
      {/* ========================================================================= */}
      <div id="buyer-bids-section-anchor" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-[#1B5E3C]" />
              <span>{isHindi ? 'फसल अनुसार खरीदार बोलियां' : 'Buyer Bids for My Produce'}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isHindi
                ? 'लाइसेंस प्राप्त APMC मिलर्स और व्यापारियों द्वारा लाइव बोलियां। स्वीकार करें और अनलोडिंग स्लॉट बुक करें।'
                : 'Select a crop to view and accept offers from authorized APMC buyers with guaranteed settlement.'}
            </p>
          </div>

          {/* Crop Selector Tabs for Buyer Bids */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'wheat', label: 'Wheat (गेहूं)' },
              { id: 'paddy_basmati', label: 'Paddy Basmati (बासमती)' },
              { id: 'mustard', label: 'Mustard (सरसों)' },
              { id: 'gram', label: 'Gram (चना)' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCropForBids(c.id);
                  setSelectedCropNameForBids(c.label);
                  setSelectedListingIdForBids(undefined);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCropForBids === c.id
                    ? 'bg-[#1B5E3C] text-white font-bold shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Buyer Bids Component */}
        <BuyerBidsSection
          cropId={selectedCropForBids}
          cropName={selectedCropNameForBids}
          listingId={selectedListingIdForBids}
          farmer={farmer}
          language={language}
          onBidAccepted={(confirmation) => {
            setSlotConfirmation(confirmation);
            setIsConfirmationOpen(true);
            setSuccessMsg(
              isHindi
                ? `बोली स्वीकृत! स्लॉट टोकन #${confirmation.slotNumber} कन्फर्म हो गया।`
                : `Bid accepted! Token #${confirmation.slotNumber} confirmed with buyer.`
            );
            loadData();
          }}
          onOpenChat={(buyerId, buyerName, phone) => {
            setChatPartner({
              id: buyerId,
              name: buyerName,
              phone,
              bookingId: selectedListingIdForBids || 'booking-active',
            });
            setIsChatOpen(true);
          }}
          onCallBuyer={(buyer) => {
            setCallPartner(buyer);
            setIsCallOpen(true);
          }}
        />
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1B5E3C] flex items-center justify-center">
                  <Wheat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingListing
                      ? isHindi ? 'फसल लिस्टिंग संपादित करें' : 'Edit Crop Listing'
                      : isHindi ? 'नई फसल लिस्ट करें' : 'List Harvested Crop'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {isHindi ? 'Supabase crop_listings टेबल में सहेजा जाएगा' : 'Directly saved to Supabase crop_listings'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              {/* Crop Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'फसल का चयन करें *' : 'Select Crop *'}
                </label>
                <select
                  value={formCropId}
                  onChange={(e) => {
                    const newCropId = e.target.value;
                    setFormCropId(newCropId);
                    const sel = crops.find((c) => c.id === newCropId);
                    if (sel) {
                      setFormExpectedPrice(String(Math.round(sel.current_msp_per_quintal * 1.05)));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  required
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en} (MSP: ₹{c.current_msp_per_quintal}/Q)
                    </option>
                  ))}
                </select>
              </div>

              {/* Variety */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'किस्म / वेराइटी (Variety)' : 'Crop Variety / Grade'}
                </label>
                <input
                  type="text"
                  value={formVariety}
                  onChange={(e) => setFormVariety(e.target.value)}
                  placeholder="e.g. PBW 550, Basmati 1121, Sharbati"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isHindi ? 'मात्रा (क्विंटल) *' : 'Quantity (Quintals) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="80"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Expected Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isHindi ? 'अपेक्षित मूल्य (₹/क्विंटल)' : 'Expected Price (₹/Q)'}
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={formExpectedPrice}
                    onChange={(e) => setFormExpectedPrice(e.target.value)}
                    placeholder="2400"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Harvest Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isHindi ? 'कटाई / तैयार तिथि *' : 'Harvest / Ready Date *'}
                  </label>
                  <input
                    type="date"
                    value={formHarvestDate}
                    onChange={(e) => setFormHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Moisture % */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isHindi ? 'नमी % (Moisture)' : 'Moisture %'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="25"
                    value={formMoisture}
                    onChange={(e) => setFormMoisture(e.target.value)}
                    placeholder="11.5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status (when editing) */}
              {editingListing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isHindi ? 'स्थिति (Status)' : 'Status'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ListingStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="active">Active (Receiving Bids)</option>
                    <option value="bid_accepted">Bid Accepted</option>
                    <option value="sold">Sold</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              )}

              {/* Farmer Location Info Note */}
              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E7DFCD] text-xs text-gray-600 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                <span>
                  {isHindi
                    ? `किसान: ${farmer.name} • गांव: ${farmer.village}, ${farmer.district}`
                    : `Farmer: ${farmer.name} • Location: ${farmer.village}, ${farmer.district} (${farmer.registrationNo})`}
                </span>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>
                    {editingListing
                      ? isHindi ? 'बदलाव सहेजें' : 'Save Changes'
                      : isHindi ? 'लिस्टिंग प्रकाशित करें' : 'Publish to Marketplace'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Slot Confirmation Modal */}
      <SlotConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        confirmation={slotConfirmation}
        language={language}
        onOpenChat={() => {
          if (slotConfirmation) {
            setChatPartner({
              id: slotConfirmation.buyer.id,
              name: slotConfirmation.buyer.company_name,
              phone: slotConfirmation.buyer.phone,
              bookingId: slotConfirmation.slotNumber,
            });
            setIsChatOpen(true);
          }
        }}
        onCallBuyer={() => {
          if (slotConfirmation) {
            setCallPartner({
              company_name: slotConfirmation.buyer.company_name,
              contact_person: slotConfirmation.buyer.contact_person,
              phone: slotConfirmation.buyer.phone,
              trade_license_no: slotConfirmation.buyer.trade_license_no,
              reliability_score: slotConfirmation.buyer.reliability_score,
            });
            setIsCallOpen(true);
          }
        }}
        onNavigateToBookings={() => onNavigateToSlotBooking(selectedCropForBids)}
      />

      {/* Real-time Chat Modal with Buyer */}
      {chatPartner && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          bookingId={chatPartner.bookingId}
          farmerId={farmer.id}
          farmerName={farmer.name}
          buyerId={chatPartner.id}
          buyerName={chatPartner.name}
          buyerPhone={chatPartner.phone}
          currentUserRole="farmer"
          language={language}
          onCallBuyer={() => {
            if (chatPartner.phone) {
              setCallPartner({
                company_name: chatPartner.name,
                contact_person: chatPartner.name,
                phone: chatPartner.phone,
              });
              setIsCallOpen(true);
            }
          }}
        />
      )}

      {/* Call Buyer Modal */}
      {callPartner && (
        <CallBuyerModal
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
          buyer={callPartner}
          language={language}
        />
      )}
    </div>
  );
};
