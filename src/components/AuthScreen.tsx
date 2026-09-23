import React, { useState } from 'react';
import { 
  Wheat, 
  Phone, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  MapPin, 
  Languages, 
  HelpCircle, 
  Sparkles,
  RefreshCw,
  Info,
  AlertCircle,
  Building2
} from 'lucide-react';
import { FarmerProfile, Language, UserRole } from '../types';
import farmerIllustration from '../assets/images/farmer_banner_art_1789481364416.jpg';
import { supabase } from '../lib/supabaseClient';
import { syncFarmerProfile, getFarmerRecord, syncBuyerProfile } from '../lib/supabaseService';

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  language: Language;
  onToggleLanguage: () => void;
  onLoginSuccess: (farmer: FarmerProfile, role: UserRole) => void;
  onNavigateToAbout: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  language,
  onToggleLanguage,
  onLoginSuccess,
  onNavigateToAbout
}) => {
  const isHindi = language === 'hi';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration form state
  const [regRole, setRegRole] = useState<'farmer' | 'buyer'>('farmer');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regDistrict, setRegDistrict] = useState('Karnal');
  const [regLand, setRegLand] = useState('6.0');
  const [regCrop, setRegCrop] = useState('Wheat');
  // Buyer-specific registration fields
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regTradeLicense, setRegTradeLicense] = useState('');
  const [regGstin, setRegGstin] = useState('');
  const [regBuyerType, setRegBuyerType] = useState('Miller / Processor');
  const [pendingRegistration, setPendingRegistration] = useState<{
    role: 'farmer' | 'buyer';
    name: string;
    village: string;
    district: string;
    landAcres: number;
    preferredCrop: string;
    companyName?: string;
    tradeLicenseNo?: string;
    gstin?: string;
    buyerType?: string;
  } | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Format phone to E.164
  const getE164Phone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  };

  // Handle send OTP via Supabase Auth
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setLoginError(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setLoginError(null);
    setLoginLoading(true);

    const formatted = getE164Phone(cleanPhone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
      });

      if (error) {
        setLoginError(error.message);
      } else {
        setOtpSent(true);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Unable to send OTP');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle verify OTP & sync with profiles, farmers, or buyers tables
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setLoginError(isHindi ? 'कृपया कम से कम 4 अंकों का OTP दर्ज करें' : 'Please enter the 4-digit OTP');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    const formatted = getE164Phone(cleanPhone);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      });

      if (error || !data.user) {
        throw error || new Error('Supabase did not return an authenticated user');
      }
      const userId = data.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw profileError;

      if (pendingRegistration) {
        if (pendingRegistration.role === 'buyer') {
          const buyer = await syncBuyerProfile(userId, formatted, {
            company_name: pendingRegistration.companyName || pendingRegistration.name,
            contact_person: pendingRegistration.name,
            trade_license_no: pendingRegistration.tradeLicenseNo,
            gstin: pendingRegistration.gstin,
            district: pendingRegistration.district,
            phone: formatted,
          });
          setPendingRegistration(null);
          onLoginSuccess({
            id: userId,
            name: buyer.contact_person || buyer.company_name,
            nameHi: buyer.contact_person || buyer.company_name,
            phone: formatted,
            village: buyer.address || buyer.district || 'APMC Yard',
            district: buyer.district || 'Karnal',
            state: buyer.state || 'Haryana',
            landAcres: 0,
            registrationNo: buyer.trade_license_no || userId,
            registeredDate: buyer.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            bankAccountMasked: 'Buyer settlement account',
            preferredCrops: buyer.procurement_crops || [],
          }, 'buyer');
        } else {
          const loggedFarmer = await syncFarmerProfile(userId, formatted, pendingRegistration);
          setPendingRegistration(null);
          onLoginSuccess(loggedFarmer, 'farmer');
        }
      } else if (profile?.role === 'farmer') {
        let loggedFarmer = await getFarmerRecord(userId);
        if (!loggedFarmer) {
          loggedFarmer = await syncFarmerProfile(userId, formatted, {
            name: 'Farmer Partner',
            village: 'Taraori',
            district: 'Karnal',
            landAcres: 5.0,
            preferredCrop: 'Wheat',
          });
        }
        onLoginSuccess({ ...loggedFarmer, phone: formatted }, 'farmer');
      } else if (profile?.role === 'buyer') {
        const { data: buyer } = await supabase.from('buyers').select('*').eq('id', userId).maybeSingle();
        const buyerRecord = buyer || await syncBuyerProfile(userId, formatted, {
          company_name: 'Authorized Grain Buyer',
          contact_person: 'Buyer Representative',
        });
        onLoginSuccess({
          id: userId,
          name: buyerRecord.contact_person || buyerRecord.company_name,
          nameHi: buyerRecord.contact_person || buyerRecord.company_name,
          phone: formatted,
          village: buyerRecord.address || buyerRecord.district || 'APMC Yard',
          district: buyerRecord.district || 'Karnal',
          state: buyerRecord.state || 'Haryana',
          landAcres: 0,
          registrationNo: buyerRecord.trade_license_no || userId,
          registeredDate: buyerRecord.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          bankAccountMasked: 'Buyer settlement account',
          preferredCrops: buyerRecord.procurement_crops || [],
        }, 'buyer');
      } else if (profile?.role === 'admin' || profile?.role === 'staff') {
        onLoginSuccess({
          id: userId,
          name: profile.full_name || 'APMC Administrator',
          nameHi: profile.full_name || 'APMC Administrator',
          phone: formatted,
          village: 'APMC Centre',
          district: 'Karnal',
          state: 'Haryana',
          landAcres: 0,
          registrationNo: userId,
          registeredDate: profile.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          bankAccountMasked: 'APMC staff account',
          preferredCrops: [],
        }, profile.role as UserRole);
      } else {
        // First-time login without pending registration: create default farmer profile
        const loggedFarmer = await syncFarmerProfile(userId, formatted, {
          name: 'Farmer Partner',
          village: 'Taraori',
          district: 'Karnal',
          landAcres: 5.0,
          preferredCrop: 'Wheat',
        });
        onLoginSuccess({ ...loggedFarmer, phone: formatted }, 'farmer');
      }
    } catch (err: any) {
      console.error('Login verification error:', err);
      setLoginError(err.message || 'Unable to verify OTP');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle registration submit -> Real profile & role sync
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regRole === 'buyer') {
      if (!regCompanyName.trim()) {
        setRegError(isHindi ? 'कृपया कंपनी / व्यापार का नाम दर्ज करें' : 'Please enter company or business name');
        return;
      }
      if (!regName.trim()) {
        setRegError(isHindi ? 'कृपया अधिकृत प्रतिनिधि का नाम दर्ज करें' : 'Please enter contact person name');
        return;
      }
    } else {
      if (!regName.trim()) {
        setRegError(isHindi ? 'कृपया किसान का नाम दर्ज करें' : 'Please enter farmer name');
        return;
      }
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setRegError(isHindi ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setRegLoading(true);
    setRegError(null);

    const formatted = getE164Phone(cleanPhone);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      setPendingRegistration({
        role: regRole,
        name: regName.trim(),
        village: regVillage.trim() || 'Taraori',
        district: regDistrict || 'Karnal',
        landAcres: parseFloat(regLand) || 5.0,
        preferredCrop: regCrop,
        companyName: regCompanyName.trim(),
        tradeLicenseNo: regTradeLicense.trim(),
        gstin: regGstin.toUpperCase().trim(),
        buyerType: regBuyerType,
      });
      setPhone(formatted.replace('+91', ''));
      setOtp('');
      setOtpSent(true);
      setActiveTab('login');
    } catch (err: any) {
      console.error('Registration sync error:', err);
      setRegError(err.message || 'Unable to send registration OTP');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F3] flex flex-col justify-between">
      
      {/* Top Government Portal Brand Bar */}
      <header className="bg-[#1B5E3C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800/90 flex items-center justify-center border border-emerald-500/30 text-amber-300">
              <Wheat className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  KisanSetu
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-emerald-950">
                  APMC Portal
                </span>
              </div>
              <span className="text-[11px] text-emerald-200 block -mt-0.5">
                {isHindi ? 'हरियाणा राज्य कृषि विपणन बोर्ड' : 'Haryana State Agricultural Marketing Board'}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Learn More / About link */}
            <button
              id="auth-header-about-btn"
              onClick={onNavigateToAbout}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/40 text-emerald-100 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-300" />
              <span>{isHindi ? 'पोर्टल जानकारी' : 'How It Works'}</span>
            </button>

            {/* Language Toggle */}
            <button
              id="auth-language-toggle-btn"
              onClick={onToggleLanguage}
              className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/40 text-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center w-full">
        
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Visual Greeting & Value Points */}
          <div className="lg:col-span-5 space-y-6 text-left hidden lg:block">
            
            <div className="relative rounded-2xl overflow-hidden border border-[#D9CBB0] shadow-md">
              <img 
                src={farmerIllustration} 
                alt="Farmer at Mandi" 
                className="w-full h-44 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B5E3C]/90 via-[#1B5E3C]/40 to-transparent flex items-end p-4">
                <span className="text-white text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  {isHindi ? 'सरकारी न्यूनतम समर्थन मूल्य (MSP) खरीद' : 'Official Govt. MSP Procurement System'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-[#1B5E3C] leading-tight">
                {isHindi 
                  ? 'मंडी में लाइन नहीं, तय समय पर तुलाई।' 
                  : 'Skip the Road Queue. Book Your Weighbridge Slot.'}
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {isHindi 
                  ? 'किसानसेतु से घर बैठे खरीद टोकन प्राप्त करें, लाइव कतार ट्रैक करें और सीधे बैंक खाते में भुगतान पाएं।' 
                  : 'KisanSetu connects farmers directly with APMC procurement centres. Reserve your arrival time and monitor weighbridge tokens in real-time.'}
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B5E3C] flex-shrink-0" />
                <span>{isHindi ? 'बिना इंतजार सीधा तौल कांटा प्रवेश' : 'Direct weighbridge entry upon arrival'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B5E3C] flex-shrink-0" />
                <span>{isHindi ? 'लाइव SMS एवं व्हाट्सएप टोकन अलर्ट' : 'Real-time SMS token queue updates'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B5E3C] flex-shrink-0" />
                <span>{isHindi ? '24–48 घंटे में सीधे बैंक खाते में DBT भुगतान' : 'Automated DBT payment directly to bank'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="auth-left-learn-more-btn"
                onClick={onNavigateToAbout}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B5E3C] hover:text-emerald-800 hover:underline cursor-pointer"
              >
                <span>{isHindi ? 'पोर्टल के लाभ व केंद्र देखें' : 'Learn more about KisanSetu & Mandi Centres'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-7">
            
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              
              {/* Header inside Card */}
              <div className="bg-[#FAF6EE] p-5 border-b border-[#E9E0CB]">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-[#1B5E3C]">
                      {activeTab === 'login' 
                        ? (isHindi ? 'किसान लॉगिन' : 'Farmer Portal Login')
                        : (isHindi ? 'नया किसान पंजीकरण' : 'New Farmer Registration')}
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {activeTab === 'login'
                        ? (isHindi ? 'अपने 10-अंकीय मोबाइल नंबर से OTP पाएं' : 'Sign in using your 10-digit mobile number & OTP')
                        : (isHindi ? 'खरीद स्लॉट और टोकन के लिए पंजीकरण करें' : 'Register your land & Aadhaar details to book slots')}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#1B5E3C] text-amber-300 flex items-center justify-center font-bold">
                    <Wheat className="w-5 h-5" />
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="mt-4 grid grid-cols-2 p-1 bg-[#EFE8D8] rounded-xl text-xs font-bold">
                  <button
                    id="tab-login-btn"
                    onClick={() => {
                      setActiveTab('login');
                      setLoginError(null);
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-white text-[#1B5E3C] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {isHindi ? 'मोबाइल OTP लॉगिन' : 'Mobile OTP Login'}
                  </button>

                  <button
                    id="tab-register-btn"
                    onClick={() => {
                      setActiveTab('register');
                      setRegError(null);
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-white text-[#1B5E3C] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {isHindi ? 'नया पंजीकरण' : 'New Registration'}
                  </button>
                </div>
              </div>

              {/* Form Content Area */}
              <div className="p-5 sm:p-7">
                
                {activeTab === 'login' ? (
                  /* ================= LOGIN WITH OTP ================= */
                  <div className="space-y-5">
                    
                    {loginError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                        <Info className="w-4 h-4 flex-shrink-0 text-red-500" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                      
                      {/* Mobile Number Input */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {isHindi ? 'पंजीकृत मोबाइल नंबर' : 'Registered Mobile Number'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-500">
                            +91
                          </span>
                          <input
                            id="auth-phone-input"
                            type="tel"
                            maxLength={10}
                            value={phone}
                            disabled={otpSent}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="98765 43210"
                            className="w-full pl-12 pr-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none disabled:bg-gray-100 disabled:text-gray-600"
                          />
                          <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {isHindi 
                            ? 'आपके आधार या मेरी फसल मेरा ब्योरा से जुड़ा नंबर' 
                            : 'Number linked to Meri Fasal Mera Byora or Aadhaar'}
                        </p>
                      </div>

                      {/* OTP Input (Shown after OTP is sent) */}
                      {otpSent && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-gray-700">
                              {isHindi ? '4-अंकीय OTP दर्ज करें' : 'Enter 4-Digit OTP'}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setOtpSent(false);
                                setOtp('');
                              }}
                              className="text-xs font-bold text-[#1B5E3C] hover:underline"
                            >
                              {isHindi ? 'नंबर बदलें' : 'Change Number'}
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              id="auth-otp-input"
                              type="text"
                              maxLength={4}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="1234"
                              className="w-full pl-10 pr-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest border-2 border-emerald-600 rounded-xl bg-emerald-50/40 text-[#1B5E3C] focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                            />
                            <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3.5" />
                          </div>

                          <div className="flex items-center justify-end text-xs text-gray-500 pt-1">
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-xs text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
                            >
                              {isHindi ? 'OTP पुनः भेजें' : 'Resend Code'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Submit CTA */}
                      <button
                        id="auth-submit-btn"
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 px-4 rounded-xl bg-[#1B5E3C] hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                      >
                        {loginLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{isHindi ? 'सत्यापित हो रहा है...' : 'Verifying & Loading...'}</span>
                          </>
                        ) : otpSent ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isHindi ? 'OTP सत्यापित करें व प्रवेश करें' : 'Verify OTP & Enter Portal'}</span>
                          </>
                        ) : (
                          <>
                            <span>{isHindi ? 'OTP प्राप्त करें' : 'Get OTP & Continue'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                    </form>

                  </div>
                ) : (
                  /* ================= NEW REGISTRATION (FARMER OR BUYER) ================= */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    
                    {regError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                        <Info className="w-4 h-4 flex-shrink-0 text-red-500" />
                        <span>{regError}</span>
                      </div>
                    )}

                    {/* Role Selector: Farmer or Buyer */}
                    <div className="flex rounded-xl bg-[#EFE8D8] p-1 text-xs font-bold">
                      <button
                        type="button"
                        id="reg-role-farmer-btn"
                        onClick={() => { setRegRole('farmer'); setRegError(null); }}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          regRole === 'farmer' ? 'bg-white text-[#1B5E3C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Wheat className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isHindi ? 'किसान' : 'Farmer'}</span>
                      </button>
                      <button
                        type="button"
                        id="reg-role-buyer-btn"
                        onClick={() => { setRegRole('buyer'); setRegError(null); }}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          regRole === 'buyer' ? 'bg-white text-[#1B5E3C] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isHindi ? 'APMC खरीदार / व्यापारी' : 'APMC Buyer / Trader'}</span>
                      </button>
                    </div>

                    {regRole === 'farmer' ? (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {isHindi ? 'किसान का पूरा नाम *' : 'Farmer Full Name *'}
                          </label>
                          <input
                            id="reg-name-input"
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder={isHindi ? 'उदा. राकेश सिंह' : 'e.g. Rakesh Singh'}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                            </label>
                            <input
                              id="reg-phone-input"
                              type="tel"
                              required
                              maxLength={10}
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                              placeholder="98765 43210"
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'गाँव का नाम' : 'Village Name'}
                            </label>
                            <input
                              id="reg-village-input"
                              type="text"
                              value={regVillage}
                              onChange={(e) => setRegVillage(e.target.value)}
                              placeholder="Taraori"
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'जिला' : 'District'}
                            </label>
                            <select
                              id="reg-district-select"
                              value={regDistrict}
                              onChange={(e) => setRegDistrict(e.target.value)}
                              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] bg-white outline-none"
                            >
                              <option value="Karnal">Karnal</option>
                              <option value="Kurukshetra">Kurukshetra</option>
                              <option value="Kaithal">Kaithal</option>
                              <option value="Ambala">Ambala</option>
                              <option value="Panipat">Panipat</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'भूमि (एकड़)' : 'Land (Acres)'}
                            </label>
                            <input
                              id="reg-land-input"
                              type="number"
                              step="0.5"
                              value={regLand}
                              onChange={(e) => setRegLand(e.target.value)}
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'मुख्य फसल' : 'Primary Crop'}
                            </label>
                            <select
                              id="reg-crop-select"
                              value={regCrop}
                              onChange={(e) => setRegCrop(e.target.value)}
                              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] bg-white outline-none"
                            >
                              <option value="Wheat">Wheat (गेहूँ)</option>
                              <option value="Paddy (Basmati)">Paddy Basmati (धान)</option>
                              <option value="Mustard">Mustard (सरसों)</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                          <span>
                            {isHindi 
                              ? 'पंजीकरण के बाद आपका किसान आईडी बन जाएगा और डीबीटी भुगतान सीधे आपके आधार लिंक खाते में आएगा।' 
                              : 'Your unique Farmer ID will be generated, and payments will be credited directly to your Aadhaar-linked DBT account.'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'कंपनी / व्यापारिक फर्म का नाम *' : 'Company / Firm Name *'}
                            </label>
                            <input
                              id="reg-buyer-company-input"
                              type="text"
                              required
                              value={regCompanyName}
                              onChange={(e) => setRegCompanyName(e.target.value)}
                              placeholder="e.g. Karnal Agro Mills Ltd."
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'अधिकृत प्रतिनिधि नाम *' : 'Contact Person Full Name *'}
                            </label>
                            <input
                              id="reg-buyer-contact-input"
                              type="text"
                              required
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder="e.g. Suresh Singhal"
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'व्यापारिक मोबाइल नंबर *' : 'Mobile Number *'}
                            </label>
                            <input
                              id="reg-buyer-phone-input"
                              type="tel"
                              required
                              maxLength={10}
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                              placeholder="98765 43210"
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'APMC ट्रेड लाइसेंस नंबर' : 'APMC Trade License No.'}
                            </label>
                            <input
                              id="reg-buyer-lic-input"
                              type="text"
                              value={regTradeLicense}
                              onChange={(e) => setRegTradeLicense(e.target.value)}
                              placeholder="HR-KRN-APMC-8812"
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'GSTIN नंबर' : 'GSTIN (Optional)'}
                            </label>
                            <input
                              id="reg-buyer-gstin-input"
                              type="text"
                              maxLength={15}
                              value={regGstin}
                              onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                              placeholder="06AAACK1234F1Z5"
                              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] focus:border-[#1B5E3C] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              {isHindi ? 'प्राथमिक मंडी जिला' : 'Primary APMC District'}
                            </label>
                            <select
                              id="reg-buyer-district-select"
                              value={regDistrict}
                              onChange={(e) => setRegDistrict(e.target.value)}
                              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E3C] bg-white outline-none"
                            >
                              <option value="Karnal">Karnal</option>
                              <option value="Kurukshetra">Kurukshetra</option>
                              <option value="Kaithal">Kaithal</option>
                              <option value="Ambala">Ambala</option>
                              <option value="Panipat">Panipat</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                          <span>
                            {isHindi 
                              ? 'पंजीकृत खरीदार को APMC बाज़ार में लाइव फसलों पर तुरंत बोली लगाने और सीधे मंडी स्लॉट सुरक्षित करने की सुविधा मिलेगी।' 
                              : 'Verified APMC buyers can instantly place bids on active farmer lots and execute mandatory 2-hour digital settlement.'}
                          </span>
                        </div>
                      </>
                    )}

                    <button
                      id="reg-submit-btn"
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#1B5E3C] hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 cursor-pointer"
                    >
                      {regLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isHindi ? 'पंजीकरण हो रहा है...' : 'Registering...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{isHindi ? 'पंजीकरण पूरा करें व पोर्टल खोलें' : 'Complete Registration & Enter Portal'}</span>
                        </>
                      )}
                    </button>

                  </form>
                )}

              </div>

              {/* Bottom Card Footer */}
              <div className="p-3.5 bg-[#FAF6EE] border-t border-[#E9E0CB] text-center">
                <button
                  id="auth-bottom-about-link"
                  onClick={onNavigateToAbout}
                  className="text-xs font-bold text-[#1B5E3C] hover:underline cursor-pointer"
                >
                  {isHindi ? 'किशनसेतु कैसे काम करता है? पूरी जानकारी पढ़ें →' : 'How does KisanSetu work? Learn More & View Mandis →'}
                </button>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1B5E3C]">KisanSetu (किसानसेतु)</span>
            <span>·</span>
            <span>Government of Haryana APMC Procurement Portal</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Toll-Free Helpline: 1800-180-1551</span>
            <span>·</span>
            <span>Kharif &amp; Rabi 2024–25</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
