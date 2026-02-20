import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/services/api';
import { useBookingStore } from '@/stores/bookingStore';

function normalizeBooking(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    bookingDate: raw.bookingDate ?? raw.booking_date,
    timeSlot: raw.timeSlot ?? raw.time_slot,
    pickupAddress: raw.pickupAddress ?? raw.pickup_address,
    dropoffAddress: raw.dropoffAddress ?? raw.dropoff_address,
    requesterName: raw.requesterName ?? raw.requester_name,
    requesterPhone: raw.requesterPhone ?? raw.requester_phone,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    assignedTo: raw.assignedTo ?? raw.assigned_to,
    approvedBy: raw.approvedBy ?? raw.approved_by,
    reviewText: raw.reviewText ?? raw.review_text,
  };
}

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
    queryFn: () => bookingsApi.getSlots(date).then(res => res.data),
    enabled: !!date,
  });
}

// Hook to get user's bookings
export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.lists(),
    queryFn: () => bookingsApi.getMyBookings().then(res => (res.data || []).map(normalizeBooking)),
  });
}

// Hook to get booking detail
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.getBooking(id).then(res => normalizeBooking(res.data)),
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
