import React from 'react';
import { 
  Wheat, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Users, 
  MapPin, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  Sparkles,
  PhoneCall,
  Scale
} from 'lucide-react';
import { ProcurementCentre, Language } from '../types';
import farmerIllustration from '../assets/images/farmer_banner_art_1789481364416.jpg';

interface PublicLandingHomeProps {
  centres: ProcurementCentre[];
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSelectCentreAndBook: (centreId: string) => void;
  language: Language;
  onBackToLogin?: () => void;
}

export const PublicLandingHome: React.FC<PublicLandingHomeProps> = ({
  centres,
  onOpenLogin,
  onOpenRegister,
  onSelectCentreAndBook,
  language,
  onBackToLogin
}) => {
  const isHindi = language === 'hi';

  const steps = [
    {
      num: '01',
      title: isHindi ? 'सरल पंजीकरण' : 'Quick Register',
      desc: isHindi ? 'आधार और मोबाइल नंबर से 1 मिनट में सत्यापन' : 'Verify via Aadhaar & Mobile OTP in under 1 minute',
      icon: Smartphone,
      color: 'bg-emerald-100 text-[#1B5E3C]'
    },
    {
      num: '02',
      title: isHindi ? 'स्लॉट चुनें' : 'Book a Slot',
      desc: isHindi ? 'अपनी नजदीकी मंडी, दिनांक और समय स्लॉट चुनें' : 'Select nearby Mandi centre, date, time & vehicle details',
      icon: Calendar,
      color: 'bg-amber-100 text-amber-800'
    },
    {
      num: '03',
      title: isHindi ? 'टोकन प्राप्त करें' : 'Get Live Token',
      desc: isHindi ? 'डिजिटल गेट पास और कतार में अपनी बारी का लाइव ट्रैकिंग' : 'Instant digital QR pass and real-time weighbridge queue position',
      icon: Scale,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      num: '04',
      title: isHindi ? 'सीधा भुगतान' : 'Track DBT Payment',
      desc: isHindi ? 'तौल के 24-48 घंटे में सीधे बैंक खाते में भुगतान' : 'Automated DBT payment credited directly into your Aadhaar-linked bank',
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  const benefits = [
    {
      title: isHindi ? 'लंबी कतारों से मुक्ति' : 'No More Long Queues',
      desc: isHindi 
        ? 'सड़क पर 12-24 घंटे ट्रैक्टर ट्रॉली में इंतजार करने की जरूरत नहीं। अपने तय समय पर पहुंचें।' 
        : 'Say goodbye to 12+ hour highway bottlenecks. Arrive during your booked window and drive straight to the weighbridge.',
      icon: TrendingDown,
      stat: '60% Faster'
    },
    {
      title: isHindi ? 'रीयल-टाइम टोकन ट्रैकिंग' : 'Real-Time Token Tracking',
      desc: isHindi 
        ? 'अपने मोबाइल पर देखें कि मंडी में इस समय कौन सा टोकन चल रहा है और आपकी बारी में कितना समय है।' 
        : 'Watch live token progression and estimated wait minutes from your farm before starting your journey.',
      icon: Clock,
      stat: 'Live Minutes'
    },
    {
      title: isHindi ? 'आपकी भाषा में SMS अलर्ट' : 'SMS Alerts in Your Language',
      desc: isHindi 
        ? 'जब आपका टोकन 3 स्थान दूर होगा, तो आपको हिंदी में सीधा SMS मिलेगा ताकि आप समय पर गेट पर पहुंच सकें।' 
        : 'Automatic SMS notifications sent when your token is 3 spots away, keeping you relaxed without checking your screen.',
      icon: Smartphone,
      stat: 'Hindi & English'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      
      {/* Optional Top Bar when navigated from Login */}
      {onBackToLogin && (
        <div className="bg-[#FAF6EE] border-b border-[#E9E0CB] py-2.5 px-4 sticky top-16 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              id="about-back-to-login-btn"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1B5E3C] hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isHindi ? 'लॉगिन / पंजीकरण स्क्रीन पर वापस जाएं' : 'Back to Login / Register Screen'}</span>
            </button>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              {isHindi ? 'सार्वजनिक जानकारी व मंडी केंद्र' : 'Public Portal Info & Mandi Centres'}
            </span>
          </div>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1B5E3C] to-[#164e32] text-white pt-8 sm:pt-14 pb-16 sm:pb-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-amber-300 text-xs sm:text-sm font-semibold shadow-xs">
                <Wheat className="w-4 h-4 text-amber-400" />
                <span>{isHindi ? 'हरियाणा सरकार APMC खरीद पोर्टल' : 'Official Digital APMC Kharif & Rabi Portal'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
                {isHindi ? (
                  <>
                    किसानसेतु — <span className="text-amber-300">खरीद स्लॉट बुक करें</span>, कतार से बचें
                  </>
                ) : (
                  <>
                    KisanSetu — <span className="text-amber-300">Book Your Procurement Slot</span>, Skip the Wait
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-lg text-emerald-100 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                {isHindi ? (
                  'मंडी में लंबी कतारों, ट्रैफिक जाम और अनिश्चितता को अलविदा कहें। घर बैठे डिजिटल स्लॉट बुक करें, लाइव टोकन स्थिति ट्रैक करें और सीधा बैंक भुगतान प्राप्त करें।'
                ) : (
                  'A modern digital bridge for farmers to book confirmed APMC Mandi slots, track live weighbridge tokens in real-time, and receive direct MSP payments via DBT with zero congestion.'
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  id="hero-login-btn"
                  onClick={onOpenLogin}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-emerald-950" />
                  <span>{isHindi ? 'मोबाइल OTP से लॉगिन करें' : 'Login / Register with Mobile OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="hero-demo-farmer-btn"
                  onClick={onOpenRegister}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm border border-emerald-500/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-200" />
                  <span>{isHindi ? 'नया किसान पंजीकरण' : 'Register New Farmer'}</span>
                </button>
              </div>

              {/* Trust Subtext */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  {isHindi ? '100% निःशुल्क सरकारी सेवा' : '100% Free Government Service'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  {isHindi ? 'सीधा बैंक खाता (DBT)' : 'Direct MSP to Bank Account'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  {isHindi ? 'हिंदी एवं अंग्रेजी में SMS' : 'SMS Alerts in Hindi'}
                </span>
              </div>

            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-[#FAF6EE] p-3 rounded-2xl sm:rounded-3xl shadow-2xl border-4 border-emerald-700/50 transform hover:scale-[1.01] transition-transform">
                <img
                  src={farmerIllustration}
                  alt="KisanSetu digital farmer"
                  className="w-full h-56 sm:h-72 object-cover rounded-xl sm:rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Token Badge */}
                <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white p-3 sm:p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center font-black text-sm">
                    #24
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">
                      {isHindi ? 'सक्रिय टोकन' : 'Active Mandi Token'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-gray-900">
                      Karnal APMC · 15 min wait
                    </span>
                  </div>
                </div>

                {/* Floating DBT Badge */}
                <div className="absolute -top-3 -right-3 bg-amber-400 text-emerald-950 px-3 py-1.5 rounded-lg shadow-md font-bold text-xs flex items-center gap-1.5 border border-amber-300">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>DBT Guaranteed</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Live Stats Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/90 p-5 sm:p-7 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          <div className="text-center pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-[#1B5E3C]">3</div>
            <div className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
              {isHindi ? 'लाइव खरीद केंद्र' : 'APMC Centres Live'}
            </div>
            <div className="text-[11px] text-gray-500">
              {isHindi ? 'करनाल, कुरुक्षेत्र, अंबाला' : 'Karnal, Kurukshetra, Ambala'}
            </div>
          </div>

          <div className="text-center pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-[#1B5E3C]">500+</div>
            <div className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
              {isHindi ? 'पंजीकृत किसान' : 'Farmers Registered'}
            </div>
            <div className="text-[11px] text-gray-500">
              {isHindi ? 'मेरी फसल मेरा ब्योरा से जुड़ा' : 'Verified via Aadhaar'}
            </div>
          </div>

          <div className="text-center pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">60%</div>
            <div className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
              {isHindi ? 'औसत प्रतीक्षा में कमी' : 'Wait Time Reduced'}
            </div>
            <div className="text-[11px] text-gray-500">
              {isHindi ? '12 घंटे से घटकर 45 मिनट' : 'From 12 hrs to ~45 mins'}
            </div>
          </div>

          <div className="text-center pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-[#1B5E3C]">₹2.4 Cr+</div>
            <div className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
              {isHindi ? 'DBT भुगतान वितरित' : 'Disbursed via DBT'}
            </div>
            <div className="text-[11px] text-gray-500">
              {isHindi ? 'सीधे किसानों के खातों में' : 'Direct bank credit within 48h'}
            </div>
          </div>

        </div>
      </section>

      {/* 3. How It Works (4 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {isHindi ? 'आसान प्रक्रिया' : 'Simple 4-Step Process'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            {isHindi ? 'किसानसेतु कैसे काम करता है?' : 'How KisanSetu Works'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {isHindi 
              ? 'पंजीकरण से लेकर बैंक में भुगतान आने तक का पारदर्शी सफर' 
              : 'From mobile booking to weighbridge token and direct bank deposit in 4 seamless steps.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 relative hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-gray-300 group-hover:text-[#1B5E3C] transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Why KisanSetu (Benefits Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF6EE] rounded-3xl p-6 sm:p-10 border border-[#E9E0CB]">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold text-[#1B5E3C] bg-emerald-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
              {isHindi ? 'मुख्य लाभ' : 'Why Choose KisanSetu'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {isHindi ? 'किसानों के लिए समय और सम्मान की बचत' : 'Solving Real Procurement Pain Points'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E3C] flex items-center justify-center border border-emerald-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {b.stat}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Nearby Centres Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {isHindi ? 'लाइव मंडियां' : 'Live Centres'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {isHindi ? 'उपलब्ध खरीद केंद्र' : 'Nearby Procurement Centres'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {isHindi 
                ? 'आज के उपलब्ध स्लॉट देखें और सीधे बुकिंग शुरू करें' 
                : "Check today's slot availability at a glance and book your arrival window"}
            </p>
          </div>

          <button
            onClick={onOpenLogin}
            className="text-xs font-bold text-[#1B5E3C] hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <span>{isHindi ? 'सभी केंद्र देखें' : 'View all centres'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {centres.map((centre) => {
            return (
              <div
                key={centre.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#1B5E3C] border border-emerald-200">
                      {centre.district}, {centre.state}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Cap: {centre.dailyCapacity}/day
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {centre.name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{centre.location}</span>
                  </p>

                  <div className="p-2.5 rounded-xl bg-gray-50 text-xs text-gray-700 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{isHindi ? 'समय:' : 'Hours:'}</span>
                      <span className="font-semibold">{centre.operationalHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{isHindi ? 'फसलें:' : 'Crops:'}</span>
                      <span className="font-semibold text-[#1B5E3C]">{centre.activeCrops.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`landing-book-${centre.id}`}
                  onClick={() => onSelectCentreAndBook(centre.id)}
                  className="w-full py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isHindi ? `स्लॉट बुक करें (${centre.name.split(' ')[0]})` : `Book Slot at ${centre.name.split(' ')[0]}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Bottom Banner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#1B5E3C] to-[#12422a] rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isHindi ? 'क्या आप आज अपनी फसल बेचने को तैयार हैं?' : 'Ready to Sell Your Crop Without Waiting?'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 max-w-xl">
              {isHindi 
                ? 'अभी अपना मोबाइल नंबर दर्ज करें, OTP सत्यापित करें और 2 मिनट में कतार टोकन प्राप्त करें।' 
                : 'Enter your registered mobile number, verify OTP, and receive your confirmed queue token in under 2 minutes.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              id="cta-bottom-login-btn"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm shadow-md transition-all cursor-pointer text-center"
            >
              {isHindi ? 'लॉगिन / स्लॉट बुक करें' : 'Login / Book Slot Now'}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
