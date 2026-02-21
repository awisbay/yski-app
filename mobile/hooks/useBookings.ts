import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/services/api';
import { useBookingStore } from '@/stores/bookingStore';

function normalizeBooking(raw: any) {
  if (!raw) return raw;
  const rawTimeSlots = raw.timeSlots ?? raw.time_slots;
  const normalizedTimeSlots = Array.isArray(rawTimeSlots)
    ? rawTimeSlots
    : typeof rawTimeSlots === 'string'
    ? rawTimeSlots.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;
  return {
    ...raw,
    bookingDate: raw.bookingDate ?? raw.booking_date,
    timeSlot: raw.timeSlot ?? raw.time_slot,
    timeSlots: normalizedTimeSlots,
    pickupAddress: raw.pickupAddress ?? raw.pickup_address,
    dropoffAddress: raw.dropoffAddress ?? raw.dropoff_address,
    requesterName: raw.requesterName ?? raw.requester_name,
    requesterPhone: raw.requesterPhone ?? raw.requester_phone,
    pickupLat: raw.pickupLat ?? raw.pickup_lat,
    pickupLng: raw.pickupLng ?? raw.pickup_lng,
    dropoffLat: raw.dropoffLat ?? raw.dropoff_lat,
    dropoffLng: raw.dropoffLng ?? raw.dropoff_lng,
    bookingCode: raw.bookingCode ?? raw.booking_code,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    assignedTo: raw.assignedTo ?? raw.assigned_to,
    approvedBy: raw.approvedBy ?? raw.approved_by,
    reviewText: raw.reviewText ?? raw.review_text,
    rejectionReason: raw.rejectionReason ?? raw.rejection_reason,
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
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

// Hook to get all bookings for operational roles
export function useAllBookings() {
  return useQuery({
    queryKey: bookingKeys.list({ scope: 'all' }),
    queryFn: () => bookingsApi.getList().then(res => (res.data || []).map(normalizeBooking)),
  });
}

// Hook to get booking detail
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.getBooking(id).then(res => normalizeBooking(res.data)),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
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

export function useApproveBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.list({ scope: 'all' }) });
    },
  });
}

export function useRejectBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.list({ scope: 'all' }) });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'in_progress' | 'completed' }) =>
      bookingsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}
