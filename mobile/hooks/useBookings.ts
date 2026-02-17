import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/services/api';
import { useBookingStore } from '@/stores/bookingStore';

// Query keys
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: object) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  slots: (date: string) => [...bookingKeys.all, 'slots', date] as const,
};

// Hook to get available slots
export function useBookingSlots(date: string) {
  return useQuery({
    queryKey: bookingKeys.slots(date),
    queryFn: () => bookingsApi.getSlots(date),
    enabled: !!date,
  });
}

// Hook to get user's bookings
export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.lists(),
    queryFn: () => bookingsApi.getMyBookings(),
  });
}

// Hook to get booking detail
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.getBooking(id),
    enabled: !!id,
  });
}

// Hook to create booking
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { clearBookingForm } = useBookingStore();

  return useMutation({
    mutationFn: (data: any) => bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      clearBookingForm();
    },
  });
}

// Hook to cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}
