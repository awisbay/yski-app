// API Response Types — mirrors backend Pydantic schemas

export interface User {
  id: string
  full_name: string
  kunyah_name?: string | null
  email: string
  phone: string | null
  occupation?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  interested_as_donatur?: boolean
  interested_as_relawan?: boolean
  wants_beneficiary_survey?: boolean
  avatar_url: string | null
  role: 'admin' | 'pengurus' | 'relawan' | 'sahabat'
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string | null
}

export interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  category: string
  thumbnail_url: string | null
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected'
  is_published: boolean
  published_at: string | null
  scheduled_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  meta_title: string | null
  meta_description: string | null
  tags: string | null
  created_by: string
  created_at: string
  updated_at: string | null
}

export interface Program {
  id: string
  title: string
  slug: string
  description: string
  thumbnail_url: string | null
  target_amount: number | null
  collected_amount: number
  status: 'active' | 'completed' | 'cancelled' | 'hidden'
  is_featured: boolean
  created_by: string
  created_at: string
  updated_at: string | null
}

export interface Donation {
  id: string
  donation_code: string
  donor_id: string | null
  donor_name: string
  donor_email: string | null
  donor_phone: string | null
  amount: number
  donation_type: 'infaq' | 'sedekah' | 'wakaf' | 'zakat'
  program_id: string | null
  payment_method: string
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  proof_url: string | null
  verified_by: string | null
  verified_at: string | null
  message: string | null
  created_at: string
  updated_at: string | null
}

export interface MovingBooking {
  id: string
  booking_code: string
  booking_date: string
  time_slot: string
  requester_id: string
  requester_name: string
  requester_phone: string
  pickup_address: string
  pickup_lat: number | null
  pickup_lng: number | null
  dropoff_address: string
  dropoff_lat: number | null
  dropoff_lng: number | null
  purpose: string
  notes: string | null
  status: string
  assigned_to: string | null
  approved_by: string | null
  rejection_reason: string | null
  rating: number | null
  review_text: string | null
  created_at: string
  updated_at: string | null
}

export interface MedicalEquipment {
  id: string
  name: string
  category: string
  description: string | null
  photo_url: string | null
  total_stock: number
  available_stock: number
  condition: 'new' | 'good' | 'fair' | 'poor'
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface EquipmentLoan {
  id: string
  equipment_id: string
  borrower_id: string
  borrower_name: string
  borrower_phone: string
  borrow_date: string
  return_date: string | null
  borrow_location: string | null
  status: 'pending' | 'approved' | 'borrowed' | 'returned' | 'rejected'
  approved_by: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface AuctionItem {
  id: string
  title: string
  description: string
  starting_price: number
  current_price: number
  min_increment: number
  donor_id: string
  winner_id: string | null
  status: 'ready' | 'bidding' | 'payment_pending' | 'sold' | 'cancelled'
  payment_status: string | null
  payment_proof_url: string | null
  payment_verified_by: string | null
  payment_verified_at: string | null
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string | null
}

export interface AuctionBid {
  id: string
  auction_item_id: string
  bidder_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface PickupRequest {
  id: string
  request_code: string
  requester_id: string | null
  requester_name: string
  requester_phone: string
  pickup_type: string
  pickup_address: string
  pickup_lat: number | null
  pickup_lng: number | null
  amount: number | null
  item_description: string | null
  item_photo_url: string | null
  preferred_date: string | null
  preferred_time_slot: string | null
  status: string
  assigned_to: string | null
  completed_at: string | null
  proof_url: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface FinancialReport {
  id: string
  title: string
  period_start: string
  period_end: string
  total_income: number
  total_expense: number
  pdf_url: string | null
  is_audited: boolean
  is_published: boolean
  generated_by: string
  created_at: string
}

export interface FinancialEntry {
  id: string
  report_id: string
  category: string
  type: 'income' | 'expense'
  amount: number
  description: string | null
  entry_date: string
  created_at: string
}

// Dashboard metrics types
export interface DashboardOverview {
  totals: {
    users: number
    active_users: number
    donations_amount: number
    active_auctions: number
    pending_bookings: number
    equipment_on_loan: number
    pending_pickups: number
  }
  donation_trend: Array<{ label: string; amount: number }>
  bookings_by_status: Array<{ status: string; count: number }>
}

export interface UserMetrics {
  by_role: Array<{ role: string; count: number }>
  active: number
  inactive: number
  signups_per_month: Array<{ label: string; count: number }>
}

export interface DonationMetrics {
  total_amount: number
  by_type: Array<{ type: string; count: number; amount: number }>
  monthly_trend: Array<{ label: string; amount: number }>
}

export interface AuctionMetrics {
  by_status: Array<{ status: string; count: number }>
  total_sold_value: number
  pending_payments: number
}

export interface BookingMetrics {
  by_status: Array<{ status: string; count: number }>
  weekly_trend: Array<{ label: string; count: number }>
}

export interface EquipmentMetrics {
  total_equipment: number
  on_loan: number
  pending_loans: number
  by_category: Array<{ category: string; count: number }>
  by_condition: Array<{ condition: string; count: number }>
  loan_by_status: Array<{ status: string; count: number }>
}

// Auth types
export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}
