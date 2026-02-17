import { create } from 'zustand';

interface BookingState {
  // Current booking form data
  selectedDate: Date | null;
  selectedSlot: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  pickupNotes: string;
  dropoffNotes: string;
  
  // List of user's bookings
  bookings: any[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedDate: (date: Date | null) => void;
  setSelectedSlot: (slot: string | null) => void;
  setPickupAddress: (address: string) => void;
  setDropoffAddress: (address: string) => void;
  setPickupNotes: (notes: string) => void;
  setDropoffNotes: (notes: string) => void;
  clearBookingForm: () => void;
  setBookings: (bookings: any[]) => void;
  addBooking: (booking: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedDate: null,
  selectedSlot: null,
  pickupAddress: '',
  dropoffAddress: '',
  pickupNotes: '',
  dropoffNotes: '',
  bookings: [],
  isLoading: false,
  error: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setPickupAddress: (address) => set({ pickupAddress: address }),
  setDropoffAddress: (address) => set({ dropoffAddress: address }),
  setPickupNotes: (notes) => set({ pickupNotes: notes }),
  setDropoffNotes: (notes) => set({ dropoffNotes: notes }),
  
  clearBookingForm: () => set({
    selectedDate: null,
    selectedSlot: null,
    pickupAddress: '',
    dropoffAddress: '',
    pickupNotes: '',
    dropoffNotes: '',
  }),
  
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => set((state) => ({ 
    bookings: [booking, ...state.bookings] 
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
