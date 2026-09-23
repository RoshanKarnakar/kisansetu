import React, { useState } from 'react';
import { 
  HelpCircle, 
  PhoneCall, 
  FileText, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Language } from '../types';
import { DashboardHero } from './DashboardHero';

interface HelpFaqViewProps {
  language: Language;
}

export const HelpFaqView: React.FC<HelpFaqViewProps> = ({ language }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the KisanSetu queue token system work?',
      qHi: 'किसानसेतु कतार टोकन प्रणाली कैसे काम करती है?',
      a: 'When you book a slot, you are assigned a sequential daily token number. The digital dashboard tracks the token currently being served at the weighbridge. An estimated wait time is calculated based on vehicle throughput, and automated SMS alerts notify you when your token is within 3 places, so you can arrive on time without waiting in long road queues.',
      aHi: 'जब आप स्लॉट बुक करते हैं, तो आपको एक दैनिक टोकन नंबर मिलता है। डिजिटल डैशबोर्ड वेईब्रिज पर वर्तमान टोकन को ट्रैक करता है। जब आपका टोकन 3 स्थान दूर होता है, तो आपको स्वचालित SMS मिलता है ताकि आप लंबी सड़क कतारों में खड़े बिना समय पर पहुंच सकें।'
    },
    {
      q: 'What documents do I need to bring to the procurement centre?',
      qHi: 'खरीद केंद्र पर मुझे कौन से दस्तावेज़ लाने होंगे?',
      a: '1. Original Aadhaar Card of the registered farmer.\n2. Land ownership record / Meri Fasal Mera Byora registration slip.\n3. Vehicle / Tractor Trolley Registration Certificate (RC).\n4. Mobile phone with the SMS or Digital Gate Pass QR code.',
      aHi: '1. पंजीकृत किसान का मूल आधार कार्ड।\n2. भूमि स्वामित्व रिकॉर्ड / मेरी फसल मेरा ब्योरा पर्ची।\n3. वाहन / ट्रैक्टर ट्रॉली पंजीकरण प्रमाणपत्र (RC)।\n4. मोबाइल फोन जिसमें SMS या डिजिटल गेट पास QR कोड हो।'
    },
    {
      q: 'When and how will my procurement payment be deposited?',
      qHi: 'मेरी खरीद का भुगतान कब और कैसे जमा होगा?',
      a: 'Payment is disbursed directly to your Aadhaar-linked bank account via Direct Benefit Transfer (DBT / PFMS) within 24 to 48 hours of electronic weight sign-off and J-Form generation. You will receive an SMS confirmation from PFMS-GOV with transaction reference.',
      aHi: 'इलेक्ट्रॉनिक वजन सत्यापन और जे-फॉर्म जारी होने के 24 से 48 घंटों के भीतर प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से आपके आधार-लिंक्ड बैंक खाते में सीधे भुगतान जमा किया जाता है।'
    },
    {
      q: 'Can I reschedule or cancel my procurement slot?',
      qHi: 'क्या मैं अपने खरीद स्लॉट को पुनर्निर्धारित या रद्द कर सकता हूँ?',
      a: 'Yes, you can cancel your active booking from the "My Bookings" page up to 2 hours before the scheduled time slot. Once cancelled, the slot is immediately released to other waiting farmers and you can book an alternate date.',
      aHi: 'हाँ, आप निर्धारित समय स्लॉट से 2 घंटे पहले तक "मेरी बुकिंग" पृष्ठ से अपनी सक्रिय बुकिंग रद्द कर सकते हैं और नया स्लॉट चुन सकते हैं।'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      <DashboardHero
        badge={<span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-[#1B5E3C]" /> Farmer Support</span>}
        title={language === 'hi' ? 'किसान सहायता केंद्र एवं दिशानिर्देश' : 'Farmer Support & Mandi Guidelines'}
        subtitle="Toll-free procurement assistance, required documents, and frequently asked questions for Haryana Mandis."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <PhoneCall className="w-4 h-4 text-emerald-700" />
          <div><span className="text-gray-500 block text-[11px]">Toll-Free Kisan Mandi Helpline</span><a href="tel:18001801551" className="text-sm font-bold text-[#1B5E3C]">1800-180-1551 (08 AM – 08 PM)</a></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <div><span className="text-gray-500 block text-[11px]">Karnal APMC Control Room</span><span className="text-sm font-bold text-gray-900">Gate 2, Sector 6, Mandi Yard</span></div>
        </div>
      </div>
      {/* Help details */}
      {false && <div className="bg-[#1B5E3C] text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-6 h-6 text-amber-300" />
          <h1 className="text-2xl font-bold tracking-tight">
            {language === 'hi' ? 'किसान सहायता केंद्र एवं दिशानिर्देश' : 'Farmer Support & Mandi Guidelines'}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-emerald-100">
          Toll-free procurement assistance, required documents, and frequently asked questions for Haryana Mandis.
        </p>

        {/* Helplines Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-emerald-700/60 text-xs">
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-bold">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">Toll-Free Kisan Mandi Helpline</span>
              <a href="tel:18001801551" className="text-sm font-bold text-white hover:underline">
                1800-180-1551 (08 AM – 08 PM)
              </a>
            </div>
          </div>

          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">Karnal APMC Control Room</span>
              <span className="text-sm font-bold text-white">
                Gate 2, Sector 6, Mandi Yard
              </span>
            </div>
          </div>
        </div>
      </div>}

      {/* Required Documents Checklist */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1B5E3C]" />
          <span>Mandatory Checklist Before Leaving For Mandi</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 pt-2">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <strong className="text-gray-900 block mb-1">1. Moisture &amp; Grain Specs</strong>
            Grain moisture must be below 12% for Wheat and 17% for Paddy to ensure instant approval without drying delays.
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <strong className="text-gray-900 block mb-1">2. Vehicle Cleaning &amp; Tarpaulin</strong>
            Keep vehicle trolley covered with clean tarpaulin to prevent spillage and protect from unexpected rain.
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <strong className="text-gray-900 block mb-1">3. Bank Account Active for DBT</strong>
            Ensure your bank account is active with NPCI Aadhaar-seeding enabled for instant transfer.
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <strong className="text-gray-900 block mb-1">4. Gate Pass QR Ready</strong>
            Save or print your digital gate pass for rapid scanning at the boom barrier.
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Frequently Asked Questions (FAQ)
        </h2>

        <div className="space-y-2">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 bg-white hover:bg-gray-50 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-gray-900 cursor-pointer"
                >
                  <span>{language === 'hi' ? item.qHi : item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 bg-gray-50/70 text-xs sm:text-sm text-gray-600 border-t border-gray-100 whitespace-pre-line leading-relaxed">
                    {language === 'hi' ? item.aHi : item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
