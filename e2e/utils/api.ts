import { Page, APIRequestContext } from '@playwright/test';

/**
 * API utilities for E2E tests
 * Provides direct API access for test setup and verification
 */

const API_BASE = '/api';

/**
 * API helper class for making requests
 */
export class ApiHelper {
  private request: APIRequestContext;
  
  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Register a new user via API
   */
  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ id: number; email: string } | null> {
    const response = await this.request.post(`${API_BASE}/auth/register`, {
      data: userData,
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Login via API
   */
  async login(email: string, password: string): Promise<boolean> {
    const response = await this.request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });
    
    return response.ok();
  }

  /**
   * Logout via API
   */
  async logout(): Promise<boolean> {
    const response = await this.request.post(`${API_BASE}/auth/logout`);
    return response.ok();
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<object | null> {
    const response = await this.request.get(`${API_BASE}/user`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Create a service via API
   */
  async createService(serviceData: {
    title: string;
    description: string;
    category: string;
    pricing: object;
    location?: object;
  }): Promise<{ id: number } | null> {
    const response = await this.request.post(`${API_BASE}/services`, {
      data: serviceData,
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Get service by ID
   */
  async getService(serviceId: number): Promise<object | null> {
    const response = await this.request.get(`${API_BASE}/services/${serviceId}`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Update service via API
   */
  async updateService(serviceId: number, data: object): Promise<boolean> {
    const response = await this.request.patch(`${API_BASE}/services/${serviceId}`, {
      data,
    });
    
    return response.ok();
  }

  /**
   * Delete service via API
   */
  async deleteService(serviceId: number): Promise<boolean> {
    const response = await this.request.delete(`${API_BASE}/services/${serviceId}`);
    return response.ok();
  }

  /**
   * Create a booking via API
   */
  async createBooking(bookingData: {
    serviceId: number;
    date: string;
    time: string;
    pricingOption?: string;
    message?: string;
  }): Promise<{ id: number } | null> {
    const response = await this.request.post(`${API_BASE}/bookings`, {
      data: bookingData,
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: number): Promise<object | null> {
    const response = await this.request.get(`${API_BASE}/bookings/${bookingId}`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Update booking status via API
   */
  async updateBookingStatus(bookingId: number, status: string): Promise<boolean> {
    const response = await this.request.patch(`${API_BASE}/bookings/${bookingId}/status`, {
      data: { status },
    });
    
    return response.ok();
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(): Promise<object[]> {
    const response = await this.request.get(`${API_BASE}/bookings`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return [];
  }

  /**
   * Create a payment intent via API
   */
  async createPaymentIntent(bookingId: number, paymentMethod: string): Promise<{ clientSecret: string } | null> {
    const response = await this.request.post(`${API_BASE}/payments/create-intent`, {
      data: { bookingId, paymentMethod },
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Confirm payment via API
   */
  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    const response = await this.request.post(`${API_BASE}/payments/confirm`, {
      data: { paymentIntentId },
    });
    
    return response.ok();
  }

  /**
   * Send a chat message via API
   */
  async sendMessage(conversationId: number, content: string): Promise<{ id: number } | null> {
    const response = await this.request.post(`${API_BASE}/messages`, {
      data: { conversationId, content },
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: number): Promise<object[]> {
    const response = await this.request.get(`${API_BASE}/messages/${conversationId}`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return [];
  }

  /**
   * Create a review via API
   */
  async createReview(reviewData: {
    bookingId: number;
    rating: number;
    comment: string;
  }): Promise<{ id: number } | null> {
    const response = await this.request.post(`${API_BASE}/reviews`, {
      data: reviewData,
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Get service reviews
   */
  async getServiceReviews(serviceId: number): Promise<object[]> {
    const response = await this.request.get(`${API_BASE}/reviews/service/${serviceId}`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return [];
  }

  /**
   * Get user's referral code
   */
  async getReferralCode(): Promise<string | null> {
    const response = await this.request.get(`${API_BASE}/referrals/code`);
    
    if (response.ok()) {
      const data = await response.json();
      return data.code;
    }
    
    return null;
  }

  /**
   * Get referral stats
   */
  async getReferralStats(): Promise<object | null> {
    const response = await this.request.get(`${API_BASE}/referrals/stats`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Get notifications
   */
  async getNotifications(): Promise<object[]> {
    const response = await this.request.get(`${API_BASE}/notifications`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: number): Promise<boolean> {
    const response = await this.request.patch(`${API_BASE}/notifications/${notificationId}/read`);
    return response.ok();
  }

  /**
   * Get vendor calendar settings
   */
  async getCalendarSettings(): Promise<object | null> {
    const response = await this.request.get(`${API_BASE}/vendor/calendar`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Update vendor calendar settings
   */
  async updateCalendarSettings(settings: object): Promise<boolean> {
    const response = await this.request.patch(`${API_BASE}/vendor/calendar`, {
      data: settings,
    });
    
    return response.ok();
  }

  /**
   * Create a dispute via API
   */
  async createDispute(disputeData: {
    bookingId: number;
    reason: string;
    description: string;
  }): Promise<{ id: number } | null> {
    const response = await this.request.post(`${API_BASE}/disputes`, {
      data: disputeData,
    });
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: number): Promise<object | null> {
    const response = await this.request.get(`${API_BASE}/disputes/${disputeId}`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return null;
  }

  /**
   * Check TWINT eligibility
   */
  async checkTwintEligibility(vendorId: number): Promise<{ eligible: boolean; reasons: string[] }> {
    const response = await this.request.get(`${API_BASE}/payments/twint-eligibility/${vendorId}`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return { eligible: false, reasons: [] };
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<object[]> {
    const response = await this.request.get(`${API_BASE}/categories`);
    
    if (response.ok()) {
      return response.json();
    }
    
    return [];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    const response = await this.request.get(`${API_BASE}/health`);
    return response.ok();
  }
}

/**
 * Create API helper from page context
 */
export async function createApiHelper(page: Page): Promise<ApiHelper> {
  const request = page.request;
  return new ApiHelper(request);
}
