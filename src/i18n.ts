import { Language } from './types';

export const translations = {
  en: {
    appTitle: 'KisanSetu',
    appTagline: "Farmer's Bridge to Mandi",
    navHome: 'Home',
    navBookSlot: 'Book Slot',
    navTrackStatus: 'Track Status',
    navHistory: 'My Bookings',
    navHelp: 'Help',
    navStaffAdmin: 'Mandi Staff Portal',
    searchPlaceholder: 'Search centres, crops, bookings...',
    
    // Welcome Banner
    welcomeGreeting: 'Welcome to KisanSetu, {name}!',
    welcomeSubtitle: 'Secure Your Procurement Slot Effortlessly.',
    
    // Booking Card
    bookSlotTitle: 'Book Your Procurement Slot',
    selectCentre: 'Select Centre:',
    availableSlotsFor: 'Available slots for {date}',
    slotsCount: '{count} slots',
    bookButton: 'Book {date}, {time}',
    bookingModalTitle: 'Confirm Slot Booking',
    selectCrop: 'Select Crop',
    cropQuantity: 'Estimated Quantity (Quintals)',
    vehicleNumber: 'Vehicle Number (e.g. HR 05 AB 1234)',
    confirmBooking: 'Confirm & Generate Token',
    cancel: 'Cancel',
    bookingSuccess: 'Slot Booked Successfully! Token #{token}',
    
    // Current Booking Card
    currentBooking: 'Current Booking',
    slotLabel: 'Slot:',
    cropLabel: 'Crop:',
    noActiveBooking: 'No active booking. Book a slot below.',
    viewGatePass: 'View Gate Pass',

    // Live Queue Status Card
    queueStatusTitle: 'At the Centre: Live Queue Status',
    tokenPrefix: 'Token',
    currentServing: 'Current Token:',
    estimatedWaitTime: 'Estimated Wait Time:',
    minutes: 'mins',
    waitingFarmers: 'Waiting Farmers:',
    yourTurnArrived: 'Your turn is now! Please report to Counter 2.',
    turnApproaching: 'Turn approaching soon! Please arrive at gate.',
    
    // Status Tracker Card
    statusTrackerTitle: 'My Status Tracker',
    stageRegistered: 'Registered',
    stageSlotBooked: 'Slot Booked',
    stageAtCentre: 'At Centre',
    stagePaymentProcessed: 'Payment Processed',
    waitingTag: '(Waiting)',
    verifiedTag: '(Verified)',
    doneTag: '(Done)',

    // Common
    loading: 'Loading...',
    refresh: 'Refresh Status',
    logout: 'Logout',
    switchRole: 'Switch Role',
    farmerRole: 'Farmer View',
    staffRole: 'Mandi Staff View',
    notifications: 'Alerts & SMS',
    markAllRead: 'Mark all as read',
    noNotifications: 'No alerts at the moment',
    quickLogin: 'Quick Demo Login',
    phonePlaceholder: 'Enter 10-digit mobile number',
    getOtp: 'Get OTP',
    verifyOtp: 'Verify OTP & Login',
  },
  hi: {
    appTitle: 'किसानसेतु',
    appTagline: 'मंडी खरीद का डिजिटल सेतु',
    navHome: 'होम',
    navBookSlot: 'स्लॉट बुक करें',
    navTrackStatus: 'स्थिति जांचें',
    navHistory: 'मेरी बुकिंग',
    navHelp: 'सहायता',
    navStaffAdmin: 'मंडी स्टाफ पोर्टल',
    searchPlaceholder: 'मंडी केंद्र, फसल, टोकन खोजें...',
    
    // Welcome Banner
    welcomeGreeting: 'किसानसेतु में आपका स्वागत है, {name}!',
    welcomeSubtitle: 'अपनी फसल खरीद का स्लॉट आसानी से सुरक्षित करें।',
    
    // Booking Card
    bookSlotTitle: 'खरीद स्लॉट बुक करें',
    selectCentre: 'खरीद केंद्र चुनें:',
    availableSlotsFor: '{date} के लिए उपलब्ध स्लॉट',
    slotsCount: '{count} स्लॉट उपलब्ध',
    bookButton: '{date}, {time} बुक करें',
    bookingModalTitle: 'स्लॉट बुकिंग पुष्टि',
    selectCrop: 'फसल चुनें',
    cropQuantity: 'अनुमानित मात्रा (क्विंटल)',
    vehicleNumber: 'वाहन संख्या (उदा. HR 05 AB 1234)',
    confirmBooking: 'पुष्टि करें और टोकन प्राप्त करें',
    cancel: 'रद्द करें',
    bookingSuccess: 'स्लॉट सफलतापूर्वक बुक हुआ! टोकन #{token}',
    
    // Current Booking Card
    currentBooking: 'वर्तमान बुकिंग',
    slotLabel: 'स्लॉट:',
    cropLabel: 'फसल:',
    noActiveBooking: 'कोई सक्रिय बुकिंग नहीं है। नीचे स्लॉट बुक करें।',
    viewGatePass: 'गेट पास देखें',

    // Live Queue Status Card
    queueStatusTitle: 'केंद्र पर: लाइव कतार स्थिति',
    tokenPrefix: 'टोकन',
    currentServing: 'वर्तमान टोकन:',
    estimatedWaitTime: 'अनुमानित प्रतीक्षा समय:',
    minutes: 'मिनट',
    waitingFarmers: 'प्रतीक्षारत किसान:',
    yourTurnArrived: 'आपकी बारी आ गई है! कृपया काउंटर 2 पर जाएं।',
    turnApproaching: 'आपकी बारी जल्द आ रही है! कृपया गेट पर पहुंचें।',
    
    // Status Tracker Card
    statusTrackerTitle: 'मेरी स्थिति ट्रैकर',
    stageRegistered: 'पंजीकृत',
    stageSlotBooked: 'स्लॉट बुक किया',
    stageAtCentre: 'केंद्र पर',
    stagePaymentProcessed: 'भुगतान पूर्ण',
    waitingTag: '(प्रतीक्षा)',
    verifiedTag: '(सत्यापित)',
    doneTag: '(सम्पन्न)',

    // Common
    loading: 'लोड हो रहा है...',
    refresh: 'स्थिति ताज़ा करें',
    logout: 'लॉगआउट',
    switchRole: 'भूमिका बदलें',
    farmerRole: 'किसान दृश्य',
    staffRole: 'मंडी स्टाफ दृश्य',
    notifications: 'सूचनाएं एवं SMS',
    markAllRead: 'सभी पढ़े गए चिह्नित करें',
    noNotifications: 'वर्तमान में कोई सूचना नहीं है',
    quickLogin: 'त्वरित डेमो लॉगिन',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर दर्ज करें',
    getOtp: 'ओटीपी प्राप्त करें',
    verifyOtp: 'ओटीपी सत्यापित करें',
  }
};

export function t(lang: Language, key: keyof typeof translations['en'], params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] || translations['en'][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}
