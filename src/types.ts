export type Language = 'en' | 'hi';

export type UserRole = 'farmer' | 'buyer' | 'admin' | 'staff';

export interface Profile {
  id: string;
  phone: string;
  email?: string;
  role: 'farmer' | 'buyer' | 'admin';
  is_active: boolean;
  created_at?: string;
}

export interface FarmerRecord {
  id: string;
  name: string;
  name_hi?: string;
  registration_no: string;
  village: string;
  district: string;
  state: string;
  land_acres: number;
  aadhaar_masked?: string;
  bank_account_masked?: string;
  ifsc_code?: string;
  created_at?: string;
}

export interface Crop {
  id: string;
  name_en: string;
  name_hi: string;
  category: string;
  current_msp_per_quintal: number;
  quality_parameters?: Record<string, any>;
  is_procurement_active: boolean;
}

export type ListingStatus = 'draft' | 'active' | 'bid_accepted' | 'sold' | 'withdrawn';

export interface CropListing {
  id: string;
  farmer_id: string;
  crop_id: string;
  variety?: string;
  quantity_quintals: number;
  expected_price_per_quintal?: number;
  harvest_date: string;
  moisture_percentage?: number;
  images_url?: string[];
  status: ListingStatus;
  suggested_slot_date?: string;
  suggested_centre_id?: string;
  created_at?: string;
  // Joined/enriched fields
  crop?: Crop;
  farmer_name?: string;
  farmer_village?: string;
  farmer_district?: string;
  farmer_phone?: string;
}

export type BuyerType = 
  | 'Miller / Processor' 
  | 'Bulk Exporter' 
  | 'APMC Commission Agent' 
  | 'Modern Retailer' 
  | 'Feed Manufacturer';

export interface Buyer {
  id: string;
  company_name: string;
  buyer_type: BuyerType;
  trade_license_no: string;
  gstin: string;
  pan?: string;
  contact_person: string;
  phone: string;
  email?: string;
  district: string;
  state: string;
  address?: string;
  procurement_crops: string[];
  procurement_capacity_mt: number;
  verification_status: 'verified' | 'pending' | 'rejected';
  documents_url?: string[];
  reliability_score: number; // e.g. 98%
  total_deals: number;
  rating: number; // e.g. 4.8
  created_at?: string;
}

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Bid {
  id: string;
  listing_id: string;
  buyer_id: string;
  crop_id?: string;
  crop_name?: string;
  variety?: string;
  farmer_id?: string;
  farmer_name?: string;
  farmer_village?: string;
  farmer_district?: string;
  farmer_phone?: string;
  quantity_quintals: number;
  bid_price_per_quintal: number;
  price_per_kg: number; // calculated as bid_price_per_quintal / 100
  msp_per_quintal?: number;
  expected_delivery_date?: string;
  valid_until?: string;
  status: BidStatus;
  notes?: string;
  created_at: string;
  buyer?: Buyer;
}

export interface ChatMessage {
  id: string;
  thread_id?: string;
  booking_id?: string;
  farmer_id: string;
  buyer_id: string;
  sender: 'farmer' | 'buyer' | 'system';
  sender_name: string;
  text: string;
  sent_at: string;
  is_read?: boolean;
}

export interface SlotConfirmationSummary {
  bookingId: string;
  slotNumber: string;
  tokenNumber: number;
  buyer: {
    id: string;
    company_name: string;
    buyer_type: string;
    contact_person: string;
    phone: string;
    trade_license_no: string;
    gstin: string;
    reliability_score: number;
  };
  centre: {
    id: string;
    name: string;
    district: string;
    gate: string;
  };
  date: string;
  timeRange: string;
  crop: {
    id: string;
    name: string;
    variety: string;
  };
  quantity_quintals: number;
  quantity_kg: number;
  agreed_price_per_quintal: number;
  agreed_price_per_kg: number;
  total_amount: number;
  acceptedAt: string;
}

export interface BuyerTransaction {
  id: string;
  deal_id: string;
  booking_id?: string;
  farmer_name: string;
  farmer_village: string;
  crop_name: string;
  variety: string;
  quantity_quintals: number;
  agreed_rate_per_quintal: number;
  gross_amount: number;
  apmc_market_fee: number; // 1.5%
  rdf_cess: number; // 1.0%
  net_payable_to_farmer: number;
  payment_status: 'pending' | 'in_escrow' | 'released_to_farmer';
  settlement_due_date: string;
  weighbridge_slip_no?: string;
  payment_ref?: string;
  created_at: string;
}

export interface CropMarketData {
  id: string;
  crop_id: string;
  district: string;
  state: string;
  date: string;
  demand_index: number;
  total_estimated_supply_quintals: number;
  min_price_per_quintal: number;
  max_price_per_quintal: number;
  modal_price_per_quintal: number;
  price_forecast_next_week?: number;
  recommendation_text?: string;
  updated_at?: string;
  crop?: Crop;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  gates: string[];
  activeCrops: string[];
  operationalHours: string;
  contactPhone: string;
  dailyCapacity: number;
}

export interface TimeSlot {
  id: string;
  centreId: string;
  date: string; // YYYY-MM-DD
  timeRange: string;
  totalCapacity: number;
  bookedCount: number;
  remainingSlots: number;
}

export interface FarmerProfile {
  id: string;
  name: string;
  nameHi: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  landAcres: number;
  registrationNo: string;
  registeredDate: string;
  bankAccountMasked: string;
  preferredCrops: string[];
}

export type BookingStatus = 
  | 'registered' 
  | 'slot_booked' 
  | 'at_centre' 
  | 'served' 
  | 'payment_processed' 
  | 'cancelled';

export interface Booking {
  id: string;
  tokenNumber: number;
  tokenDate: string; // YYYY-MM-DD
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  centreId: string;
  centreName: string;
  date: string; // YYYY-MM-DD
  slotId: string;
  timeRange: string;
  cropType: string;
  estimatedQuantityQuintals: number;
  actualQuantityQuintals?: number;
  mspRatePerQuintal: number;
  vehicleNo: string;
  status: BookingStatus;
  checkInTime?: string;
  servedTime?: string;
  paymentStatus: 'pending' | 'in_process' | 'processed';
  paymentAmount?: number;
  paymentRef?: string;
  paymentDate?: string;
  createdDate: string;
}

export interface CentreQueueState {
  centreId: string;
  date: string;
  currentServingToken: number;
  totalTokensIssued: number;
  averageMinutesPerToken: number;
  counterStatus: 'active' | 'break' | 'closed';
  lastUpdated: string;
}

export interface NotificationItem {
  id: string;
  farmerId: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  channel: 'sms' | 'app';
  timestamp: string;
  read: boolean;
  type: 'booking' | 'queue_alert' | 'payment' | 'info';
}

export type PaymentRequestStatus = 'pending' | 'paid' | 'overdue';

export interface PaymentRequest {
  id: string;
  booking_id: string;
  token_number: number;
  buyer_id: string;
  buyer_name: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone?: string;
  farmer_bank_account?: string;
  crop_name: string;
  variety?: string;
  quantity_quintals: number;
  rate_per_quintal: number;
  final_amount: number;
  quality_grade: string;
  moisture_percentage?: number;
  status: PaymentRequestStatus;
  deadline: string; // ISO string (+2 hours)
  created_at: string;
  paid_at?: string;
  payment_ref?: string;
  mandi_centre_name: string;
}

export interface BuyerViolation {
  id: string;
  buyer_id: string;
  buyer_name: string;
  violation_type: string; // e.g. "Payment Overdue", "Bid Default", "Contract Non-Performance"
  penalty_points: number; // e.g. 10 or 25
  notes: string;
  level: '1st Warning' | '2nd Warning / Restricted' | '3rd Strike - Blocked';
  booking_id?: string;
  payment_request_id?: string;
  created_at: string;
  status: 'active' | 'resolved';
}

export interface ProcurementRecordingData {
  bookingId: string;
  tokenNumber: number;
  farmerName: string;
  farmerId: string;
  cropName: string;
  vehicleNo: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightQuintals: number;
  qualityGrade: 'Grade A' | 'Grade B' | 'Standard' | 'FAQ (Fair Average Quality)';
  moisturePercentage: number;
  agreedPricePerQuintal: number;
  finalAmount: number;
  assignedBuyerId: string;
  assignedBuyerName: string;
}

export interface CropPriorityItem {
  id: string;
  farmerName: string;
  tokenNumber: number;
  cropName: string;
  variety: string;
  quantityQuintals: number;
  vehicleNo: string;
  slotTime: string;
  perishabilityScore: number; // 1-10
  demandScore: number; // 1-10
  waitTimeMins: number;
  calculatedScore: number; // 0-100
  tier: 'High' | 'Medium' | 'Standard';
  primaryFactor: string;
  status: 'waiting' | 'called' | 'processing' | 'completed';
}

