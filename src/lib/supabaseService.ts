import { supabase } from './supabaseClient';
import { 
  Crop, 
  CropListing, 
  CropMarketData, 
  FarmerProfile, 
  Profile,
  Buyer,
  Bid,
  ChatMessage,
  SlotConfirmationSummary,
  BuyerTransaction,
  PaymentRequest,
  BuyerViolation,
  ProcurementRecordingData,
  CropPriorityItem,
  ProcurementCentre,
  TimeSlot,
  Booking,
  CentreQueueState,
  NotificationItem
} from '../types';

// Default crops in case Supabase table has not yet been seeded with SQL
export const FALLBACK_CROPS: Crop[] = [
  {
    id: 'wheat',
    name_en: 'Wheat (Sharbati / PBW 550)',
    name_hi: 'गेहूं (शरबती)',
    category: 'Cereal',
    current_msp_per_quintal: 2275.0,
    quality_parameters: { max_moisture: 12.0 },
    is_procurement_active: true,
  },
  {
    id: 'paddy_basmati',
    name_en: 'Paddy (Basmati 1121)',
    name_hi: 'धान (बासमती)',
    category: 'Cereal',
    current_msp_per_quintal: 2320.0,
    quality_parameters: { max_moisture: 14.0 },
    is_procurement_active: true,
  },
  {
    id: 'mustard',
    name_en: 'Mustard (RH 725)',
    name_hi: 'सरसों (आरएच 725)',
    category: 'Oilseed',
    current_msp_per_quintal: 5650.0,
    quality_parameters: { max_moisture: 8.0 },
    is_procurement_active: true,
  },
  {
    id: 'gram',
    name_en: 'Gram / Chana (JG 14)',
    name_hi: 'चना (देसी)',
    category: 'Pulse',
    current_msp_per_quintal: 5440.0,
    quality_parameters: { max_moisture: 10.0 },
    is_procurement_active: true,
  },
];

export async function getCrops(): Promise<Crop[]> {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('name_en', { ascending: true });

    if (error) {
      console.warn('Could not fetch crops from Supabase, using defaults:', error.message);
      return FALLBACK_CROPS;
    }

    return (data || []) as Crop[];
  } catch (err) {
    throw err;
  }
}

export async function getFarmerRecord(userId: string): Promise<FarmerProfile | null> {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching farmer profile:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      nameHi: data.name_hi || data.name,
      phone: '', // Can be augmented from auth/profiles
      village: data.village,
      district: data.district,
      state: data.state || 'Haryana',
      landAcres: Number(data.land_acres) || 0,
      registrationNo: data.registration_no,
      registeredDate: data.created_at ? data.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      bankAccountMasked: data.bank_account_masked || 'Bank Account Verified',
      preferredCrops: ['Wheat', 'Paddy (Basmati)'],
    };
  } catch (err) {
    console.error('getFarmerRecord exception:', err);
    return null;
  }
}

function mapCentre(row: any): ProcurementCentre {
  return {
    id: row.id,
    name: row.name,
    location: row.location || row.district,
    district: row.district,
    state: row.state || 'Haryana',
    gates: row.gates || [],
    activeCrops: row.active_crops || [],
    operationalHours: row.operational_hours || '',
    contactPhone: row.contact_phone || '',
    dailyCapacity: Number(row.daily_capacity || 0),
  };
}

function mapSlot(row: any): TimeSlot {
  return {
    id: row.id,
    centreId: row.centre_id,
    date: row.date,
    timeRange: row.time_range,
    totalCapacity: Number(row.total_capacity || 0),
    bookedCount: Number(row.booked_count || 0),
    remainingSlots: Math.max(0, Number(row.total_capacity || 0) - Number(row.booked_count || 0)),
  };
}

function mapBooking(row: any): Booking {
  return {
    id: row.id,
    tokenNumber: Number(row.token_number),
    tokenDate: row.token_date || row.date,
    farmerId: row.farmer_id,
    farmerName: row.farmer?.name || row.farmer_name || '',
    farmerPhone: row.farmer?.phone || row.farmer_phone || '',
    centreId: row.centre_id,
    centreName: row.centre?.name || row.centre_name || '',
    date: row.date,
    slotId: row.slot_id,
    timeRange: row.slot?.time_range || row.time_range || '',
    cropType: row.crop_type,
    estimatedQuantityQuintals: Number(row.estimated_quantity_quintals || 0),
    actualQuantityQuintals: row.actual_quantity_quintals == null ? undefined : Number(row.actual_quantity_quintals),
    mspRatePerQuintal: Number(row.msp_rate_per_quintal || 0),
    vehicleNo: row.vehicle_no,
    status: row.status,
    checkInTime: row.check_in_time,
    servedTime: row.served_time,
    paymentStatus: row.payment_status || 'pending',
    paymentAmount: row.payment_amount == null ? undefined : Number(row.payment_amount),
    paymentRef: row.payment_ref,
    paymentDate: row.payment_date,
    createdDate: row.created_at?.slice(0, 10) || row.date,
  };
}

export async function getProcurementCentres(): Promise<ProcurementCentre[]> {
  const { data, error } = await supabase.from('procurement_centres').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return (data || []).map(mapCentre);
}

export async function getProcurementSlots(centreId: string, date: string): Promise<TimeSlot[]> {
  const { data, error } = await supabase.from('slots').select('*').eq('centre_id', centreId).eq('date', date).order('start_time');
  if (error) throw error;
  return (data || []).map(mapSlot);
}

export async function bookProcurementSlot(input: {
  farmerId: string;
  centreId: string;
  date: string;
  slotId: string;
  cropType: string;
  estimatedQuantityQuintals: number;
  vehicleNo: string;
  mspRatePerQuintal: number;
}): Promise<Booking> {
  let mspRate = input.mspRatePerQuintal;
  if (!mspRate) {
    const { data: crop } = await supabase.from('crops').select('current_msp_per_quintal, name_en').ilike('name_en', `%${input.cropType}%`).limit(1).maybeSingle();
    mspRate = Number(crop?.current_msp_per_quintal || 0);
  }
  const { data, error } = await supabase.rpc('book_slot', {
    p_farmer_id: input.farmerId,
    p_centre_id: input.centreId,
    p_slot_id: input.slotId,
    p_date: input.date,
    p_crop_type: input.cropType,
    p_estimated_quantity_quintals: input.estimatedQuantityQuintals,
    p_vehicle_no: input.vehicleNo,
    p_msp_rate_per_quintal: mspRate,
  });
  if (error) throw error;
  const booking = mapBooking(Array.isArray(data) ? data[0] : data);
  const hydrated = await getFarmerBookings(input.farmerId);
  return hydrated.find((item) => item.id === booking.id) || booking;
}

export async function getFarmerBookings(farmerId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, procurement_centres(name), slots(time_range), farmers(name)')
    .eq('farmer_id', farmerId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => mapBooking({ ...row, centre: row.procurement_centres, slot: row.slots, farmer: row.farmers }));
}

export async function getCentreBookings(centreId: string, date?: string): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select('*, procurement_centres(name), slots(time_range), farmers(name)')
    .eq('centre_id', centreId)
    .order('token_number');
  if (date) query = query.eq('date', date);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: any) => mapBooking({ ...row, centre: row.procurement_centres, slot: row.slots, farmer: row.farmers }));
}

export async function cancelFarmerBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (error) throw error;
}

export async function updateFarmerBooking(bookingId: string, updates: Record<string, unknown>): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select('*, procurement_centres(name), slots(time_range), farmers(name)')
    .single();
  if (error) throw error;
  return mapBooking({ ...data, centre: data.procurement_centres, slot: data.slots, farmer: data.farmers });
}

export async function getCentreQueueState(centreId: string, date: string): Promise<CentreQueueState> {
  const { data, error } = await supabase.from('queue_state').select('*').eq('centre_id', centreId).eq('date', date).maybeSingle();
  if (error) throw error;
  return {
    centreId,
    date,
    currentServingToken: Number(data?.current_serving_token || 0),
    totalTokensIssued: Number(data?.total_tokens_issued || 0),
    averageMinutesPerToken: Number(data?.average_minutes_per_token || 3),
    counterStatus: data?.counter_status || 'active',
    lastUpdated: data?.updated_at || new Date().toISOString(),
  };
}

export async function advanceCentreQueue(centreId: string, date: string): Promise<CentreQueueState> {
  const { data, error } = await supabase.rpc('advance_queue', { p_centre_id: centreId, p_date: date });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    centreId,
    date,
    currentServingToken: Number(row.current_serving_token),
    totalTokensIssued: Number(row.total_tokens_issued),
    averageMinutesPerToken: Number(row.average_minutes_per_token || 3),
    counterStatus: row.counter_status || 'active',
    lastUpdated: row.updated_at || new Date().toISOString(),
  };
}

export function subscribeToQueueState(centreId: string, date: string, onChange: (queue: CentreQueueState) => void): () => void {
  const channel = supabase
    .channel(`queue-state:${centreId}:${date}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_state', filter: `centre_id=eq.${centreId}` }, (payload) => {
      const row = payload.new as any;
      if (row.date !== date) return;
      onChange({
        centreId,
        date,
        currentServingToken: Number(row.current_serving_token || 0),
        totalTokensIssued: Number(row.total_tokens_issued || 0),
        averageMinutesPerToken: Number(row.average_minutes_per_token || 3),
        counterStatus: row.counter_status || 'active',
        lastUpdated: row.updated_at || new Date().toISOString(),
      });
    })
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    farmerId: row.user_id,
    title: row.title,
    titleHi: row.title_hi || row.title,
    message: row.message,
    messageHi: row.message_hi || row.message,
    channel: row.channel || 'app',
    timestamp: row.created_at,
    read: Boolean(row.read_at || row.is_read),
    type: row.type || 'info',
  }));
}

export async function markUserNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
  if (error) throw error;
}

export async function syncFarmerProfile(
  userId: string,
  phone: string,
  farmerData: {
    name: string;
    village: string;
    district: string;
    state?: string;
    landAcres: number;
    preferredCrop?: string;
  }
): Promise<FarmerProfile> {
  // 1. Ensure row in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      phone: phone,
      role: 'farmer',
      is_active: true,
    });
    if (profileError) throw profileError;
  }

  // 2. Ensure row in farmers
  const regNo = `KS-HR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: existingFarmer } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!existingFarmer) {
    const { error: insertErr } = await supabase.from('farmers').insert({
      id: userId,
      name: farmerData.name,
      name_hi: farmerData.name,
      registration_no: regNo,
      village: farmerData.village,
      district: farmerData.district,
      state: farmerData.state || 'Haryana',
      land_acres: farmerData.landAcres,
      bank_account_masked: 'HDFC Bank (•••• 4812)',
      aadhaar_masked: '•••• •••• ' + phone.slice(-4),
    });

    if (insertErr) {
      throw insertErr;
    }
  }

  return {
    id: userId,
    name: farmerData.name,
    nameHi: farmerData.name,
    phone: phone,
    village: farmerData.village,
    district: farmerData.district,
    state: farmerData.state || 'Haryana',
    landAcres: farmerData.landAcres,
    registrationNo: existingFarmer?.registration_no || regNo,
    registeredDate: new Date().toISOString().slice(0, 10),
    bankAccountMasked: existingFarmer?.bank_account_masked || 'HDFC Bank (•••• 4812)',
    preferredCrops: farmerData.preferredCrop ? [farmerData.preferredCrop] : ['Wheat', 'Paddy (Basmati)'],
  };
}

// ------------------- CROP LISTINGS (CRUD) -------------------

export async function getCropListings(farmerId: string): Promise<CropListing[]> {
  try {
    const { data, error } = await supabase
      .from('crop_listings')
      .select(`
        *,
        crops (
          id,
          name_en,
          name_hi,
          category,
          current_msp_per_quintal,
          is_procurement_active
        )
      `)
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching crop_listings:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      crop: row.crops,
    })) as CropListing[];
  } catch (err) {
    console.error('getCropListings exception:', err);
    return [];
  }
}

export async function createCropListing(
  listing: Omit<CropListing, 'id' | 'created_at' | 'crop'>
): Promise<{ data: CropListing | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('crop_listings')
      .insert({
        farmer_id: listing.farmer_id,
        crop_id: listing.crop_id,
        variety: listing.variety || 'Standard Quality',
        quantity_quintals: listing.quantity_quintals,
        expected_price_per_quintal: listing.expected_price_per_quintal || null,
        harvest_date: listing.harvest_date,
        moisture_percentage: listing.moisture_percentage || null,
        status: listing.status || 'active',
        suggested_slot_date: listing.suggested_slot_date || null,
        suggested_centre_id: listing.suggested_centre_id || null,
      })
      .select(`
        *,
        crops (
          id,
          name_en,
          name_hi,
          category,
          current_msp_per_quintal,
          is_procurement_active
        )
      `)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        crop: data.crops,
      } as CropListing,
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create listing' };
  }
}

export async function updateCropListing(
  id: string,
  updates: Partial<Omit<CropListing, 'id' | 'farmer_id' | 'created_at' | 'crop'>>
): Promise<{ data: CropListing | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('crop_listings')
      .update({
        ...updates,
      })
      .eq('id', id)
      .select(`
        *,
        crops (
          id,
          name_en,
          name_hi,
          category,
          current_msp_per_quintal,
          is_procurement_active
        )
      `)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        crop: data.crops,
      } as CropListing,
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to update listing' };
  }
}

export async function deleteCropListing(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('crop_listings').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete listing' };
  }
}

// ------------------- MARKET DATA -------------------

export async function getCropMarketData(district?: string, cropId?: string): Promise<CropMarketData[]> {
  try {
    let query = supabase.from('crop_market_data').select(`
      *,
      crops (
        id,
        name_en,
        name_hi,
        category,
        current_msp_per_quintal,
        is_procurement_active
      )
    `);

    if (district) {
      query = query.ilike('district', district);
    }
    if (cropId && cropId !== 'all') {
      query = query.eq('crop_id', cropId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.warn('Error fetching crop_market_data:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      crop: row.crops,
    })) as CropMarketData[];
  } catch (err) {
    console.error('getCropMarketData exception:', err);
    return [];
  }
}

// ============================================================================
// ------------------- BUYER & PROCUREMENT SERVICE ----------------------------
// ============================================================================

export const INITIAL_BUYERS: Buyer[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    company_name: 'Karnal Roller Flour Mills Ltd.',
    buyer_type: 'Miller / Processor',
    trade_license_no: 'HR-KRN-APMC-8812',
    gstin: '06AAACK1234F1Z5',
    pan: 'AAACK1234F',
    contact_person: 'Suresh Singhal',
    phone: '+919812044551',
    email: 'procurement@karnalflourmills.com',
    district: 'Karnal',
    state: 'Haryana',
    address: 'Plot 44-48, Industrial Area Phase II, Near Sector 6 APMC Yard, Karnal',
    procurement_crops: ['wheat', 'gram'],
    procurement_capacity_mt: 12000,
    verification_status: 'verified',
    reliability_score: 98,
    total_deals: 142,
    rating: 4.9,
    created_at: '2023-04-12T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    company_name: 'Haryana Basmati Exporters Union',
    buyer_type: 'Bulk Exporter',
    trade_license_no: 'HR-TRA-APMC-9140',
    gstin: '06AABCH5566G1ZV',
    pan: 'AABCH5566G',
    contact_person: 'Rajesh Aggarwal',
    phone: '+919896012345',
    email: 'trades@haryanabasmati.com',
    district: 'Karnal',
    state: 'Haryana',
    address: 'Export Yard, GT Road, Taraori, Karnal',
    procurement_crops: ['paddy_basmati'],
    procurement_capacity_mt: 25000,
    verification_status: 'verified',
    reliability_score: 99,
    total_deals: 210,
    rating: 5.0,
    created_at: '2023-01-18T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    company_name: 'Kissan Oil & Agro Industries',
    buyer_type: 'Miller / Processor',
    trade_license_no: 'HR-PNP-APMC-6623',
    gstin: '06AACCK9911K1Z2',
    pan: 'AACCK9911K',
    contact_person: 'Mohit Bansal',
    phone: '+919416077890',
    email: 'mohit@kissanoil.in',
    district: 'Panipat',
    state: 'Haryana',
    address: 'Old Grain Market Yard, Panipat',
    procurement_crops: ['mustard', 'gram'],
    procurement_capacity_mt: 8500,
    verification_status: 'verified',
    reliability_score: 95,
    total_deals: 88,
    rating: 4.8,
    created_at: '2023-06-05T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    company_name: 'Ambala Pulse Millers & Co.',
    buyer_type: 'Miller / Processor',
    trade_license_no: 'HR-AMB-APMC-4511',
    gstin: '06AADCA7788J1Z9',
    pan: 'AADCA7788J',
    contact_person: 'Davinder Kumar',
    phone: '+919467033445',
    email: 'davinder@ambalapulse.com',
    district: 'Ambala',
    state: 'Haryana',
    address: 'Ambala Cantt Mandi Complex, Ambala',
    procurement_crops: ['gram', 'wheat'],
    procurement_capacity_mt: 6000,
    verification_status: 'verified',
    reliability_score: 96,
    total_deals: 64,
    rating: 4.7,
    created_at: '2023-08-20T00:00:00Z',
  }
];

// Local persistence helpers for smooth demo / resilience against RLS
const STORAGE_KEYS = {
  BUYERS: 'kisansetu_buyers_list',
  BIDS: 'kisansetu_bids_list',
  CHAT_MESSAGES: 'kisansetu_chat_messages',
  TRANSACTIONS: 'kisansetu_transactions',
  SLOT_CONFIRMATIONS: 'kisansetu_slot_confirmations',
  ACTIVE_BUYER_ID: 'kisansetu_active_buyer_id',
  PAYMENT_REQUESTS: 'kisansetu_payment_requests',
  BUYER_VIOLATIONS: 'kisansetu_buyer_violations',
};

function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// 1. Get all registered buyers
export async function getBuyers(): Promise<Buyer[]> {
  const { data, error } = await supabase.from('buyers').select('*').order('company_name');
  if (error) throw error;
  return (data || []) as Buyer[];
}

export async function getCurrentBuyer(): Promise<Buyer | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('buyers').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data as Buyer | null;
}

// 2. Get specific buyer by ID
export async function getBuyerById(buyerId: string): Promise<Buyer> {
  const buyers = await getBuyers();
  return buyers.find(b => b.id === buyerId) || buyers[0];
}

// 3. Register or sync buyer profile
export async function syncBuyerProfile(
  userIdOrData: string | Partial<Buyer>,
  phoneArg?: string,
  buyerDataArg?: Partial<Buyer>
): Promise<Buyer> {
  let userId: string;
  let phone: string;
  let buyerData: Partial<Buyer>;

  if (typeof userIdOrData === 'string') {
    userId = userIdOrData;
    phone = phoneArg || '+919876543210';
    buyerData = buyerDataArg || {};
  } else {
    buyerData = userIdOrData;
    const { data: { user } } = await supabase.auth.getUser();
    userId = buyerData.id || user?.id || `b${Date.now().toString(16).padStart(12, '0')}-0000-0000-0000-000000000000`.slice(0, 36);
    phone = buyerData.phone || user?.phone || '+919876543210';
  }

  // 1. Ensure row in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      phone: phone,
      role: 'buyer',
      is_active: true,
    });
    if (profileError) {
      console.warn('profiles table insert notice:', profileError.message);
    }
  }

  // 2. Ensure row in buyers
  const tradeLic = buyerData.trade_license_no || `HR-APMC-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: existingBuyer } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  const buyerRecord = {
    id: userId,
    company_name: buyerData.company_name || existingBuyer?.company_name || 'Authorized Grain Buyer',
    buyer_type: buyerData.buyer_type || existingBuyer?.buyer_type || 'Miller / Processor',
    trade_license_no: existingBuyer?.trade_license_no || tradeLic,
    gstin: buyerData.gstin || existingBuyer?.gstin || '06AAACK9999F1Z0',
    pan: buyerData.pan || existingBuyer?.pan || (buyerData.gstin ? buyerData.gstin.slice(2, 12) : 'AAACK9999F'),
    contact_person: buyerData.contact_person || existingBuyer?.contact_person || 'Procurement Executive',
    phone: phone,
    email: buyerData.email || existingBuyer?.email || `${userId.slice(0, 8)}@kisansetu.in`,
    district: buyerData.district || existingBuyer?.district || 'Karnal',
    state: buyerData.state || existingBuyer?.state || 'Haryana',
    address: buyerData.address || existingBuyer?.address || 'APMC Yard, Karnal',
    procurement_crops: buyerData.procurement_crops || existingBuyer?.procurement_crops || ['wheat', 'paddy_basmati'],
    procurement_capacity_mt: buyerData.procurement_capacity_mt || existingBuyer?.procurement_capacity_mt || 5000,
    verification_status: existingBuyer?.verification_status || 'verified',
    reliability_score: existingBuyer?.reliability_score ?? 98,
    total_deals: existingBuyer?.total_deals ?? 0,
    rating: existingBuyer?.rating ?? 4.8,
  };

  const { data: savedBuyer, error: buyerError } = await supabase
    .from('buyers')
    .upsert(buyerRecord)
    .select('*')
    .single();

  if (buyerError) throw buyerError;
  return (savedBuyer || buyerRecord) as Buyer;
}

// ------------------- BIDS SERVICE -------------------

// Pre-seeded initial bids for each crop
export const INITIAL_BIDS: Bid[] = [
  {
    id: 'bid-wht-01',
    listing_id: 'listing-wht-rakesh',
    buyer_id: 'b0000000-0000-0000-0000-000000000001',
    crop_id: 'wheat',
    crop_name: 'Wheat (Sharbati PBW 550)',
    variety: 'Sharbati / PBW 550',
    farmer_id: 'f0000000-0000-0000-0000-000000000001',
    farmer_name: 'Rakesh Singh',
    farmer_village: 'Taraori',
    farmer_district: 'Karnal',
    farmer_phone: '+919876543210',
    quantity_quintals: 60,
    bid_price_per_quintal: 2460,
    price_per_kg: 24.60,
    msp_per_quintal: 2275,
    expected_delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'pending',
    notes: 'Premium offered for moisture < 11.5%. Instant weighbridge DBT settlement within 2 hours of arrival.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    buyer: INITIAL_BUYERS[0]
  },
  {
    id: 'bid-wht-02',
    listing_id: 'listing-wht-rakesh',
    buyer_id: 'b0000000-0000-0000-0000-000000000004',
    crop_id: 'wheat',
    crop_name: 'Wheat (Sharbati PBW 550)',
    variety: 'Sharbati / PBW 550',
    farmer_id: 'f0000000-0000-0000-0000-000000000001',
    farmer_name: 'Rakesh Singh',
    farmer_village: 'Taraori',
    farmer_district: 'Karnal',
    farmer_phone: '+919876543210',
    quantity_quintals: 50,
    bid_price_per_quintal: 2420,
    price_per_kg: 24.20,
    msp_per_quintal: 2275,
    expected_delivery_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'pending',
    notes: 'Direct mill gate unloading at Karnal APMC Gate 2. Bagging provided on-site.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    buyer: INITIAL_BUYERS[3]
  },
  {
    id: 'bid-bas-01',
    listing_id: 'listing-bas-gurpreet',
    buyer_id: 'b0000000-0000-0000-0000-000000000002',
    crop_id: 'paddy_basmati',
    crop_name: 'Paddy (Basmati 1121)',
    variety: 'Basmati 1121 Export Grade',
    farmer_id: 'f0000000-0000-0000-0000-000000000001',
    farmer_name: 'Rakesh Singh',
    farmer_village: 'Taraori',
    farmer_district: 'Karnal',
    farmer_phone: '+919876543210',
    quantity_quintals: 80,
    bid_price_per_quintal: 4380,
    price_per_kg: 43.80,
    msp_per_quintal: 2320,
    expected_delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'pending',
    notes: 'Export lot requirement. Clean grains with zero chalkiness. Full payment via RTGS same day.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    buyer: INITIAL_BUYERS[1]
  },
  {
    id: 'bid-mus-01',
    listing_id: 'listing-mus-balbir',
    buyer_id: 'b0000000-0000-0000-0000-000000000003',
    crop_id: 'mustard',
    crop_name: 'Mustard (RH 725)',
    variety: 'RH 725 Bold',
    farmer_id: 'f0000000-0000-0000-0000-000000000001',
    farmer_name: 'Rakesh Singh',
    farmer_village: 'Taraori',
    farmer_district: 'Karnal',
    farmer_phone: '+919876543210',
    quantity_quintals: 40,
    bid_price_per_quintal: 5880,
    price_per_kg: 58.80,
    msp_per_quintal: 5650,
    expected_delivery_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 86400000 * 6).toISOString(),
    status: 'pending',
    notes: 'Oil percentage bonus: +₹25 per 0.5% oil content over 40%.',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    buyer: INITIAL_BUYERS[2]
  }
];

// 4. Get bids for a specific crop (used when farmer selects a crop in Slot Booking or Listings)
export async function getBidsForCrop(cropId: string): Promise<Bid[]> {
  let query = supabase.from('bids').select('*, crop_listings(*, crops(*)), buyers(*)').order('created_at', { ascending: false });
  if (cropId && cropId !== 'all') query = query.eq('crop_id', cropId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapBid);
}

// 5. Get bids for a specific farmer crop listing
export async function getBidsForListing(listingId: string): Promise<Bid[]> {
  const { data, error } = await supabase.from('bids').select('*, crop_listings(*, crops(*)), buyers(*)').eq('listing_id', listingId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapBid);
}

// 6. Get bids placed by a specific buyer
export async function getBuyerBids(buyerId: string): Promise<Bid[]> {
  const { data, error } = await supabase.from('bids').select('*, crop_listings(*, crops(*)), buyers(*)').eq('buyer_id', buyerId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapBid);
}

function mapBid(row: any): Bid {
  const listing = row.crop_listings || {};
  const crop = listing.crops || {};
  return {
    ...row,
    crop_name: row.crop_name || crop.name_en || row.crop_id,
    variety: row.variety || listing.variety,
    farmer_id: row.farmer_id || listing.farmer_id,
    farmer_name: row.farmer_name || listing.farmers?.name,
    buyer: row.buyers,
    price_per_kg: Number((Number(row.bid_price_per_quintal || 0) / 100).toFixed(2)),
  } as Bid;
}

// 7. Place a new bid (Buyer Side Form)
export async function createBid(newBid: {
  buyer_id: string;
  listing_id?: string;
  crop_id: string;
  crop_name: string;
  variety?: string;
  farmer_id?: string;
  farmer_name?: string;
  farmer_village?: string;
  farmer_district?: string;
  farmer_phone?: string;
  quantity_quintals: number;
  bid_price_per_quintal: number;
  expected_delivery_date?: string;
  notes?: string;
}): Promise<{ data: Bid | null; error: string | null }> {
  try {
    const { data, error } = await supabase.from('bids').insert({
      listing_id: newBid.listing_id,
      buyer_id: newBid.buyer_id,
      crop_id: newBid.crop_id,
      quantity_quintals: newBid.quantity_quintals,
      bid_price_per_quintal: newBid.bid_price_per_quintal,
      expected_delivery_date: newBid.expected_delivery_date,
      notes: newBid.notes,
      status: 'pending',
    }).select('*, crop_listings(*, crops(*)), buyers(*)').single();
    if (error) return { data: null, error: error.message };
    return { data: mapBid(data), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to place bid' };
  }
}

// 8. Accept a bid (Farmer accepts buyer's offer -> produces Slot Confirmation Summary)
export async function acceptBid(
  bidId: string,
  listingId: string,
  farmer: FarmerProfile,
  preferredCentreId?: string
): Promise<{ confirmation: SlotConfirmationSummary | null; error: string | null }> {
  try {
    const { data: targetRow, error: targetError } = await supabase
      .from('bids')
      .select('*, crop_listings(*, crops(*)), buyers(*)')
      .eq('id', bidId)
      .single();
    if (targetError) throw targetError;
    const targetBid = mapBid(targetRow);
    if (!targetBid) {
      return { confirmation: null, error: 'Bid not found' };
    }

    const { error: acceptError } = await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
    if (acceptError) throw acceptError;
    const { error: rejectError } = await supabase.from('bids').update({ status: 'rejected' }).eq('listing_id', listingId).neq('id', bidId);
    if (rejectError) throw rejectError;
    const { error: listingError } = await supabase.from('crop_listings').update({ status: 'bid_accepted' }).eq('id', listingId);
    if (listingError) throw listingError;

    // Generate Slot Confirmation Summary
    const buyer = targetBid.buyer || await getBuyerById(targetBid.buyer_id);
    const bookingId = `BK-${Date.now().toString(16).slice(-6).toUpperCase()}`;
    const tokenNumber = Math.floor(100 + Math.random() * 900);
    const slotNumber = `SLOT-APMC-${tokenNumber}`;
    const totalAmount = Math.round(targetBid.quantity_quintals * targetBid.bid_price_per_quintal);

    const confirmation: SlotConfirmationSummary = {
      bookingId,
      slotNumber,
      tokenNumber,
      buyer: {
        id: buyer.id,
        company_name: buyer.company_name,
        buyer_type: buyer.buyer_type,
        contact_person: buyer.contact_person,
        phone: buyer.phone,
        trade_license_no: buyer.trade_license_no,
        gstin: buyer.gstin,
        reliability_score: buyer.reliability_score,
      },
      centre: {
        id: preferredCentreId || 'centre-karnal-apmc',
        name: 'Karnal Main APMC Mandi Yard',
        district: farmer.district || 'Karnal',
        gate: 'Gate 2 (Weighbridge & Electronic Scale)',
      },
      date: targetBid.expected_delivery_date || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      timeRange: '08:30 AM – 10:30 AM (Priority Unloading)',
      crop: {
        id: targetBid.crop_id || 'wheat',
        name: targetBid.crop_name || 'Wheat (Sharbati PBW 550)',
        variety: targetBid.variety || 'Sharbati / PBW 550',
      },
      quantity_quintals: targetBid.quantity_quintals,
      quantity_kg: targetBid.quantity_quintals * 100,
      agreed_price_per_quintal: targetBid.bid_price_per_quintal,
      agreed_price_per_kg: targetBid.price_per_kg,
      total_amount: totalAmount,
      acceptedAt: new Date().toISOString(),
    };

    // Store confirmation
    const savedConfirmations = getLocalItem<SlotConfirmationSummary[]>(STORAGE_KEYS.SLOT_CONFIRMATIONS, []);
    setLocalItem(STORAGE_KEYS.SLOT_CONFIRMATIONS, [confirmation, ...savedConfirmations]);

    // Also record transaction for Buyer
    const newTransaction: BuyerTransaction = {
      id: `TXN-${Date.now().toString(16).slice(-6).toUpperCase()}`,
      deal_id: targetBid.id,
      booking_id: bookingId,
      farmer_name: farmer.name,
      farmer_village: farmer.village,
      crop_name: targetBid.crop_name || 'Wheat',
      variety: targetBid.variety || 'Standard Quality',
      quantity_quintals: targetBid.quantity_quintals,
      agreed_rate_per_quintal: targetBid.bid_price_per_quintal,
      gross_amount: totalAmount,
      apmc_market_fee: Math.round(totalAmount * 0.015),
      rdf_cess: Math.round(totalAmount * 0.01),
      net_payable_to_farmer: totalAmount,
      payment_status: 'in_escrow',
      settlement_due_date: confirmation.date,
      weighbridge_slip_no: `WB-${Math.floor(10000 + Math.random() * 90000)}`,
      payment_ref: `DBT-${Math.floor(100000000 + Math.random() * 900000000)}`,
      created_at: new Date().toISOString(),
    };

    const currentTxns = getLocalItem<BuyerTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    setLocalItem(STORAGE_KEYS.TRANSACTIONS, [newTransaction, ...currentTxns]);

    // Seed initial greeting message in in-app chat thread
    await sendChatMessage({
      booking_id: bookingId,
      farmer_id: farmer.id,
      buyer_id: buyer.id,
      sender: 'system',
      sender_name: 'KisanSetu APMC Escrow',
      text: `Deal Confirmed! Bid of ₹${targetBid.price_per_kg}/kg (₹${targetBid.bid_price_per_quintal}/Qtl) for ${targetBid.quantity_quintals} Quintals accepted. Token ${slotNumber} scheduled at Karnal APMC Gate 2.`,
    });

    return { confirmation, error: null };
  } catch (err: any) {
    return { confirmation: null, error: err.message || 'Failed to accept bid' };
  }
}

// ------------------- IN-APP MESSAGING / CHAT SERVICE -------------------

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-01',
    booking_id: 'BK-SAMPLE',
    farmer_id: 'f0000000-0000-0000-0000-000000000001',
    buyer_id: 'b0000000-0000-0000-0000-000000000001',
    sender: 'buyer',
    sender_name: 'Suresh Singhal (Karnal Roller Flour Mills)',
    text: 'Namaste Rakesh ji! We have reserved your delivery slot for Thursday 08:30 AM at Gate 2. Is moisture tested under 12%?',
    sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_read: true,
  },
  {
    id: 'msg-02',
    booking_id: 'BK-SAMPLE',
    farmer_id: 'f0000000-0000-0000-0000-000000000001',
    buyer_id: 'b0000000-0000-0000-0000-000000000001',
    sender: 'farmer',
    sender_name: 'Rakesh Singh',
    text: 'Namaste Suresh ji, yes, sun-dried on tarpaulin, moisture is approx 11.2%. Will reach Gate 2 with 60 quintals on tractor trolley HR 05 Z 7741.',
    sent_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    is_read: true,
  }
];

// 9. Fetch chat messages
export async function getChatMessages(bookingOrDealId?: string): Promise<ChatMessage[]> {
  let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
  if (bookingOrDealId) query = query.eq('booking_id', bookingOrDealId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    thread_id: m.thread_id,
    booking_id: bookingOrDealId,
    farmer_id: m.sender_role === 'farmer' ? m.sender_id : '',
    buyer_id: m.sender_role === 'buyer' ? m.sender_id : '',
    sender: m.sender_role || 'buyer',
    sender_name: m.sender_role === 'farmer' ? 'Farmer' : 'Buyer Representative',
    text: m.message_text || m.text || '',
    sent_at: m.created_at,
    is_read: m.is_read
  }));
}

// 10. Send a message
export async function sendChatMessage(message: {
  booking_id?: string;
  farmer_id: string;
  buyer_id: string;
  sender: 'farmer' | 'buyer' | 'system';
  sender_name: string;
  text: string;
}): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now().toString(16)}`,
    booking_id: message.booking_id,
    farmer_id: message.farmer_id,
    buyer_id: message.buyer_id,
    sender: message.sender,
    sender_name: message.sender_name,
    text: message.text,
    sent_at: new Date().toISOString(),
    is_read: true,
  };

  const { data, error } = await supabase.from('chat_messages').insert({
    sender_id: message.sender === 'farmer' ? message.farmer_id : message.buyer_id,
    sender_role: message.sender,
    message_text: message.text,
    is_read: false,
    booking_id: message.booking_id,
  }).select('*').single();
  if (error) throw error;
  return {
    ...newMsg,
    id: data.id,
    thread_id: data.thread_id,
    sent_at: data.created_at || newMsg.sent_at,
  };
}

// 11. Subscribe to Live Realtime chat updates
export function subscribeToChatMessages(
  bookingOrDealId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`public:chat_messages:${bookingOrDealId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        const row = payload.new;
        const msg: ChatMessage = {
          id: row.id,
          booking_id: bookingOrDealId,
          farmer_id: row.sender_role === 'farmer' ? row.sender_id : '',
          buyer_id: row.sender_role === 'buyer' ? row.sender_id : '',
          sender: row.sender_role || 'buyer',
          sender_name: row.sender_role === 'farmer' ? 'Farmer' : 'Buyer Representative',
          text: row.message_text || '',
          sent_at: row.created_at || new Date().toISOString(),
          is_read: row.is_read
        };
        onNewMessage(msg);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ------------------- AVAILABLE FARMER LOTS (FOR BUYER DASHBOARD) -------------------

export async function getAvailableProduceLots(cropId?: string): Promise<CropListing[]> {
  try {
    let query = supabase.from('crop_listings').select(`
      *,
      crops (
        id,
        name_en,
        name_hi,
        category,
        current_msp_per_quintal,
        is_procurement_active
      )
    `).in('status', ['active', 'draft']);

    if (cropId && cropId !== 'all') {
      query = query.eq('crop_id', cropId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        ...row,
        crop: row.crops,
        farmer_name: 'Farmer Partner',
        farmer_village: 'Karnal District',
        farmer_phone: '+919876543210',
      })) as CropListing[];
    }
  } catch (e) {
    console.warn('Could not query crop_listings from Supabase:', e);
  }

  return [];

  // Pre-seeded available produce lots for realistic buyer browsing
  const sampleLots: CropListing[] = [
    {
      id: 'lot-01',
      farmer_id: 'f0000000-0000-0000-0000-000000000001',
      crop_id: 'wheat',
      variety: 'Sharbati / PBW 550 Premium',
      quantity_quintals: 80,
      expected_price_per_quintal: 2450,
      harvest_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      moisture_percentage: 11.2,
      status: 'active',
      suggested_slot_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      suggested_centre_id: 'centre-karnal-apmc',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      farmer_name: 'Rakesh Singh',
      farmer_village: 'Taraori',
      farmer_district: 'Karnal',
      farmer_phone: '+919876543210',
      crop: FALLBACK_CROPS[0],
    },
    {
      id: 'lot-02',
      farmer_id: 'f0000000-0000-0000-0000-000000000002',
      crop_id: 'paddy_basmati',
      variety: 'Basmati 1121 Extra Long Grain',
      quantity_quintals: 120,
      expected_price_per_quintal: 4350,
      harvest_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      moisture_percentage: 11.8,
      status: 'active',
      suggested_slot_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      suggested_centre_id: 'centre-karnal-apmc',
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
      farmer_name: 'Gurpreet Kaur',
      farmer_village: 'Nilokheri',
      farmer_district: 'Karnal',
      farmer_phone: '+919876500001',
      crop: FALLBACK_CROPS[1],
    },
    {
      id: 'lot-03',
      farmer_id: 'f0000000-0000-0000-0000-000000000003',
      crop_id: 'mustard',
      variety: 'RH 725 High Oil Bold',
      quantity_quintals: 45,
      expected_price_per_quintal: 5850,
      harvest_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      moisture_percentage: 7.8,
      status: 'active',
      suggested_slot_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      suggested_centre_id: 'centre-kurukshetra',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      farmer_name: 'Balbir Singh',
      farmer_village: 'Indri',
      farmer_district: 'Karnal',
      farmer_phone: '+919876511223',
      crop: FALLBACK_CROPS[2],
    },
    {
      id: 'lot-04',
      farmer_id: 'f0000000-0000-0000-0000-000000000004',
      crop_id: 'gram',
      variety: 'JG 14 Desi Chana',
      quantity_quintals: 55,
      expected_price_per_quintal: 5600,
      harvest_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      moisture_percentage: 9.5,
      status: 'active',
      suggested_slot_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      suggested_centre_id: 'centre-ambala-cantt',
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      farmer_name: 'Harpreet Singh',
      farmer_village: 'Shahbad',
      farmer_district: 'Kurukshetra',
      farmer_phone: '+919876599887',
      crop: FALLBACK_CROPS[3],
    }
  ];

  if (cropId && cropId !== 'all') {
    return sampleLots.filter(l => l.crop_id === cropId);
  }
  return sampleLots;
}

// 12. Buyer Transactions (settlements, escrow, weighbridge records)
export async function getBuyerTransactions(buyerId: string): Promise<BuyerTransaction[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, bookings(*, farmers(name, village), crops(name_en))')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    deal_id: row.bid_id || row.booking_id,
    booking_id: row.booking_id,
    farmer_name: row.bookings?.farmers?.name || row.farmer_name || '',
    farmer_village: row.bookings?.farmers?.village || '',
    crop_name: row.bookings?.crops?.name_en || row.crop_name || '',
    variety: row.variety || '',
    quantity_quintals: Number(row.quantity_quintals || row.bookings?.actual_quantity_quintals || 0),
    agreed_rate_per_quintal: Number(row.rate_per_quintal || 0),
    gross_amount: Number(row.final_amount || row.amount || 0),
    apmc_market_fee: Number(row.apmc_market_fee || 0),
    rdf_cess: Number(row.rdf_cess || 0),
    net_payable_to_farmer: Number(row.final_amount || row.amount || 0),
    payment_status: row.status || row.payment_status || 'pending',
    settlement_due_date: row.deadline || row.created_at,
    weighbridge_slip_no: row.weighbridge_slip_no,
    payment_ref: row.payment_ref,
    created_at: row.created_at,
  }));
}

// ============================================================================
// 13. Procurement-Day Payment Flow & Requests (Farmer + Buyer + Admin)
// ============================================================================

export const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [
  {
    id: 'PAY-KRN-2023-018',
    booking_id: 'book-seed-18',
    token_number: 18,
    buyer_id: 'buyer-agro-procure',
    buyer_name: 'Haryana Agro Millers Ltd.',
    farmer_id: 'farmer-rakesh',
    farmer_name: 'Rakesh Singh',
    farmer_phone: '+91 98765 43210',
    farmer_bank_account: 'HDFC Bank (•••• 4812)',
    crop_name: 'Wheat (Sharbati PBW 550)',
    variety: 'PBW 550',
    quantity_quintals: 60,
    rate_per_quintal: 2460,
    final_amount: 147600,
    quality_grade: 'Grade A',
    moisture_percentage: 11.2,
    status: 'paid',
    deadline: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    paid_at: new Date(Date.now() - 1800000).toISOString(),
    payment_ref: 'DBT-PFMS-994821041',
    mandi_centre_name: 'Karnal APMC (Sector 6)',
  },
  {
    id: 'PAY-KRN-2023-024',
    booking_id: 'book-seed-24',
    token_number: 24,
    buyer_id: 'buyer-agro-procure',
    buyer_name: 'Haryana Agro Millers Ltd.',
    farmer_id: 'farmer-rakesh',
    farmer_name: 'Rakesh Singh',
    farmer_phone: '+91 98765 43210',
    farmer_bank_account: 'HDFC Bank (•••• 4812)',
    crop_name: 'Wheat (Sharbati PBW 550)',
    variety: 'PBW 550',
    quantity_quintals: 70,
    rate_per_quintal: 2460,
    final_amount: 172200,
    quality_grade: 'Grade A',
    moisture_percentage: 11.5,
    status: 'pending',
    deadline: new Date(Date.now() + 5700000).toISOString(), // ~95 mins remaining
    created_at: new Date(Date.now() - 1500000).toISOString(),
    mandi_centre_name: 'Karnal APMC (Sector 6)',
  },
  {
    id: 'PAY-KRN-2023-021',
    booking_id: 'book-seed-21',
    token_number: 21,
    buyer_id: 'buyer-cargill-bulk',
    buyer_name: 'Cargill India Agri Solutions',
    farmer_id: 'farmer-gurpreet',
    farmer_name: 'Gurpreet Kaur',
    farmer_phone: '+91 98765 00001',
    farmer_bank_account: 'SBI (•••• 7731)',
    crop_name: 'Paddy (Basmati 1121)',
    variety: 'Basmati 1121',
    quantity_quintals: 85,
    rate_per_quintal: 4380,
    final_amount: 372300,
    quality_grade: 'Grade A',
    moisture_percentage: 13.8,
    status: 'pending',
    deadline: new Date(Date.now() + 2700000).toISOString(), // ~45 mins remaining
    created_at: new Date(Date.now() - 4500000).toISOString(),
    mandi_centre_name: 'Karnal APMC (Sector 6)',
  },
  {
    id: 'PAY-KRN-2023-015',
    booking_id: 'book-seed-15',
    token_number: 15,
    buyer_id: 'buyer-golden-grains',
    buyer_name: 'Golden Grains Export House',
    farmer_id: 'farmer-balbir',
    farmer_name: 'Balbir Singh',
    farmer_phone: '+91 98765 11223',
    farmer_bank_account: 'PNB (•••• 3390)',
    crop_name: 'Mustard (RH 725)',
    variety: 'RH 725',
    quantity_quintals: 40,
    rate_per_quintal: 5850,
    final_amount: 234000,
    quality_grade: 'Grade A',
    moisture_percentage: 7.8,
    status: 'paid',
    deadline: new Date(Date.now() - 14400000).toISOString(),
    created_at: new Date(Date.now() - 18000000).toISOString(),
    paid_at: new Date(Date.now() - 15000000).toISOString(),
    payment_ref: 'DBT-PFMS-993108842',
    mandi_centre_name: 'Karnal APMC (Sector 6)',
  }
];

export const INITIAL_BUYER_VIOLATIONS: BuyerViolation[] = [
  {
    id: 'VIOL-2023-01',
    buyer_id: 'buyer-northern-feed',
    buyer_name: 'Northern India Feed Industries',
    violation_type: 'Payment Overdue past 2-Hour APMC Deadline',
    penalty_points: 15,
    notes: 'Failed to disburse payment on Booking #BK-HR-7721 (50Q Gram). Reliability score decreased by 15%.',
    level: '1st Warning',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'active',
  },
  {
    id: 'VIOL-2023-02',
    buyer_id: 'buyer-desi-traders',
    buyer_name: 'Desi Mandi Grain Traders',
    violation_type: 'Bid Default & Unpaid Settlement',
    penalty_points: 25,
    notes: '2nd violation within 30 days. Payout overdue by >6 hours. Purchasing privileges restricted.',
    level: '2nd Warning / Restricted',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'active',
  }
];

export async function getPaymentRequests(filters?: {
  buyer_id?: string;
  farmer_id?: string;
  status?: string;
}): Promise<PaymentRequest[]> {
  let query = supabase.from('payments').select('*, bookings(token_number, crop_type)').order('created_at', { ascending: false });
  if (filters?.buyer_id) query = query.eq('buyer_id', filters.buyer_id);
  if (filters?.farmer_id) query = query.eq('farmer_id', filters.farmer_id);
  if (filters?.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...row,
    token_number: row.token_number || row.bookings?.token_number,
    crop_name: row.crop_name || row.bookings?.crop_type,
  })) as PaymentRequest[];
}

export async function recordProcurement(
  data: ProcurementRecordingData
): Promise<{ success: boolean; paymentRequest: PaymentRequest }> {
  const deadlineDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // exactly 2 hours deadline
  const reqId = `PAY-KRN-${Date.now().toString().slice(-6)}`;

  const newPaymentRequest: PaymentRequest = {
    id: reqId,
    booking_id: data.bookingId,
    token_number: data.tokenNumber,
    buyer_id: data.assignedBuyerId || 'buyer-agro-procure',
    buyer_name: data.assignedBuyerName || 'Haryana Agro Millers Ltd.',
    farmer_id: data.farmerId,
    farmer_name: data.farmerName,
    crop_name: data.cropName,
    quantity_quintals: data.netWeightQuintals,
    rate_per_quintal: data.agreedPricePerQuintal,
    final_amount: data.finalAmount,
    quality_grade: data.qualityGrade,
    moisture_percentage: data.moisturePercentage,
    status: 'pending',
    deadline: deadlineDate.toISOString(),
    created_at: new Date().toISOString(),
    mandi_centre_name: 'Karnal APMC (Sector 6)',
  };

  const { data: payment, error } = await supabase.from('payments').insert({
    id: newPaymentRequest.id,
    booking_id: newPaymentRequest.booking_id,
    buyer_id: newPaymentRequest.buyer_id,
    farmer_id: newPaymentRequest.farmer_id,
    crop_name: newPaymentRequest.crop_name,
    quantity_quintals: newPaymentRequest.quantity_quintals,
    rate_per_quintal: newPaymentRequest.rate_per_quintal,
    final_amount: newPaymentRequest.final_amount,
    quality_grade: newPaymentRequest.quality_grade,
    moisture_percentage: newPaymentRequest.moisture_percentage,
    status: 'pending',
    deadline: newPaymentRequest.deadline,
  }).select('*').single();
  if (error) throw error;

  // Also add to Buyer Transactions
  const newTxn: BuyerTransaction = {
    id: `TXN-${Date.now().toString().slice(-6)}`,
    deal_id: reqId,
    booking_id: data.bookingId,
    farmer_name: data.farmerName,
    farmer_village: 'Taraori',
    crop_name: data.cropName,
    variety: 'Standard FAQ',
    quantity_quintals: data.netWeightQuintals,
    agreed_rate_per_quintal: data.agreedPricePerQuintal,
    gross_amount: data.finalAmount,
    apmc_market_fee: Math.round(data.finalAmount * 0.015),
    rdf_cess: Math.round(data.finalAmount * 0.01),
    net_payable_to_farmer: data.finalAmount,
    payment_status: 'pending',
    settlement_due_date: deadlineDate.toISOString().split('T')[0],
    weighbridge_slip_no: `WB-${Math.floor(10000 + Math.random() * 90000)}`,
    created_at: new Date().toISOString(),
  };

  return { success: true, paymentRequest: (payment || newPaymentRequest) as PaymentRequest };
}

export async function payPaymentRequest(
  paymentId: string,
  referenceNo?: string
): Promise<{ success: boolean; paymentRequest: PaymentRequest }> {
  const ref = referenceNo || `DBT-PFMS-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase.from('payments').update({ status: 'paid', paid_at: now, payment_ref: ref }).eq('id', paymentId).select('*').single();
  if (error) throw error;
  return { success: true, paymentRequest: data as PaymentRequest };
}

export async function triggerOverduePaymentViolation(
  paymentId: string
): Promise<{ success: boolean; violation: BuyerViolation }> {
  const { data: targetReq, error: paymentError } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (paymentError) throw paymentError;
  await supabase.from('payments').update({ status: 'overdue' }).eq('id', paymentId);
  const buyerId = targetReq.buyer_id;
  const buyerName = targetReq.buyer_name || 'Buyer';
  const { count: buyerViolCount } = await supabase.from('buyer_violations').select('id', { count: 'exact', head: true }).eq('buyer_id', buyerId);

  let level: BuyerViolation['level'] = '1st Warning';
  let penaltyPoints = 15;

  if (buyerViolCount === 0) {
    level = '1st Warning';
    penaltyPoints = 15;
  } else if (buyerViolCount === 1) {
    level = '2nd Warning / Restricted';
    penaltyPoints = 25;
  } else {
    level = '3rd Strike - Blocked';
    penaltyPoints = 35;
  }

  const newViolation: BuyerViolation = {
    id: `VIOL-${Date.now().toString().slice(-6)}`,
    buyer_id: buyerId,
    buyer_name: buyerName,
    violation_type: 'Payment Overdue past 2-Hour APMC Mandatory SLA',
    penalty_points: penaltyPoints,
    notes: `Overdue payment of ₹${Number(targetReq.final_amount || 0).toLocaleString('en-IN')} on Booking #${targetReq.booking_id}. ${level}.`,
    level: level,
    payment_request_id: paymentId,
    booking_id: targetReq?.booking_id,
    created_at: new Date().toISOString(),
    status: 'active',
  };

  const { error } = await supabase.from('buyer_violations').insert(newViolation);
  if (error) throw error;

  return { success: true, violation: newViolation };
}

export async function getBuyerViolations(buyerId?: string): Promise<BuyerViolation[]> {
  let query = supabase.from('buyer_violations').select('*').order('created_at', { ascending: false });
  if (buyerId) query = query.eq('buyer_id', buyerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BuyerViolation[];
}

export async function unblockBuyer(buyerId: string): Promise<void> {
  const { error } = await supabase.from('buyers').update({ verification_status: 'verified' }).eq('id', buyerId);
  if (error) throw error;
}

// 14. Farmer Transaction History List
export interface FarmerTransactionRecord {
  id: string;
  bookingId: string;
  tokenNumber: number;
  date: string;
  cropName: string;
  variety: string;
  quantityQuintals: number;
  buyerName: string;
  pricePerQuintal: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  paymentRef?: string;
  paidAt?: string;
  mandiCentreName: string;
  qualityGrade: string;
}

export async function getFarmerTransactions(
  farmerId: string
): Promise<FarmerTransactionRecord[]> {
  const reqs = await getPaymentRequests({ farmer_id: farmerId });

  // Map to FarmerTransactionRecord
  return reqs.map(r => ({
    id: r.id,
    bookingId: r.booking_id,
    tokenNumber: r.token_number,
    date: r.created_at.split('T')[0],
    cropName: r.crop_name,
    variety: r.variety || 'PBW 550 Standard',
    quantityQuintals: r.quantity_quintals,
    buyerName: r.buyer_name,
    pricePerQuintal: r.rate_per_quintal,
    totalAmount: r.final_amount,
    paymentStatus: r.status,
    paymentRef: r.payment_ref,
    paidAt: r.paid_at,
    mandiCentreName: r.mandi_centre_name,
    qualityGrade: r.quality_grade,
  }));
}

