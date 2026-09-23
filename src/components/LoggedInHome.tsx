import React from 'react';
import { 
  Calendar, 
  Compass, 
  History, 
  HelpCircle, 
  Clock, 
  MapPin, 
  QrCode, 
  CreditCard, 
  ArrowRight, 
  Bell, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  PlusCircle,
  Truck,
  MessageSquare
} from 'lucide-react';
import { FarmerProfile, Booking, CentreQueueState, NotificationItem, Language, ProcurementCentre } from '../types';
import { WelcomeBanner } from './WelcomeBanner';
import { DashboardStatCard } from './DashboardStatCard';
import { t } from '../i18n';

interface LoggedInHomeProps {
  farmer: FarmerProfile;
  booking: Booking | null;
  queueState: CentreQueueState;
  notifications: NotificationItem[];
  centres: ProcurementCentre[];
  language: Language;
  onNavigateTab: (tab: string) => void;
  onOpenGatePass: () => void;
  onOpenNotifications: () => void;
  onSelectCentreAndBook: (centreId: string) => void;
}

export const LoggedInHome: React.FC<LoggedInHomeProps> = ({
  farmer,
  booking,
  queueState,
  notifications,
  centres,
  language,
  onNavigateTab,
  onOpenGatePass,
  onOpenNotifications,
  onSelectCentreAndBook
}) => {
  const isHindi = language === 'hi';

  const tokenNumber = booking?.tokenNumber;
  const currentToken = queueState.currentServingToken;
  const tokensAhead = tokenNumber ? Math.max(0, tokenNumber - currentToken) : null;
  const estimatedWaitMins = tokensAhead !== null ? tokensAhead * queueState.averageMinutesPerToken : null;

  // Calculate days since registered
  const registeredDate = new Date(farmer.registeredDate || '2023-10-24');
  const now = new Date('2023-10-27'); // simulated current date
  const diffDays = Math.max(1, Math.round((now.getTime() - registeredDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Recent 2-3 notifications
  const recentNotifs = notifications.slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* 1. Cream Welcome Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <WelcomeBanner
          farmer={farmer}
          language={language}
          actions={(
            <button
              type="button"
              onClick={() => onNavigateTab('book-slot')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{isHindi ? 'स्लॉट बुक करें' : 'Book Procurement Slot'}</span>
            </button>
          )}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* 2. Quick Status Summary Row (4 Compact Stat Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <DashboardStatCard
            label={isHindi ? 'सक्रिय टोकन' : 'Active Token'}
            value={tokenNumber ? `#${tokenNumber}` : '—'}
            detail={currentToken ? `Serving: #${currentToken}` : 'No queue active'}
            icon={<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            onClick={() => onNavigateTab('track-status')}
          />
          <DashboardStatCard
            label={isHindi ? 'अगला स्लॉट' : 'Next Slot'}
            value={booking ? `${booking.date.split('-')[2]} Oct, ${booking.timeRange.split('–')[0].trim()}` : 'None'}
            detail={booking ? booking.centreName.split('(')[0] : 'Book a slot now'}
            icon={<Calendar className="w-3.5 h-3.5 text-amber-600" />}
            onClick={() => onNavigateTab('book-slot')}
          />
          <DashboardStatCard
            label={isHindi ? 'किसान पंजीकरण' : 'Registered Land'}
            value={<>{farmer.landAcres} <span className="text-xs font-normal text-gray-500">Acres</span></>}
            detail={`Reg ID: ${farmer.registrationNo.slice(-6)}`}
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => onNavigateTab('history')}
          />
          <DashboardStatCard
            label={isHindi ? 'डीबीटी भुगतान स्थिति' : 'DBT Payment'}
            value={booking?.paymentStatus === 'processed' ? '₹1,42,500' : 'Direct DBT'}
            detail={booking?.paymentStatus === 'processed' ? 'Transferred to Bank' : 'Aadhaar Account'}
            icon={<CreditCard className="w-3.5 h-3.5 text-purple-600" />}
            onClick={() => onNavigateTab('history')}
          />

        </div>

        {/* 2B. 3-Sided Marketplace Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-900 to-[#1B5E3C] text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                {isHindi ? '3-साइडेड कृषि बाज़ार' : 'Farmer Marketplace'}
              </span>
              <h3 className="text-lg font-bold text-white">
                {isHindi ? 'मेरी फसलें एवं लॉट लिस्टिंग' : 'My Harvested Crop Listings'}
              </h3>
              <p className="text-xs text-emerald-100 max-w-sm">
                {isHindi
                  ? 'अपनी फसल सीधे पंजीकृत व्यापारियों के सामने रखें और बोलियां प्राप्त करें।'
                  : 'List your harvested crops directly to licensed APMC buyers & track bids.'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('listings')}
              className="px-4 py-2 rounded-xl bg-white text-[#1B5E3C] hover:bg-emerald-50 text-xs font-bold shadow-xs cursor-pointer flex-shrink-0 transition-all ml-3"
            >
              {isHindi ? 'फसलें देखें' : 'View Lots'}
            </button>
          </div>

          <div className="bg-white border border-[#E7DFCD] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                {isHindi ? 'लाइव थोक भाव एवं मांग' : 'Market Intelligence'}
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                {isHindi ? 'बाज़ार मांग व मूल्य पूर्वानुमान' : 'Demand & Price Forecast'}
              </h3>
              <p className="text-xs text-gray-600 max-w-sm">
                {isHindi
                  ? `${farmer.district} मंडी में वर्तमान थोक भाव (Modal Price) और मांग सूचकांक देखें।`
                  : `Check modal prices, demand index, and next-week forecasts in ${farmer.district}.`}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('market-demand')}
              className="px-4 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EDE0] text-[#1B5E3C] border border-[#E7DFCD] text-xs font-bold shadow-xs cursor-pointer flex-shrink-0 transition-all ml-3"
            >
              {isHindi ? 'भाव देखें' : 'View Rates'}
            </button>
          </div>
        </div>

        {/* 3. Main Grid: Upcoming Booking (Left) & Recent Alerts / Quick Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Upcoming Booking Card (Condensed & Actionable) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {isHindi ? 'आपकी वर्तमान खरीद बुकिंग' : 'Upcoming Mandi Booking'}
                  </h2>
                </div>
                
                {booking && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1B5E3C] border border-emerald-200">
                    Token #{booking.tokenNumber}
                  </span>
                )}
              </div>

              {booking ? (
                <div className="space-y-4">
                  {/* Golden Ticket Header Box */}
                  <div className="bg-[#FAF6EE] rounded-xl p-4 border border-[#E9E0CB]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-[#1B5E3C]">
                          {booking.centreName}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Date: <strong className="text-gray-900">{booking.date}</strong> ({booking.timeRange})
                        </p>
                      </div>
                      <div className="text-right sm:text-right">
                        <span className="text-xs text-gray-500 block">Commodity</span>
                        <span className="text-sm font-bold text-gray-900">{booking.cropType} ({booking.estimatedQuantityQuintals} Qtl)</span>
                      </div>
                    </div>

                    {/* Vehicle and Mandi Gate */}
                    <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-xs text-gray-700">
                      <span>Vehicle: <strong className="font-mono text-gray-900">{booking.vehicleNo}</strong></span>
                      <span className="text-emerald-800 font-semibold">Entry: Gate 2 (Weighbridge)</span>
                    </div>
                  </div>

                  {/* Live Queue Mini-Tracker */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-600 block">Currently Serving:</span>
                      <strong className="text-sm text-gray-900">Token #{currentToken}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Farmers Ahead:</span>
                      <strong className="text-sm text-amber-700">{tokensAhead} vehicles</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Est. Wait:</span>
                      <strong className="text-sm text-[#1B5E3C]">{estimatedWaitMins} mins</strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      id="home-view-gatepass-btn"
                      onClick={onOpenGatePass}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#FAF6EE] hover:bg-[#F2EBDC] border border-[#DED1B7] text-gray-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-[#1B5E3C]" />
                      <span>{isHindi ? 'गेट पास QR देखें' : 'View Gate Pass QR'}</span>
                    </button>

                    <button
                      id="home-view-track-btn"
                      onClick={() => onNavigateTab('track-status')}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#1B5E3C] hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{isHindi ? 'लाइव स्थिति ट्रैक करें' : 'Track Live Queue'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {isHindi ? 'आपके पास कोई सक्रिय बुकिंग नहीं है' : 'No active procurement slot booked.'}
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {isHindi ? 'मंडी में अपनी बारी सुरक्षित करने के लिए अभी स्लॉट बुक करें।' : 'Reserve your arrival window to avoid standing in long road queues.'}
                  </p>
                  <button
                    onClick={() => onNavigateTab('book-slot')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1B5E3C] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-emerald-800"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isHindi ? 'नया स्लॉट बुक करें' : 'Book a Slot Now'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions (4 Large Tappable Buttons) */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider text-gray-500">
                {isHindi ? 'त्वरित कार्य' : 'Quick Actions'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  id="quick-action-book"
                  onClick={() => onNavigateTab('book-slot')}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-emerald-300 text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1B5E3C] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                    {isHindi ? 'स्लॉट बुक करें' : 'Book Slot'}
                  </span>
                  <span className="text-[11px] text-gray-400">APMC Mandi</span>
                </button>

                <button
                  id="quick-action-track"
                  onClick={() => onNavigateTab('track-status')}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-emerald-300 text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                    {isHindi ? 'स्थिति जांचें' : 'Track Status'}
                  </span>
                  <span className="text-[11px] text-gray-400">Live Token</span>
                </button>

                <button
                  id="quick-action-history"
                  onClick={() => onNavigateTab('history')}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-emerald-300 text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                    {isHindi ? 'मेरी बुकिंग' : 'My Bookings'}
                  </span>
                  <span className="text-[11px] text-gray-400">J-Forms &amp; DBT</span>
                </button>

                <button
                  id="quick-action-help"
                  onClick={() => onNavigateTab('help')}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-emerald-300 text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                    {isHindi ? 'सहायता' : 'Mandi Help'}
                  </span>
                  <span className="text-[11px] text-gray-400">1800-180-1551</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Recent Alerts & Nearby Mandis */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Recent Notifications Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-gray-900">
                    {isHindi ? 'हाल के SMS व सूचनाएं' : 'Recent SMS & Alerts'}
                  </h3>
                </div>
                <button
                  id="home-view-all-alerts-btn"
                  onClick={onOpenNotifications}
                  className="text-xs font-bold text-[#1B5E3C] hover:underline cursor-pointer"
                >
                  {isHindi ? 'सभी देखें' : 'View All'} ({notifications.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {recentNotifs.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No alerts logged</p>
                ) : (
                  recentNotifs.map((notif) => {
                    const isSms = notif.channel === 'sms';
                    return (
                      <div
                        key={notif.id}
                        className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 flex items-center gap-1.5">
                            {isSms && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-[#1B5E3C] font-semibold">
                                SMS
                              </span>
                            )}
                            {isHindi ? notif.titleHi || notif.title : notif.title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                          {isHindi ? notif.messageHi || notif.message : notif.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nearby Mandi Capacity Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-gray-900">
                    {isHindi ? 'मंडी उपलब्धता' : 'Mandi Slot Availability'}
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('book-slot')}
                  className="text-xs font-bold text-[#1B5E3C] hover:underline"
                >
                  {isHindi ? 'कैलेंडर देखें' : 'View Calendar'}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {centres.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-[11px] text-gray-500">{c.activeCrops.slice(0, 2).join(', ')}</div>
                    </div>
                    <button
                      id={`home-book-centre-${c.id}`}
                      onClick={() => onSelectCentreAndBook(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-[#1B5E3C] font-bold text-xs transition-colors cursor-pointer"
                    >
                      {isHindi ? 'स्लॉट चुनें' : 'Book'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
