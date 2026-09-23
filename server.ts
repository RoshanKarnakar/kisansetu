import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  ProcurementCentre, 
  TimeSlot, 
  FarmerProfile, 
  Booking, 
  CentreQueueState, 
  NotificationItem 
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- In-Memory Database with Pre-Seeded Realistic Data ---
const centres: ProcurementCentre[] = [
  {
    id: 'centre-karnal-apmc',
    name: 'Karnal APMC (Sector 6)',
    location: 'Near Grand Trunk Road, Sector 6, Karnal',
    district: 'Karnal',
    state: 'Haryana',
    gates: ['Gate 1 (Heavy Trucks)', 'Gate 2 (Tractor Trolleys)', 'Gate 3 (Exit)'],
    activeCrops: ['Wheat', 'Paddy (Basmati)', 'Mustard', 'Barley'],
    operationalHours: '08:00 AM – 06:00 PM',
    contactPhone: '+91 184 225 4310',
    dailyCapacity: 60
  },
  {
    id: 'centre-kurukshetra',
    name: 'Kurukshetra Mandi Yard',
    location: 'Pipli Road, Near Grain Market, Kurukshetra',
    district: 'Kurukshetra',
    state: 'Haryana',
    gates: ['Gate 1 (Entry)', 'Gate 2 (Exit)'],
    activeCrops: ['Wheat', 'Paddy', 'Mustard'],
    operationalHours: '08:30 AM – 05:30 PM',
    contactPhone: '+91 174 423 8812',
    dailyCapacity: 45
  },
  {
    id: 'centre-ambala-cantt',
    name: 'Ambala Cantt Grain Market',
    location: 'Jagadhri Road, Ambala Cantt',
    district: 'Ambala',
    state: 'Haryana',
    gates: ['Main Gate North', 'Gate 2 South'],
    activeCrops: ['Wheat', 'Paddy', 'Sunflower'],
    operationalHours: '09:00 AM – 06:00 PM',
    contactPhone: '+91 171 264 1109',
    dailyCapacity: 50
  }
];

const farmers: FarmerProfile[] = [
  {
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
  },
  {
    id: 'farmer-gurpreet',
    name: 'Gurpreet Kaur',
    nameHi: 'गुरप्रीत कौर',
    phone: '9876500001',
    village: 'Nilokheri',
    district: 'Karnal',
    state: 'Haryana',
    landAcres: 10.0,
    registrationNo: 'KS-HR-2023-9120',
    registeredDate: '2023-10-20',
    bankAccountMasked: 'SBI (•••• 7731)',
    preferredCrops: ['Wheat', 'Mustard']
  },
  {
    id: 'farmer-balbir',
    name: 'Balbir Singh',
    nameHi: 'बलबीर सिंह',
    phone: '9876511223',
    village: 'Indri',
    district: 'Karnal',
    state: 'Haryana',
    landAcres: 8.0,
    registrationNo: 'KS-HR-2023-6401',
    registeredDate: '2023-10-22',
    bankAccountMasked: 'PNB (•••• 3390)',
    preferredCrops: ['Wheat', 'Paddy']
  }
];

// Helper to generate slots for dates
function generateSlotsForDate(centreId: string, dateStr: string): TimeSlot[] {
  return [
    {
      id: `slot-${centreId}-${dateStr}-1`,
      centreId,
      date: dateStr,
      timeRange: '09:00 AM – 10:00 AM',
      totalCapacity: 8,
      bookedCount: 4,
      remainingSlots: 4
    },
    {
      id: `slot-${centreId}-${dateStr}-2`,
      centreId,
      date: dateStr,
      timeRange: '10:00 AM – 11:00 AM',
      totalCapacity: 8,
      bookedCount: 2,
      remainingSlots: 6
    },
    {
      id: `slot-${centreId}-${dateStr}-3`,
      centreId,
      date: dateStr,
      timeRange: '11:00 AM – 12:00 PM',
      totalCapacity: 8,
      bookedCount: 4,
      remainingSlots: 4
    },
    {
      id: `slot-${centreId}-${dateStr}-4`,
      centreId,
      date: dateStr,
      timeRange: '12:00 PM – 01:00 PM',
      totalCapacity: 8,
      bookedCount: 4,
      remainingSlots: 4
    },
    {
      id: `slot-${centreId}-${dateStr}-5`,
      centreId,
      date: dateStr,
      timeRange: '02:00 PM – 03:00 PM',
      totalCapacity: 8,
      bookedCount: 3,
      remainingSlots: 5
    },
    {
      id: `slot-${centreId}-${dateStr}-6`,
      centreId,
      date: dateStr,
      timeRange: '03:00 PM – 04:00 PM',
      totalCapacity: 8,
      bookedCount: 1,
      remainingSlots: 7
    }
  ];
}

// Store slots in map: key = `${centreId}_${date}`
const slotsStore: Map<string, TimeSlot[]> = new Map();

function getOrCreateSlots(centreId: string, date: string): TimeSlot[] {
  const key = `${centreId}_${date}`;
  if (!slotsStore.has(key)) {
    slotsStore.set(key, generateSlotsForDate(centreId, date));
  }
  return slotsStore.get(key)!;
}

// Queue state per centre & date
const queueStore: Map<string, CentreQueueState> = new Map();

function getOrCreateQueue(centreId: string, date: string): CentreQueueState {
  const key = `${centreId}_${date}`;
  if (!queueStore.has(key)) {
    queueStore.set(key, {
      centreId,
      date,
      currentServingToken: 19, // Exactly 19 as seen in screenshot!
      totalTokensIssued: 28,
      averageMinutesPerToken: 3, // 3 mins * 5 waiting = 15 mins! Exactly matching screenshot!
      counterStatus: 'active',
      lastUpdated: new Date().toISOString()
    });
  }
  return queueStore.get(key)!;
}

// Reference screenshot date: "Oct 27, 2023" (formatted as 2023-10-27 or today/selected)
const PRIMARY_DATE = '2023-10-27';

// Initial pre-seeded bookings
const bookings: Booking[] = [
  // Prior tokens already served
  {
    id: 'book-seed-18',
    tokenNumber: 18,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-balbir',
    farmerName: 'Balbir Singh',
    farmerPhone: '9876511223',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:00 AM – 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 55,
    actualQuantityQuintals: 54.2,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 CD 4489',
    status: 'served',
    checkInTime: '08:45 AM',
    servedTime: '09:18 AM',
    paymentStatus: 'processed',
    paymentAmount: 123305,
    paymentRef: 'DBT-AGRI-20231027-8911',
    paymentDate: '2023-10-27 10:15 AM',
    createdDate: '2023-10-23'
  },
  // Token 19 currently at counter
  {
    id: 'book-seed-19',
    tokenNumber: 19,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-gurpreet',
    farmerName: 'Gurpreet Kaur',
    farmerPhone: '9876500001',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:00 AM – 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 65,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 BK 1102',
    status: 'at_centre',
    checkInTime: '09:05 AM',
    paymentStatus: 'in_process',
    createdDate: '2023-10-23'
  },
  // Tokens 20, 21, 22, 23 (in queue ahead of 24)
  {
    id: 'book-seed-20',
    tokenNumber: 20,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-demo-20',
    farmerName: 'Hardeep Gill',
    farmerPhone: '9876522334',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:00 AM – 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 45,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 F 9921',
    status: 'at_centre',
    paymentStatus: 'pending',
    createdDate: '2023-10-24'
  },
  {
    id: 'book-seed-21',
    tokenNumber: 21,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-demo-21',
    farmerName: 'Manpreet Sandhu',
    farmerPhone: '9876533445',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:00 AM – 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 50,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 G 1045',
    status: 'at_centre',
    paymentStatus: 'pending',
    createdDate: '2023-10-24'
  },
  {
    id: 'book-seed-22',
    tokenNumber: 22,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-demo-22',
    farmerName: 'Sukhwinder Cheema',
    farmerPhone: '9876544556',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:00 AM – 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 70,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 K 3390',
    status: 'slot_booked',
    paymentStatus: 'pending',
    createdDate: '2023-10-24'
  },
  {
    id: 'book-seed-23',
    tokenNumber: 23,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-demo-23',
    farmerName: 'Joginder Sharma',
    farmerPhone: '9876555667',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:00 AM – 10:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 60,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 M 8821',
    status: 'slot_booked',
    paymentStatus: 'pending',
    createdDate: '2023-10-24'
  },
  // Token 24 - PRIMARY MATCH FOR SCREENSHOT (Rakesh Singh)!
  {
    id: 'book-rakesh-primary',
    tokenNumber: 24,
    tokenDate: PRIMARY_DATE,
    farmerId: 'farmer-rakesh',
    farmerName: 'Rakesh Singh',
    farmerPhone: '9876543210',
    centreId: 'centre-karnal-apmc',
    centreName: 'Karnal APMC (Sector 6)',
    date: PRIMARY_DATE,
    slotId: `slot-centre-karnal-apmc-${PRIMARY_DATE}-1`,
    timeRange: '09:30 AM', // Shown as Oct 27, 09:30 AM
    cropType: 'Wheat',
    estimatedQuantityQuintals: 65,
    mspRatePerQuintal: 2275,
    vehicleNo: 'HR 05 Z 7741',
    status: 'slot_booked',
    paymentStatus: 'pending',
    createdDate: '2023-10-24'
  }
];

// Initial pre-seeded notifications
const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    farmerId: 'farmer-rakesh',
    title: 'Slot Booking Confirmed',
    titleHi: 'स्लॉट बुकिंग पुष्ट',
    message: 'SMS from DM-KISANS: Dear Rakesh, your procurement slot for Wheat is confirmed for Oct 27 at Karnal APMC. Your Token number is #24.',
    messageHi: 'DM-KISANS से SMS: प्रिय राकेश, करनाल APMC में 27 अक्टूबर को गेहूं खरीद हेतु स्लॉट पुष्ट हुआ। आपका टोकन #24 है।',
    channel: 'sms',
    timestamp: '2023-10-24 02:40 PM',
    read: true,
    type: 'booking'
  },
  {
    id: 'notif-2',
    farmerId: 'farmer-rakesh',
    title: 'Gate Pass Ready',
    titleHi: 'गेट पास तैयार',
    message: 'Digital gate pass generated for vehicle HR 05 Z 7741. Show QR code at Mandi Gate 2 upon arrival.',
    messageHi: 'वाहन HR 05 Z 7741 के लिए डिजिटल गेट पास जारी। आगमन पर गेट 2 पर क्यूआर कोड दिखाएं।',
    channel: 'app',
    timestamp: '2023-10-25 10:00 AM',
    read: false,
    type: 'info'
  },
  {
    id: 'notif-3',
    farmerId: 'farmer-rakesh',
    title: 'Live Queue Alert',
    titleHi: 'लाइव कतार सूचना',
    message: 'Current token at Karnal APMC is #19. 5 farmers are ahead of your token #24. Estimated wait time is 15 minutes.',
    messageHi: 'करनाल APMC पर वर्तमान टोकन #19 है। आपके टोकन #24 से आगे 5 किसान हैं। अनुमानित प्रतीक्षा समय 15 मिनट है।',
    channel: 'sms',
    timestamp: '2023-10-27 09:10 AM',
    read: false,
    type: 'queue_alert'
  }
];

// In-memory active OTP store for phone verification
const activeOtps = new Map<string, string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Centres
  app.get('/api/centres', (req: Request, res: Response) => {
    res.json(centres);
  });

  app.get('/api/centres/:id', (req: Request, res: Response) => {
    const centre = centres.find(c => c.id === req.params.id);
    if (!centre) {
      return res.status(404).json({ error: 'Centre not found' });
    }
    const date = (req.query.date as string) || PRIMARY_DATE;
    const queue = getOrCreateQueue(centre.id, date);
    res.json({ ...centre, queue });
  });

  // Slots query
  app.get('/api/slots', (req: Request, res: Response) => {
    const centreId = (req.query.centreId as string) || 'centre-karnal-apmc';
    const date = (req.query.date as string) || PRIMARY_DATE;
    const slots = getOrCreateSlots(centreId, date);
    res.json(slots);
  });

  // Bookings list
  app.get('/api/bookings', (req: Request, res: Response) => {
    const { farmerId, centreId, date } = req.query;
    let filtered = [...bookings];
    if (farmerId) {
      filtered = filtered.filter(b => b.farmerId === farmerId);
    }
    if (centreId) {
      filtered = filtered.filter(b => b.centreId === centreId);
    }
    if (date) {
      filtered = filtered.filter(b => b.date === date);
    }
    res.json(filtered);
  });

  // Single booking with live queue calculation
  app.get('/api/bookings/:id', (req: Request, res: Response) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const queue = getOrCreateQueue(booking.centreId, booking.date);
    
    // Calculate live position
    const tokensAhead = Math.max(0, booking.tokenNumber - queue.currentServingToken);
    const estimatedWaitMins = tokensAhead * queue.averageMinutesPerToken;

    res.json({
      ...booking,
      queue: {
        currentServingToken: queue.currentServingToken,
        tokensAhead,
        estimatedWaitMins,
        counterStatus: queue.counterStatus
      }
    });
  });

  // Create slot booking (prevents double-booking, assigns sequential token)
  app.post('/api/bookings', (req: Request, res: Response) => {
    const {
      farmerId,
      centreId,
      date,
      slotId,
      timeRange,
      cropType,
      estimatedQuantityQuintals,
      vehicleNo
    } = req.body;

    if (!farmerId || !centreId || !date || !slotId) {
      return res.status(400).json({ error: 'Missing required booking details' });
    }

    const farmer = farmers.find(f => f.id === farmerId);
    const centre = centres.find(c => c.id === centreId);

    if (!farmer || !centre) {
      return res.status(404).json({ error: 'Farmer or centre not found' });
    }

    // Check slot availability
    const slots = getOrCreateSlots(centreId, date);
    const targetSlot = slots.find(s => s.id === slotId);
    if (!targetSlot || targetSlot.remainingSlots <= 0) {
      return res.status(400).json({ error: 'Selected slot is fully booked. Please choose another slot.' });
    }

    // Prevent active double booking for same farmer, centre and date
    const existing = bookings.find(
      b => b.farmerId === farmerId && b.centreId === centreId && b.date === date && b.status !== 'cancelled'
    );
    if (existing) {
      return res.status(400).json({ 
        error: `You already have an active booking (Token #${existing.tokenNumber}) for this date.`,
        booking: existing
      });
    }

    // Decrement slot capacity
    targetSlot.bookedCount += 1;
    targetSlot.remainingSlots -= 1;

    // Sequential token per centre per day
    const queue = getOrCreateQueue(centreId, date);
    queue.totalTokensIssued += 1;
    const tokenNumber = queue.totalTokensIssued;

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      tokenNumber,
      tokenDate: date,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      centreId: centre.id,
      centreName: centre.name,
      date,
      slotId,
      timeRange: timeRange || targetSlot.timeRange,
      cropType: cropType || 'Wheat',
      estimatedQuantityQuintals: Number(estimatedQuantityQuintals) || 50,
      mspRatePerQuintal: 2275,
      vehicleNo: vehicleNo || 'HR 05 AB 1234',
      status: 'slot_booked',
      paymentStatus: 'pending',
      createdDate: new Date().toISOString().split('T')[0]
    };

    bookings.push(newBooking);

    // Create confirmation notifications
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      farmerId: farmer.id,
      title: 'Slot Booking Confirmed',
      titleHi: 'स्लॉट बुकिंग पुष्ट',
      message: `SMS from DM-KISANS: Dear ${farmer.name}, slot booked for ${date}, ${newBooking.timeRange} at ${centre.name}. Your Token is #${tokenNumber}. Vehicle: ${newBooking.vehicleNo}.`,
      messageHi: `DM-KISANS से SMS: प्रिय ${farmer.nameHi || farmer.name}, ${centre.name} पर ${date}, ${newBooking.timeRange} हेतु स्लॉट बुक हुआ। आपका टोकन #${tokenNumber} है। वाहन: ${newBooking.vehicleNo}`,
      channel: 'sms',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'booking'
    };
    notifications.unshift(newNotif);

    res.status(201).json({
      success: true,
      booking: newBooking,
      notification: newNotif
    });
  });

  // Update booking status (e.g. at_centre, served, payment_processed)
  app.patch('/api/bookings/:id/status', (req: Request, res: Response) => {
    const { status, actualQuantityQuintals, paymentStatus, paymentAmount, paymentRef } = req.body;
    const booking = bookings.find(b => b.id === req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (status) {
      booking.status = status;
      if (status === 'at_centre' && !booking.checkInTime) {
        booking.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Notify farmer
        notifications.unshift({
          id: `notif-${Date.now()}`,
          farmerId: booking.farmerId,
          title: 'Gate Check-in Verified',
          titleHi: 'गेट चेक-इन सत्यापित',
          message: `SMS: Welcome to ${booking.centreName}. Gate entry verified. Proceed to Weighbridge Counter 2. Token #${booking.tokenNumber}.`,
          messageHi: `SMS: ${booking.centreName} में स्वागत है। गेट प्रवेश सत्यापित। वेईब्रिज काउंटर 2 पर आगे बढ़ें। टोकन #${booking.tokenNumber}`,
          channel: 'sms',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: 'queue_alert'
        });
      }
      if (status === 'served' && !booking.servedTime) {
        booking.servedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (actualQuantityQuintals) {
          booking.actualQuantityQuintals = Number(actualQuantityQuintals);
          booking.paymentAmount = Math.round(booking.actualQuantityQuintals * booking.mspRatePerQuintal);
        }
      }
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
      if (paymentStatus === 'processed') {
        booking.status = 'payment_processed';
        booking.paymentAmount = paymentAmount || booking.paymentAmount || 142500;
        booking.paymentRef = paymentRef || `DBT-AGRI-${Date.now()}`;
        booking.paymentDate = new Date().toLocaleString();

        // Notify DBT payment
        notifications.unshift({
          id: `notif-${Date.now()}`,
          farmerId: booking.farmerId,
          title: 'Direct Benefit Transfer (DBT) Payment Processed',
          titleHi: 'डीबीटी भुगतान संसाधित',
          message: `SMS from PFMS-GOV: ₹${booking.paymentAmount.toLocaleString()} credited to your bank account for ${booking.actualQuantityQuintals || booking.estimatedQuantityQuintals} quintals ${booking.cropType}. Ref: ${booking.paymentRef}.`,
          messageHi: `PFMS-GOV से SMS: आपके बैंक खाते में ₹${booking.paymentAmount.toLocaleString()} जमा किए गए (${booking.actualQuantityQuintals || booking.estimatedQuantityQuintals} क्विंटल ${booking.cropType})। संदर्भ: ${booking.paymentRef}`,
          channel: 'sms',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: 'payment'
        });
      }
    }

    res.json({ success: true, booking });
  });

  // Cancel booking
  app.post('/api/bookings/:id/cancel', (req: Request, res: Response) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    booking.status = 'cancelled';

    // Return slot capacity
    const slots = getOrCreateSlots(booking.centreId, booking.date);
    const slot = slots.find(s => s.id === booking.slotId);
    if (slot) {
      slot.bookedCount = Math.max(0, slot.bookedCount - 1);
      slot.remainingSlots = Math.min(slot.totalCapacity, slot.remainingSlots + 1);
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  });

  // Queue state for centre
  app.get('/api/queue/:centreId', (req: Request, res: Response) => {
    const date = (req.query.date as string) || PRIMARY_DATE;
    const queue = getOrCreateQueue(req.params.centreId, date);
    
    // Count farmers waiting (issued token > currentServingToken and not cancelled)
    const waitingBookings = bookings.filter(
      b => b.centreId === req.params.centreId && 
           b.date === date && 
           b.tokenNumber > queue.currentServingToken && 
           b.status !== 'cancelled'
    );

    res.json({
      ...queue,
      waitingCount: waitingBookings.length,
      estimatedWaitTimeMins: waitingBookings.length * queue.averageMinutesPerToken
    });
  });

  // Admin: Call Next Token (advances queue and triggers notification for upcoming farmers)
  app.post('/api/queue/advance', (req: Request, res: Response) => {
    const { centreId, date } = req.body;
    const targetCentreId = centreId || 'centre-karnal-apmc';
    const targetDate = date || PRIMARY_DATE;
    const queue = getOrCreateQueue(targetCentreId, targetDate);

    queue.currentServingToken += 1;
    queue.lastUpdated = new Date().toISOString();

    // Check if any booking matches the newly called token
    const currentCalledBooking = bookings.find(
      b => b.centreId === targetCentreId && b.date === targetDate && b.tokenNumber === queue.currentServingToken
    );

    if (currentCalledBooking) {
      currentCalledBooking.status = 'at_centre';
      notifications.unshift({
        id: `notif-${Date.now()}-call`,
        farmerId: currentCalledBooking.farmerId,
        title: '📢 YOUR TOKEN IS NOW BEING SERVED!',
        titleHi: '📢 आपका टोकन अब बुलाया गया है!',
        message: `SMS: Urgent! Token #${currentCalledBooking.tokenNumber} (${currentCalledBooking.farmerName}) please report to Weighbridge Counter 2 with vehicle ${currentCalledBooking.vehicleNo}.`,
        messageHi: `SMS: आवश्यक! टोकन #${currentCalledBooking.tokenNumber} (${currentCalledBooking.farmerName}) कृपया वाहन ${currentCalledBooking.vehicleNo} के साथ वेईब्रिज काउंटर 2 पर उपस्थित हों।`,
        channel: 'sms',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'queue_alert'
      });
    }

    // Check upcoming farmers (e.g. within 3 tokens away)
    const upcomingBookings = bookings.filter(
      b => b.centreId === targetCentreId && 
           b.date === targetDate && 
           b.tokenNumber > queue.currentServingToken && 
           b.tokenNumber <= queue.currentServingToken + 3
    );

    upcomingBookings.forEach(upB => {
      const ahead = upB.tokenNumber - queue.currentServingToken;
      notifications.unshift({
        id: `notif-${Date.now()}-near-${upB.tokenNumber}`,
        farmerId: upB.farmerId,
        title: `Queue Alert: Only ${ahead} farmer(s) ahead!`,
        titleHi: `कतार सूचना: आपकी बारी से पहले केवल ${ahead} किसान!`,
        message: `SMS: Mandi Queue Update - Current token is #${queue.currentServingToken}. Your token #${upB.tokenNumber} is next in line. Please keep your vehicle ready at Gate 2.`,
        messageHi: `SMS: मंडी कतार अपडेट - वर्तमान टोकन #${queue.currentServingToken} है। आपका टोकन #${upB.tokenNumber} कतार में अगला है। कृपया गेट 2 पर वाहन तैयार रखें।`,
        channel: 'sms',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'queue_alert'
      });
    });

    res.json({
      success: true,
      currentServingToken: queue.currentServingToken,
      calledBooking: currentCalledBooking || null
    });
  });

  // Admin: Reset queue for testing/demo
  app.post('/api/queue/reset', (req: Request, res: Response) => {
    const { centreId, date } = req.body;
    const targetCentreId = centreId || 'centre-karnal-apmc';
    const targetDate = date || PRIMARY_DATE;
    const queue = getOrCreateQueue(targetCentreId, targetDate);

    queue.currentServingToken = 19;
    queue.lastUpdated = new Date().toISOString();

    res.json({ success: true, queue });
  });

  // Farmers
  app.get('/api/farmers', (req: Request, res: Response) => {
    res.json(farmers);
  });

  app.get('/api/farmers/:id', (req: Request, res: Response) => {
    const farmer = farmers.find(f => f.id === req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json(farmer);
  });

  // Farmer registration
  app.post('/api/farmers/register', (req: Request, res: Response) => {
    const { name, nameHi, phone, village, district, state, landAcres, preferredCrops } = req.body;
    if (!name || !phone || !village) {
      return res.status(400).json({ error: 'Name, phone and village are required' });
    }

    const regNo = `KS-${(district || 'HR').slice(0, 2).toUpperCase()}-2024-${Math.floor(1000 + Math.random() * 9000)}`;
    const newFarmer: FarmerProfile = {
      id: `farmer-${Date.now()}`,
      name,
      nameHi: nameHi || name,
      phone,
      village,
      district: district || 'Karnal',
      state: state || 'Haryana',
      landAcres: Number(landAcres) || 4.0,
      registrationNo: regNo,
      registeredDate: new Date().toISOString().split('T')[0],
      bankAccountMasked: 'Direct DBT Account (Linked with Aadhaar)',
      preferredCrops: preferredCrops || ['Wheat']
    };

    farmers.push(newFarmer);

    // Initial welcome notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      farmerId: newFarmer.id,
      title: 'Farmer Registration Successful',
      titleHi: 'किसान पंजीकरण सफल',
      message: `SMS: Welcome to KisanSetu! Your Farmer Registration ID is ${newFarmer.registrationNo}. You can now book crop procurement slots online.`,
      messageHi: `SMS: किसानसेतु में आपका स्वागत है! आपकी किसान पंजीकरण आईडी ${newFarmer.registrationNo} है। अब आप ऑनलाइन फसल खरीद स्लॉट बुक कर सकते हैं।`,
      channel: 'sms',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'info'
    });

    res.status(201).json({ success: true, farmer: newFarmer });
  });

  // Auth: Send OTP
  app.post('/api/auth/otp/send', (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    // Fixed or simple 4-digit OTP for seamless testing
    const otp = '1234';
    activeOtps.set(phone, otp);

    res.json({
      success: true,
      message: `OTP sent to +91 ${phone}`,
      simulatedOtp: otp // Included for demo convenience!
    });
  });

  // Auth: Verify OTP
  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const storedOtp = activeOtps.get(phone) || '1234'; // Default demo OTP 1234
    
    if (otp !== storedOtp && otp !== '1234') {
      return res.status(400).json({ error: 'Invalid OTP. For demo, use 1234.' });
    }

    // Find farmer or create default session
    let farmer = farmers.find(f => f.phone === phone);
    if (!farmer) {
      farmer = farmers[0]; // fallback to Rakesh Singh for demo
    }

    res.json({
      success: true,
      farmer,
      token: `demo-token-${farmer.id}`
    });
  });

  // Notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    const farmerId = req.query.farmerId as string;
    let list = [...notifications];
    if (farmerId) {
      list = list.filter(n => n.farmerId === farmerId || n.farmerId === 'all');
    }
    res.json(list);
  });

  app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
    notifications.forEach(n => { n.read = true; });
    res.json({ success: true });
  });

  // Vite integration (middleware mode in development, static files in production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 KisanSetu Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
