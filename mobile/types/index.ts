// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  createdAt: string;
}

// Booking types
export interface Booking {
  id: string;
  userId: string;
  bookingDate: string;
  timeSlot: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Donation types
export interface Donation {
  id: string;
  userId: string;
  donationType: 'infaq' | 'sedekah' | 'wakaf' | 'zakat';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: string;
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Equipment types
export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category: string;
  totalStock: number;
  availableStock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface EquipmentLoan {
  id: string;
  equipmentId: string;
  userId: string;
  loanDate: string;
  dueDate?: string;
  returnDate?: string;
  status: 'pending' | 'active' | 'returned' | 'overdue';
  notes?: string;
}

// Pickup types
export interface Pickup {
  id: string;
  userId: string;
  pickupType: 'zakat' | 'kencleng' | 'donasi';
  requesterName: string;
  requesterPhone: string;
  pickupAddress: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

// Program types
export interface Program {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  donorCount: number;
  imageUrl?: string;
  createdAt: string;
}

// News types
export interface News {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}
