import { 
  ProcurementCentre, 
  TimeSlot, 
  FarmerProfile, 
  Booking, 
  CentreQueueState, 
  NotificationItem 
} from './types';

export const api = {
  // Centres
  async getCentres(): Promise<ProcurementCentre[]> {
    try {
      const res = await fetch('/api/centres');
      if (!res.ok) throw new Error('Failed to fetch centres');
      return await res.json();
    } catch (e) {
      console.error('getCentres error', e);
      return [];
    }
  },

  async getCentre(id: string, date?: string): Promise<ProcurementCentre & { queue: CentreQueueState }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`/api/centres/${id}${query}`);
    if (!res.ok) throw new Error('Failed to fetch centre');
    return await res.json();
  },

  // Slots
  async getSlots(centreId: string, date: string): Promise<TimeSlot[]> {
    try {
      const res = await fetch(`/api/slots?centreId=${encodeURIComponent(centreId)}&date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      return await res.json();
    } catch (e) {
      console.error('getSlots error', e);
      return [];
    }
  },

  // Bookings
  async getBookings(params?: { farmerId?: string; centreId?: string; date?: string }): Promise<Booking[]> {
    try {
      const query = new URLSearchParams();
      if (params?.farmerId) query.set('farmerId', params.farmerId);
      if (params?.centreId) query.set('centreId', params.centreId);
      if (params?.date) query.set('date', params.date);
      const res = await fetch(`/api/bookings?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return await res.json();
    } catch (e) {
      console.error('getBookings error', e);
      return [];
    }
  },

  async getBooking(id: string): Promise<Booking & { queue: { currentServingToken: number; tokensAhead: number; estimatedWaitMins: number } }> {
    const res = await fetch(`/api/bookings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch booking');
    return await res.json();
  },

  async createBooking(data: {
    farmerId: string;
    centreId: string;
    date: string;
    slotId: string;
    timeRange: string;
    cropType: string;
    estimatedQuantityQuintals: number;
    vehicleNo: string;
  }): Promise<{ success: boolean; booking: Booking; notification?: NotificationItem }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create booking');
    return json;
  },

  async updateBookingStatus(id: string, updates: {
    status?: string;
    actualQuantityQuintals?: number;
    paymentStatus?: string;
    paymentAmount?: number;
    paymentRef?: string;
  }): Promise<{ success: boolean; booking: Booking }> {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update status');
    return json;
  },

  async cancelBooking(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to cancel booking');
    return json;
  },

  // Queue
  async getQueue(centreId: string, date?: string): Promise<CentreQueueState & { waitingCount: number; estimatedWaitTimeMins: number }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`/api/queue/${centreId}${query}`);
    if (!res.ok) throw new Error('Failed to fetch queue');
    return await res.json();
  },

  async advanceQueue(centreId: string, date?: string): Promise<{ success: boolean; currentServingToken: number; calledBooking: Booking | null }> {
    const res = await fetch('/api/queue/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ centreId, date })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to advance queue');
    return json;
  },

  async resetQueue(centreId: string, date?: string): Promise<{ success: boolean; queue: CentreQueueState }> {
    const res = await fetch('/api/queue/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ centreId, date })
    });
    return await res.json();
  },

  // Farmers
  async getFarmers(): Promise<FarmerProfile[]> {
    try {
      const res = await fetch('/api/farmers');
      if (!res.ok) throw new Error('Failed to fetch farmers');
      return await res.json();
    } catch (e) {
      console.error('getFarmers error', e);
      return [];
    }
  },

  async registerFarmer(data: Partial<FarmerProfile>): Promise<{ success: boolean; farmer: FarmerProfile }> {
    const res = await fetch('/api/farmers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to register farmer');
    return json;
  },

  // Auth
  async sendOtp(phone: string): Promise<{ success: boolean; simulatedOtp: string }> {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  },

  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; farmer: FarmerProfile; token: string }> {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Invalid OTP');
    return json;
  },

  // Notifications
  async getNotifications(farmerId?: string): Promise<NotificationItem[]> {
    try {
      const query = farmerId ? `?farmerId=${encodeURIComponent(farmerId)}` : '';
      const res = await fetch(`/api/notifications${query}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return await res.json();
    } catch (e) {
      console.error('getNotifications error', e);
      return [];
    }
  },

  async markNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/mark-read', { method: 'POST' });
  }
};
