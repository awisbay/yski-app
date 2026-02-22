import { z } from 'zod';

// Booking Validation Schema
export const bookingSchema = z.object({
  bookingDate: z.date({
    required_error: 'Tanggal booking diperlukan',
  }).refine((date) => date > new Date(), {
    message: 'Tanggal harus di masa depan',
  }),
  bookingDates: z.array(z.date()).min(1, 'Pilih minimal 1 tanggal booking'),
  timeSlots: z.array(z.string()).min(1, 'Pilih minimal 1 slot waktu'),
  isFullDay: z.boolean().default(false),
  pickupAddress: z.string().min(10, 'Alamat penjemputan minimal 10 karakter'),
  dropoffAddress: z.string().min(10, 'Alamat tujuan minimal 10 karakter'),
  purpose: z.string().min(3, 'Keperluan minimal 3 karakter'),
  notes: z.string().optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// Donation Validation Schema
export const donationAmountSchema = z.object({
  donationType: z.enum(['infaq', 'sedekah', 'wakaf', 'zakat']),
  amount: z.number().min(10000, 'Minimal donasi Rp 10.000'),
});

export type DonationAmountFormData = z.infer<typeof donationAmountSchema>;

// Pickup Validation Schema
export const pickupSchema = z.object({
  pickupType: z.enum(['zakat', 'kencleng', 'donasi']),
  requesterName: z.string().min(3, 'Nama minimal 3 karakter'),
  requesterPhone: z.string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .regex(/^[0-9]+$/, 'Hanya angka yang diperbolehkan'),
  pickupAddress: z.string().min(10, 'Alamat minimal 10 karakter'),
  preferredDate: z.date().optional(),
  preferredTimeSlot: z.string().optional(),
  notes: z.string().optional(),
});

export type PickupFormData = z.infer<typeof pickupSchema>;

// Login Validation Schema
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Validation Schema
export const registerSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .regex(/^[0-9]+$/, 'Hanya angka yang diperbolehkan'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
