import { create } from 'zustand';

interface DonationState {
  // Step 1: Amount selection
  selectedType: string;
  selectedAmount: number | null;
  customAmount: string;
  
  // Step 2: Payment method
  selectedPaymentMethod: string | null;
  
  // Actions
  setSelectedType: (type: string) => void;
  setSelectedAmount: (amount: number | null) => void;
  setCustomAmount: (amount: string) => void;
  setSelectedPaymentMethod: (method: string | null) => void;
  clearDonationForm: () => void;
}

export const useDonationStore = create<DonationState>((set) => ({
  selectedType: 'infaq',
  selectedAmount: null,
  customAmount: '',
  selectedPaymentMethod: null,

  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedAmount: (amount) => set({ selectedAmount: amount }),
  setCustomAmount: (amount) => set({ customAmount: amount }),
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  
  clearDonationForm: () => set({
    selectedType: 'infaq',
    selectedAmount: null,
    customAmount: '',
    selectedPaymentMethod: null,
  }),
}));
