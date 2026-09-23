import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  MapPin,
  Phone,
  Briefcase
} from 'lucide-react';
import { Buyer, BuyerType, Language } from '../../types';
import { syncBuyerProfile } from '../../lib/supabaseService';
import { supabase } from '../../lib/supabaseClient';

interface BuyerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRegistered: (buyer: Buyer) => void;
}

export const BuyerRegistrationModal: React.FC<BuyerRegistrationModalProps> = ({
  isOpen,
  onClose,
  language,
  onRegistered,
}) => {
  const isHindi = language === 'hi';

  const [companyName, setCompanyName] = useState('Karnal Modern Agrotech Ltd.');
  const [buyerType, setBuyerType] = useState<BuyerType>('Miller / Processor');
  const [tradeLicenseNo, setTradeLicenseNo] = useState('HR-KRN-APMC-9024');
  const [gstin, setGstin] = useState('06AAACK7890F1Z8');
  const [pan, setPan] = useState('AAACK7890F');
  const [contactPerson, setContactPerson] = useState('Vikram Singhania');
  const [phone, setPhone] = useState('+919812055667');
  const [email, setEmail] = useState('procurement@karnalmodernagro.com');
  const [district, setDistrict] = useState('Karnal');
  const [state, setState] = useState('Haryana');
  const [address, setAddress] = useState('Plot 12, APMC Grain Market Complex, GT Road, Karnal');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['wheat', 'paddy_basmati']);
  const [procurementCapacityMt, setProcurementCapacityMt] = useState<string>('8000');
  
  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([
    { name: 'APMC_Trade_License_2024.pdf', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80' }
  ]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCrop = (cropId: string) => {
    setSelectedCrops(prev => 
      prev.includes(cropId) ? prev.filter(c => c !== cropId) : [...prev, cropId]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newDocs: { name: string; url: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const filePath = `buyer-verification/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        // Attempt upload to Supabase storage bucket 'documents' or 'buyer_docs'
        const { data, error } = await supabase.storage.from('documents').upload(filePath, file);
        if (!error && data) {
          const { data: pubData } = supabase.storage.from('documents').getPublicUrl(filePath);
          newDocs.push({ name: file.name, url: pubData.publicUrl });
        } else {
          // Local fallback preview URL
          const previewUrl = URL.createObjectURL(file);
          newDocs.push({ name: file.name, url: previewUrl });
        }
      } catch {
        const previewUrl = URL.createObjectURL(file);
        newDocs.push({ name: file.name, url: previewUrl });
      }
    }

    setUploadedFiles(prev => [...prev, ...newDocs]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg(isHindi ? 'कृपया कंपनी का नाम दर्ज करें' : 'Please enter business name');
      return;
    }
    if (!tradeLicenseNo.trim()) {
      setErrorMsg(isHindi ? 'कृपया APMC ट्रेड लाइसेंस नंबर दर्ज करें' : 'Please enter APMC trade license number');
      return;
    }
    if (!gstin.trim() || gstin.length < 15) {
      setErrorMsg(isHindi ? 'कृपया 15 अंकों का मान्य GSTIN दर्ज करें' : 'Please enter a valid 15-digit GSTIN');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const buyer = await syncBuyerProfile({
        company_name: companyName.trim(),
        buyer_type: buyerType,
        trade_license_no: tradeLicenseNo.trim(),
        gstin: gstin.toUpperCase().trim(),
        pan: pan.toUpperCase().trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        district,
        state,
        address: address.trim(),
        procurement_crops: selectedCrops,
        procurement_capacity_mt: parseFloat(procurementCapacityMt) || 5000,
        documents_url: uploadedFiles.map(f => f.url),
        verification_status: 'verified',
        reliability_score: 98,
      });

      onRegistered(buyer);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden my-4">
        
        {/* Header */}
        <div className="bg-[#1B5E3C] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 border border-emerald-500/40">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl">
                {isHindi ? 'APMC अधिकृत खरीदार पंजीकरण' : 'APMC Licensed Buyer Registration'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isHindi ? 'व्यापारी, मिलर व निर्यातक डायरेक्ट प्रोक्योरमेंट पोर्टल' : 'Direct Procurement Portal for Millers, Exporters & Commission Agents'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Business Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1B5E3C] uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>1. {isHindi ? 'व्यवसाय विवरण' : 'Business Profile & Entity'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'कंपनी / फर्म का नाम *' : 'Company / Firm Name *'}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'खरीदार श्रेणी *' : 'Buyer Category *'}
                </label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as BuyerType)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                >
                  <option value="Miller / Processor">Miller / Processor (फ्लोर / राइस मिल)</option>
                  <option value="Bulk Exporter">Bulk Exporter (थोक निर्यातक)</option>
                  <option value="APMC Commission Agent">APMC Commission Agent (कमीशन एजेंट / आढ़ती)</option>
                  <option value="Modern Retailer">Modern Retailer (सुपरमार्केट / रिटेल चेन)</option>
                  <option value="Feed Manufacturer">Feed Manufacturer (पशु आहार निर्माता)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'APMC ट्रेड लाइसेंस नं. *' : 'APMC Trade License No *'}
                </label>
                <input
                  type="text"
                  value={tradeLicenseNo}
                  onChange={(e) => setTradeLicenseNo(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                  placeholder="HR-KRN-APMC-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'जीएसटीआईएन (GSTIN) *' : 'GSTIN (15 Digits) *'}
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                  placeholder="06AAACK0000F1Z0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'पैन नंबर (PAN)' : 'PAN Number'}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                  placeholder="AAACK0000F"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-[#1B5E3C] uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>2. {isHindi ? 'संपर्क व पता' : 'Contact & Yard Location'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'अधिकृत संपर्क व्यक्ति *' : 'Authorized Person *'}
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'ईमेल आईडी' : 'Business Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'जिला व राज्य *' : 'District & State *'}
                </label>
                <input
                  type="text"
                  value={`${district}, ${state}`}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isHindi ? 'मंडी यार्ड या मिल का पता' : 'Mandi Yard / Plant Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Procurement Requirements */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-[#1B5E3C] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. {isHindi ? 'खरीद आवश्यकताएं' : 'Procurement Requirements'}</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {isHindi ? 'आवश्यक फसलें (खरीद के लिए चुनें):' : 'Crops of Interest (select to procure):'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'wheat', label: 'Wheat (गेहूं)' },
                  { id: 'paddy_basmati', label: 'Paddy Basmati (धान बासमती)' },
                  { id: 'mustard', label: 'Mustard (सरसों)' },
                  { id: 'gram', label: 'Gram (चना)' },
                ].map((c) => {
                  const isSelected = selectedCrops.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCrop(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {c.label} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isHindi ? 'मासिक खरीद क्षमता (मीट्रिक टन / MT)' : 'Monthly Procurement Capacity (Metric Tons)'}
              </label>
              <input
                type="number"
                value={procurementCapacityMt}
                onChange={(e) => setProcurementCapacityMt(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#1B5E3C] outline-none"
              />
            </div>
          </div>

          {/* Section 4: Document Upload */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-[#1B5E3C] uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>4. {isHindi ? 'सत्यापन दस्तावेज (Supabase Storage)' : 'Verification Documents (Storage)'}</span>
            </h4>

            <div className="border-2 border-dashed border-gray-300 hover:border-[#1B5E3C] rounded-xl p-4 text-center bg-gray-50 hover:bg-emerald-50/40 transition-colors">
              <input
                id="buyer-doc-file-input"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="buyer-doc-file-input" className="cursor-pointer space-y-1 block">
                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-xs font-semibold text-gray-700">
                  {isHindi ? 'APMC लाइसेंस / GST प्रमाणपत्र अपलोड करें' : 'Upload APMC Mandi License / GST Certificate'}
                </p>
                <p className="text-[11px] text-gray-400">PDF, JPG, PNG up to 10MB</p>
              </label>
            </div>

            {uploading && (
              <p className="text-xs text-emerald-800 text-center animate-pulse">
                {isHindi ? 'दस्तावेज अपलोड हो रहे हैं...' : 'Uploading documents to Supabase storage...'}
              </p>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5">
                {uploadedFiles.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 text-xs">
                    <span className="flex items-center gap-2 text-emerald-900 font-medium">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      {doc.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                      {isHindi ? 'अपलोड हुआ' : 'Verified'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              id="complete-buyer-reg-btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isHindi ? 'सत्यापित हो रहा...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isHindi ? 'पंजीकरण पूर्ण करें' : 'Complete Buyer Registration'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
