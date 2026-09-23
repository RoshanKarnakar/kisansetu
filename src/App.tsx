import React, { useState, useEffect, useCallback } from 'react';
import { 
  ProcurementCentre, 
  TimeSlot, 
  FarmerProfile, 
  Booking, 
  CentreQueueState, 
  NotificationItem, 
  Language, 
  UserRole 
} from './types';
import { api } from './api';
import { Header } from './components/Header';
import { WelcomeBanner } from './components/WelcomeBanner';
import { BookSlotCard } from './components/BookSlotCard';
import { RightColumnCards } from './components/RightColumnCards';
import { TrackStatusView } from './components/TrackStatusView';
import { BookingHistoryView } from './components/BookingHistoryView';
import { AdminQueueView } from './components/AdminQueueView';
import { HelpFaqView } from './components/HelpFaqView';
import { ConfirmBookingModal } from './components/ConfirmBookingModal';
import { GatePassModal } from './components/GatePassModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PublicLandingHome } from './components/PublicLandingHome';
import { LoggedInHome } from './components/LoggedInHome';
import { AuthScreen } from './components/AuthScreen';
import { FarmerListingsView } from './components/FarmerListingsView';
import { MarketDemandView } from './components/MarketDemandView';
import { BuyerDashboard, BuyerNavTab } from './components/buyer/BuyerDashboard';
import { FarmerTransactionsView } from './components/FarmerTransactionsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChatModal } from './components/ChatModal';
import { CallBuyerModal } from './components/CallBuyerModal';
import { DashboardStatCard } from './components/DashboardStatCard';
import { supabase } from './lib/supabaseClient';
import {
  getFarmerRecord,
  getProcurementCentres,
  getProcurementSlots,
  getFarmerBookings,
  getCentreBookings,
  getCentreQueueState,
  getUserNotifications,
  bookProcurementSlot,
  cancelFarmerBooking,
  updateFarmerBooking,
  markUserNotificationsRead,
  advanceCentreQueue,
  subscribeToQueueState,
} from './lib/supabaseService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [language, setLanguage] = useState<Language>('en');

  const [role, setRole] = useState<UserRole>('farmer');

  // Active logged-in farmer
  const [farmer, setFarmer] = useState<FarmerProfile>({
      id: 'farmer-rakesh',
      name: 'Rakesh Singh',
      nameHi: 'राकेश सिंह',
      phone: '9876543210',
      village: 'Taraori',
      district: 'Karnal',
      state: 'Haryana',
      landAcres: 6.5,
      registrationNo: 'KS-HR-2023-8842',
      registeredDate: '2023-10-24',
      bankAccountMasked: 'HDFC Bank (•••• 4812)',
      preferredCrops: ['Wheat', 'Paddy (Basmati)']
  });

  // Navigation: unauthenticated visitors land directly on 'login'
  const [currentTab, setCurrentTab] = useState<string>('login');

  // Centres and slots data
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('karnal-main');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Queue state (Default matching screenshot: Current Token #19)
  const [queueState, setQueueState] = useState<CentreQueueState>({
    centreId: 'centre-karnal-apmc',
    date: '2023-10-27',
    currentServingToken: 19,
    totalTokensIssued: 28,
    averageMinutesPerToken: 3,
    counterStatus: 'active',
    lastUpdated: new Date().toISOString()
  });

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [gatePassModalOpen, setGatePassModalOpen] = useState(false);
  const [gatePassBooking, setGatePassBooking] = useState<Booking | null>(null);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Buyer Communication Modals for confirmed bookings
  const [buyerChatModalOpen, setBuyerChatModalOpen] = useState(false);
  const [buyerCallModalOpen, setBuyerCallModalOpen] = useState(false);
  const [activeBuyerContact, setActiveBuyerContact] = useState<{
    company_name: string;
    contact_person: string;
    phone: string;
    trade_license_no?: string;
    reliability_score?: number;
  } | null>(null);
  const [activeChatPartner, setActiveChatPartner] = useState<{
    id: string;
    name: string;
    phone?: string;
    bookingId?: string;
  } | null>(null);

  // Load initial centres & data
  useEffect(() => {
    async function init() {
      try {
        const fetchedCentres = await getProcurementCentres();
        if (fetchedCentres.length > 0) {
          setCentres(fetchedCentres);
          if (!selectedCentreId) {
            setSelectedCentreId(fetchedCentres[0].id);
          }
        }

        const fetchedBookings = role === 'admin' || role === 'staff'
          ? await getCentreBookings(selectedCentreId, selectedDate)
          : await getFarmerBookings(farmer.id);
        setBookings(fetchedBookings);

        // Find primary booking for Rakesh Singh (Token #24)
        const primary = fetchedBookings.find(
          b => b.farmerId === farmer.id && b.status !== 'cancelled'
        );
        if (primary) {
          setCurrentBooking(primary);
        }

        const fetchedNotifs = await getUserNotifications(farmer.id);
        setNotifications(fetchedNotifs);
      } catch (err) {
        console.error('Initialization error', err);
      }
    }
    init();
  }, [farmer.id, role, selectedCentreId, selectedDate]);

  // Load slots when centre or date changes
  useEffect(() => {
    async function loadSlots() {
      if (!selectedCentreId || !selectedDate) return;
      try {
        const fetchedSlots = await getProcurementSlots(selectedCentreId, selectedDate);
        setSlots(fetchedSlots);
        if (fetchedSlots.length > 0) {
          setSelectedSlotId(fetchedSlots[0].id);
        }
      } catch (err) {
        console.error('loadSlots error', err);
      }
    }
    loadSlots();
  }, [selectedCentreId, selectedDate]);

  // Refresh queue status for selected centre
  const refreshQueue = useCallback(async () => {
    if (!selectedCentreId) return;
    try {
      const q = await getCentreQueueState(selectedCentreId, selectedDate);
      setQueueState(q);
    } catch (err) {
      console.error('refreshQueue error', err);
    }
  }, [selectedCentreId, selectedDate]);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (!selectedCentreId || !selectedDate) return;
    return subscribeToQueueState(selectedCentreId, selectedDate, setQueueState);
  }, [selectedCentreId, selectedDate]);

  // Show quick toast notification
  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Route Guard: enforce that unauthenticated visitors only access 'login' or 'about', unless accessing admin or buyer portal
  const handleNavigate = useCallback((tab: string) => {
    if (!isLoggedIn) {
      if (tab === 'about') {
        setCurrentTab('about');
        return;
      }
      setCurrentTab('login');
      return;
    }

    if (tab === 'login') {
      setCurrentTab('home');
      return;
    }

    setCurrentTab(tab);
  }, [isLoggedIn]);

  // Route guard effect: if user is not logged in and attempts to access protected routes, redirect to login
  useEffect(() => {
    if (!isLoggedIn && currentTab !== 'login' && currentTab !== 'about') {
      setCurrentTab('login');
    }
  }, [isLoggedIn, currentTab]);

  // Authentication Handlers
  const handleLoginSuccess = useCallback((loggedFarmer: FarmerProfile, newRole: UserRole) => {
    setFarmer(loggedFarmer);
    setRole(newRole);
    setIsLoggedIn(true);

    if (newRole === 'staff' || newRole === 'admin') {
      setCurrentTab('admin-dashboard');
    } else if (newRole === 'buyer') {
      setCurrentTab('buyer-home');
    } else {
      setCurrentTab('home');
    }

    triggerToast(`Welcome back, ${loggedFarmer.name}! Verified via Mobile OTP.`);
  }, [triggerToast]);

  const handleLogout = useCallback(() => {
    void supabase.auth.signOut();
    setIsLoggedIn(false);
    // Redirect directly to the Login/Register page
    setCurrentTab('login');
    triggerToast('Logged out successfully');
  }, [triggerToast]);

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session?.user) {
        setAuthReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      const sessionRole = (profile?.role || 'farmer') as UserRole;
      const loggedFarmer = sessionRole === 'farmer'
        ? await getFarmerRecord(session.user.id)
        : null;

      if (loggedFarmer) {
        handleLoginSuccess({ ...loggedFarmer, phone: session.user.phone || loggedFarmer.phone }, sessionRole);
      } else {
        setRole(sessionRole);
        setIsLoggedIn(true);
        setCurrentTab(sessionRole === 'buyer' ? 'buyer-home' : sessionRole === 'admin' || sessionRole === 'staff' ? 'admin-dashboard' : 'home');
      }
      setAuthReady(true);
    };

    hydrateSession().catch((error) => {
      console.error('Failed to restore Supabase session:', error);
      if (mounted) setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) {
        setIsLoggedIn(false);
        setCurrentTab('login');
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [handleLoginSuccess]);

  // Simulate Mandi staff advancing next token
  const handleSimulateAdvance = async () => {
    setIsSimulating(true);
    try {
      const queue = await advanceCentreQueue(selectedCentreId, selectedDate);
      if (queue) {
        setQueueState(queue);
        
        // Refresh bookings and notifications
        const fetchedBookings = role === 'admin' || role === 'staff'
          ? await getCentreBookings(selectedCentreId, selectedDate)
          : await getFarmerBookings(farmer.id);
        setBookings(fetchedBookings);
        const myB = fetchedBookings.find(b => b.farmerId === farmer.id && b.status !== 'cancelled');
        if (myB) setCurrentBooking(myB);

        const fetchedNotifs = await getUserNotifications(farmer.id);
        setNotifications(fetchedNotifs);

        triggerToast(`Mandi token advanced to #${queue.currentServingToken}. Live queue updated.`);
      }
    } catch (err) {
      console.error('Advance error', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset queue for demo
  const handleResetQueue = async () => {
    try {
      await api.resetQueue(selectedCentreId, selectedDate);
      await refreshQueue();
      triggerToast('Queue reset to Token #19 for demo.');
    } catch (err) {
      console.error('Reset error', err);
    }
  };

  // Create booking
  const handleConfirmBooking = async (data: {
    cropType: string;
    estimatedQuantityQuintals: number;
    vehicleNo: string;
  }) => {
    if (!selectedSlotId) return;
    const booking = await bookProcurementSlot({
      farmerId: farmer.id,
      centreId: selectedCentreId,
      date: selectedDate,
      slotId: selectedSlotId,
      cropType: data.cropType,
      estimatedQuantityQuintals: data.estimatedQuantityQuintals,
      vehicleNo: data.vehicleNo,
      mspRatePerQuintal: 0,
    });

    if (booking) {
      setCurrentBooking(booking);
      
      // Update local slots count
      setSlots(prev => prev.map(s => {
        if (s.id === selectedSlotId) {
          return {
            ...s,
            bookedCount: s.bookedCount + 1,
            remainingSlots: Math.max(0, s.remainingSlots - 1)
          };
        }
        return s;
      }));

      // Refresh bookings and notifications
      const fetchedBookings = await getFarmerBookings(farmer.id);
      setBookings(fetchedBookings);
      const fetchedNotifs = await getUserNotifications(farmer.id);
      setNotifications(fetchedNotifs);

      triggerToast(`Booking confirmed. Your assigned token is #${booking.tokenNumber}.`);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelFarmerBooking(bookingId);
      const fetchedBookings = await getFarmerBookings(farmer.id);
      setBookings(fetchedBookings);
      if (currentBooking?.id === bookingId) {
        const nextActive = fetchedBookings.find(b => b.farmerId === farmer.id && b.status !== 'cancelled');
        setCurrentBooking(nextActive || null);
      }
      triggerToast('Booking cancelled successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  // Update booking status (for staff admin or testing)
  const handleUpdateBookingStatus = async (bookingId: string, updates: any) => {
    try {
      const booking = await updateFarmerBooking(bookingId, updates);
      if (booking) {
        const fetchedBookings = role === 'admin' || role === 'staff'
          ? await getCentreBookings(selectedCentreId, selectedDate)
          : await getFarmerBookings(farmer.id);
        setBookings(fetchedBookings);
        if (currentBooking?.id === bookingId) {
          setCurrentBooking(booking);
        }
        const fetchedNotifs = await getUserNotifications(farmer.id);
        setNotifications(fetchedNotifs);
        triggerToast(`Updated booking status to: ${booking.status}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Mark all notifications read
  const handleMarkNotificationsRead = async () => {
    await markUserNotificationsRead(farmer.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const currentSelectedCentre = centres.find(c => c.id === selectedCentreId) || centres[0] || {
    id: 'centre-karnal-apmc',
    name: 'Karnal APMC (Sector 6)',
    location: 'Sector 6, Karnal',
    district: 'Karnal',
    state: 'Haryana',
    gates: ['Gate 1', 'Gate 2'],
    activeCrops: ['Wheat', 'Paddy', 'Mustard'],
    operationalHours: '08:00 AM – 06:00 PM',
    contactPhone: '+91 184 225 4310',
    dailyCapacity: 60
  };

  // If not logged in and on the login/register tab, render the dedicated AuthScreen directly
  if (!isLoggedIn && (currentTab === 'login' || currentTab === 'register')) {
    return (
      <div className="min-h-screen bg-[#F4F6F3] text-gray-900 font-sans">
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-gray-900 text-white p-3.5 rounded-xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 animate-in slide-in-from-bottom-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 animate-ping" />
            <div className="text-xs">
              <span className="font-bold block text-emerald-300">Portal Update</span>
              <p className="mt-0.5 text-gray-200">{toastMessage}</p>
            </div>
          </div>
        )}

        <AuthScreen
          initialMode={currentTab === 'register' ? 'register' : 'login'}
          language={language}
          onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToAbout={() => handleNavigate('about')}
        />
      </div>
    );
  }

  const getBuyerNavTab = (tab: string): BuyerNavTab => {
    if (tab === 'buyer-market') return 'market-overview';
    if (tab === 'buyer-crops') return 'available-crops';
    if (tab === 'buyer-bids') return 'my-bids';
    if (tab === 'buyer-transactions') return 'transactions';
    if (tab === 'buyer-reliability') return 'reliability';
    if (tab === 'buyer-profile') return 'profile';
    return 'home';
  };

  const handleBuyerTabChange = (btab: BuyerNavTab) => {
    const tabMap: Record<BuyerNavTab, string> = {
      'home': 'buyer-home',
      'market-overview': 'buyer-market',
      'available-crops': 'buyer-crops',
      'my-bids': 'buyer-bids',
      'transactions': 'buyer-transactions',
      'reliability': 'buyer-reliability',
      'profile': 'buyer-profile',
    };
    setCurrentTab(tabMap[btab] || 'buyer-home');
  };

  const isBuyerMode = role === 'buyer' || currentTab.startsWith('buyer-');
  const isAdminMode = role === 'admin' || role === 'staff' || currentTab.startsWith('admin-');

  return (
    <div className="min-h-screen bg-[#F4F6F3] text-gray-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Toast Notification for SMS Alerts */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-gray-900 text-white p-3.5 rounded-xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 animate-in slide-in-from-bottom-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 animate-ping" />
          <div className="text-xs">
            <span className="font-bold block text-emerald-300">Live Alert Update</span>
            <p className="mt-0.5 text-gray-200">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Header matching screenshot */}
      <Header
        currentTab={currentTab}
        onTabChange={handleNavigate}
        language={language}
        onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
        farmer={farmer}
        role={role}
        onSwitchRole={(r) => {
          setRole(r);
          setIsLoggedIn(true);
          if (r === 'admin' || r === 'staff') {
            setCurrentTab('admin-dashboard');
          } else if (r === 'buyer') {
            setCurrentTab('buyer-home');
          } else {
            setCurrentTab('home');
          }
        }}
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setNotifDrawerOpen(true)}
        onOpenLogin={() => handleNavigate('login')}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        
        {/* VIEW: ADMIN DASHBOARD (Procurement Day Flow) */}
        {isAdminMode && (
          <AdminDashboard
              centre={currentSelectedCentre}
              queueState={queueState}
              bookings={bookings}
              onAdvanceQueue={handleSimulateAdvance}
              onResetQueue={handleResetQueue}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              language={language}
              isSimulating={isSimulating}
              activeTab={
                currentTab === 'admin-queue'
                  ? 'queue'
                  : currentTab === 'admin-priority'
                  ? 'priority'
                  : currentTab === 'admin-procurement'
                  ? 'procurement'
                  : currentTab === 'admin-payments'
                  ? 'payments'
                  : 'overview'
              }
              onTabChange={(adminTab) => {
                if (adminTab === 'overview') handleNavigate('admin-dashboard');
                else if (adminTab === 'queue') handleNavigate('admin-queue');
                else if (adminTab === 'priority') handleNavigate('admin-priority');
                else if (adminTab === 'procurement') handleNavigate('admin-procurement');
                else if (adminTab === 'payments') handleNavigate('admin-payments');
              }}
          />
        )}

        {/* VIEW: BUYER PORTAL DASHBOARD */}
        {!isAdminMode && isBuyerMode && (
          <BuyerDashboard
            currentTab={getBuyerNavTab(currentTab)}
            onTabChange={handleBuyerTabChange}
            language={language}
            onSwitchToFarmer={() => {
              setRole('farmer');
              setCurrentTab('home');
            }}
          />
        )}

        {/* VIEW 0: HOME PAGE (Overview Dashboard for authenticated farmer) */}
        {!isAdminMode && !isBuyerMode && currentTab === 'home' && (
          <LoggedInHome
            farmer={farmer}
            booking={currentBooking}
            queueState={queueState}
            notifications={notifications}
            centres={centres}
            language={language}
            onNavigateTab={handleNavigate}
            onOpenGatePass={() => {
              setGatePassBooking(currentBooking);
              setGatePassModalOpen(true);
            }}
            onOpenNotifications={() => setNotifDrawerOpen(true)}
            onSelectCentreAndBook={(cid) => {
              setSelectedCentreId(cid);
              handleNavigate('book-slot');
            }}
          />
        )}

        {/* VIEW 0B: OPTIONAL PUBLIC MARKETING INFO PAGE */}
        {!isAdminMode && !isBuyerMode && currentTab === 'about' && (
          <PublicLandingHome
            language={language}
            onOpenLogin={() => handleNavigate('login')}
            onOpenRegister={() => handleNavigate('login')}
            centres={centres}
            onSelectCentreAndBook={(cid) => {
              setSelectedCentreId(cid);
              handleNavigate('login');
            }}
            onBackToLogin={() => handleNavigate(isLoggedIn ? 'home' : 'login')}
          />
        )}

        {/* VIEW 1A: MY CROPS / HARVEST LISTINGS (3-Sided Marketplace Farmer App) */}
        {!isAdminMode && !isBuyerMode && currentTab === 'listings' && (
          <FarmerListingsView
            farmer={farmer}
            language={language}
            onNavigateToMarket={() => handleNavigate('market-demand')}
            onNavigateToSlotBooking={(cropId) => {
              handleNavigate('book-slot');
            }}
          />
        )}

        {/* VIEW 1B: MARKET DEMAND & PRICE INTELLIGENCE (Supabase crop_market_data) */}
        {!isAdminMode && !isBuyerMode && currentTab === 'market-demand' && (
          <MarketDemandView
            farmer={farmer}
            language={language}
            onNavigateToListings={() => handleNavigate('listings')}
            onNavigateToSlotBooking={(cropId) => {
              handleNavigate('book-slot');
            }}
          />
        )}

        {/* VIEW 1: FARMER DASHBOARD / BOOK SLOT (Dedicated Slot Booking Workspace) */}
        {!isAdminMode && !isBuyerMode && currentTab === 'book-slot' && (
          <div>
            {/* Welcome Banner matching screenshot */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <WelcomeBanner 
                farmer={farmer} 
                language={language} 
                actions={(
                  <button
                    type="button"
                    onClick={() => setConfirmModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B5E3C] hover:bg-[#14472d] text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Book Procurement Slot</span>
                  </button>
                )}
              />
            </div>

            {/* Two-Column Grid: Left Card (Book Slot) & Right Stacked Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <DashboardStatCard label="Selected Centre" value={currentSelectedCentre.name.split(' (')[0]} detail={currentSelectedCentre.district} />
                <DashboardStatCard label="Available Slots" value={slots.reduce((sum, slot) => sum + slot.remainingSlots, 0)} detail="Across selected day" />
                <DashboardStatCard label="Selected Date" value={selectedDate} detail="Procurement date" />
                <DashboardStatCard label="Booking Status" value={currentBooking ? 'Active' : 'Open'} detail={currentBooking ? `Token #${currentBooking.tokenNumber}` : 'Ready to reserve'} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Book Your Procurement Slot Card */}
                <div className="lg:col-span-6 xl:col-span-6">
                  <BookSlotCard
                    centres={centres}
                    selectedCentreId={selectedCentreId}
                    onSelectCentre={(cid) => setSelectedCentreId(cid)}
                    selectedDate={selectedDate}
                    onSelectDate={(d) => setSelectedDate(d)}
                    slots={slots}
                    selectedSlotId={selectedSlotId}
                    onSelectSlot={(sid) => setSelectedSlotId(sid)}
                    onOpenBookingModal={() => setConfirmModalOpen(true)}
                    language={language}
                    hasActiveBooking={!!currentBooking}
                  />
                </div>

                {/* Right Column: Stacked Cards matching screenshot */}
                <div className="lg:col-span-6 xl:col-span-6">
                  <RightColumnCards
                    currentBooking={currentBooking}
                    queueState={queueState}
                    language={language}
                    onOpenGatePass={() => {
                      setGatePassBooking(currentBooking);
                      setGatePassModalOpen(true);
                    }}
                    onSimulateNextToken={handleSimulateAdvance}
                    onNavigateToTrack={() => setCurrentTab('track-status')}
                    isSimulating={isSimulating}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TRACK STATUS VIEW */}
        {!isAdminMode && !isBuyerMode && currentTab === 'track-status' && (
          <TrackStatusView
            booking={currentBooking}
            queueState={queueState}
            farmer={farmer}
            language={language}
            onOpenGatePass={() => {
              setGatePassBooking(currentBooking);
              setGatePassModalOpen(true);
            }}
            onSimulateAdvance={handleSimulateAdvance}
            isSimulating={isSimulating}
            onViewTransactions={() => handleNavigate('transactions')}
          />
        )}

        {/* VIEW 2B: FARMER APMC TRANSACTIONS & DBT RECEIPTS */}
        {!isAdminMode && !isBuyerMode && currentTab === 'transactions' && (
          <FarmerTransactionsView
            farmer={farmer}
            language={language}
            onOpenGatePass={(b) => {
              setGatePassBooking(b);
              setGatePassModalOpen(true);
            }}
          />
        )}

        {/* VIEW 3: BOOKING HISTORY & J-FORMS */}
        {!isAdminMode && !isBuyerMode && currentTab === 'history' && (
          <BookingHistoryView
            bookings={bookings}
            language={language}
            onSelectBookingToTrack={(b) => {
              setCurrentBooking(b);
              setCurrentTab('track-status');
            }}
            onOpenGatePass={(b) => {
              setGatePassBooking(b);
              setGatePassModalOpen(true);
            }}
            onCancelBooking={handleCancelBooking}
            onNavigateToBook={() => setCurrentTab('book-slot')}
            onCallBuyer={(b) => {
              setActiveBuyerContact({
                company_name: 'Haryana Agro Millers Ltd.',
                contact_person: 'Shri Vikram Malhotra',
                phone: '+91 98120 44512',
                trade_license_no: 'HR-APMC-BUY-2023-4109',
                reliability_score: 98,
              });
              setBuyerCallModalOpen(true);
            }}
            onOpenChat={(b) => {
              setActiveChatPartner({
                id: 'buyer-agro-procure',
                name: 'Haryana Agro Millers Ltd.',
                phone: '+91 98120 44512',
                bookingId: String(b.tokenNumber),
              });
              setBuyerChatModalOpen(true);
            }}
          />
        )}

        {/* VIEW 5: HELP & FAQ */}
        {!isAdminMode && !isBuyerMode && currentTab === 'help' && (
          <HelpFaqView language={language} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1B5E3C]">KisanSetu (किसानसेतु)</span>
            <span>·</span>
            <span>Digital Mandi Queue &amp; Procurement Management</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Haryana APMC Kharif/Rabi Procurement</span>
            <span>·</span>
            <span>Toll-Free: 1800-180-1551</span>
          </div>
        </div>
      </footer>

      {/* Confirm Booking Modal */}
      <ConfirmBookingModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        centre={currentSelectedCentre}
        dateStr={selectedDate}
        slot={slots.find(s => s.id === selectedSlotId) || slots[0] || null}
        farmer={farmer}
        language={language}
        onConfirm={handleConfirmBooking}
      />

      {/* Gate Pass QR Modal */}
      <GatePassModal
        isOpen={gatePassModalOpen}
        onClose={() => setGatePassModalOpen(false)}
        booking={gatePassBooking || currentBooking}
        farmer={farmer}
        language={language}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkNotificationsRead}
        language={language}
      />

      {/* Buyer Chat Modal from Bookings */}
      {activeChatPartner && (
        <ChatModal
          isOpen={buyerChatModalOpen}
          onClose={() => setBuyerChatModalOpen(false)}
          bookingId={activeChatPartner.bookingId}
          farmerId={farmer.id}
          farmerName={farmer.name}
          buyerId={activeChatPartner.id}
          buyerName={activeChatPartner.name}
          buyerPhone={activeChatPartner.phone}
          currentUserRole="farmer"
          language={language}
          onCallBuyer={() => {
            setActiveBuyerContact({
              company_name: activeChatPartner.name,
              contact_person: activeChatPartner.name,
              phone: activeChatPartner.phone || '+91 98120 44512',
            });
            setBuyerCallModalOpen(true);
          }}
        />
      )}

      {/* Buyer Call Modal from Bookings */}
      {activeBuyerContact && (
        <CallBuyerModal
          isOpen={buyerCallModalOpen}
          onClose={() => setBuyerCallModalOpen(false)}
          buyer={activeBuyerContact}
          language={language}
        />
      )}

    </div>
  );
}
