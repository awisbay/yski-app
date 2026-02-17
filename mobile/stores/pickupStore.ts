import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PickupType = 'zakat' | 'kencleng' | 'donasi';

export interface PickupFormData {
  step: number;
  pickupType: PickupType | null;
  requesterName: string;
  requesterPhone: string;
  pickupAddress: string;
  preferredDate: Date | null;
  preferredTimeSlot: string | null;
  notes: string;
}

interface PickupStore extends PickupFormData {
  setPickupType: (type: PickupType) => void;
  setContactInfo: (name: string, phone: string) => void;
  setAddress: (address: string) => void;
  setSchedule: (date: Date | null, timeSlot: string | null) => void;
  setNotes: (notes: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  clearPickupForm: () => void;
}

const initialState: PickupFormData = {
  step: 1,
  pickupType: null,
  requesterName: '',
  requesterPhone: '',
  pickupAddress: '',
  preferredDate: null,
  preferredTimeSlot: null,
  notes: '',
};

export const usePickupStore = create<PickupStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setPickupType: (type) => set({ pickupType: type }),
      setContactInfo: (name, phone) => set({ requesterName: name, requesterPhone: phone }),
      setAddress: (address) => set({ pickupAddress: address }),
      setSchedule: (date, timeSlot) => set({ preferredDate: date, preferredTimeSlot: timeSlot }),
      setNotes: (notes) => set({ notes }),
      setStep: (step) => set({ step }),
      nextStep: () => set({ step: get().step + 1 }),
      prevStep: () => set({ step: Math.max(1, get().step - 1) }),
      clearPickupForm: () => set(initialState),
    }),
    {
      name: 'pickup-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
