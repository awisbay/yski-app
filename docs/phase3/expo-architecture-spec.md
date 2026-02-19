# Expo + React Native Architecture Specification

Technical architecture for the Yayasan Sahabat Khairat Indonesia mobile app built with React Native, Expo SDK 52, NativeWind v4, Expo Router, and Zustand.

---

## 1. File-Based Routing (Expo Router)

### App Directory Structure

```
mobile/
├── app/
│   ├── _layout.tsx                    # Root layout (auth guard, font loading)
│   ├── index.tsx                      # Entry redirect (-> auth or tabs)
│   │
│   ├── (auth)/                        # Auth layout group (Stack navigator)
│   │   ├── _layout.tsx                # Stack navigator config
│   │   ├── login.tsx                  # Login screen
│   │   └── register.tsx               # Register screen
│   │
│   ├── (tabs)/                        # Sahabat tabs (Tab navigator)
│   │   ├── _layout.tsx                # Tab navigator config (4 tabs)
│   │   ├── index.tsx                  # Beranda/Home
│   │   ├── kegiatan.tsx               # Kegiatan (Activities)
│   │   ├── riwayat.tsx                # Riwayat (History)
│   │   └── profil.tsx                 # Profil (Profile)
│   │
│   ├── (admin)/                       # Admin/Pengurus tabs (Tab navigator)
│   │   ├── _layout.tsx                # Tab navigator config (4 tabs)
│   │   ├── index.tsx                  # Dashboard
│   │   ├── inventory.tsx              # Inventory management
│   │   ├── laporan.tsx                # Reports
│   │   └── profil.tsx                 # Admin profile
│   │
│   ├── booking/                       # Booking flow (Stack)
│   │   ├── pindahan.tsx               # Booking pindahan form
│   │   └── [id].tsx                   # Booking detail with status stepper
│   │
│   ├── donasi/                        # Donation flow (Stack)
│   │   ├── nominal.tsx                # Step 1: Choose amount
│   │   ├── pembayaran.tsx             # Step 2: Payment method
│   │   └── sukses.tsx                 # Step 3: Success confirmation
│   │
│   ├── pickup/                        # Pickup donation (Stack)
│   │   └── donasi.tsx                 # Pickup form
│   │
│   ├── alkes/                         # Medical equipment (Stack)
│   │   ├── index.tsx                  # Equipment list
│   │   └── [id].tsx                   # Equipment detail + loan request
│   │
│   └── berita/                        # News & impact (Stack)
│       ├── index.tsx                  # News list
│       └── [id].tsx                   # Article detail
│
├── components/                        # Reusable UI components
│   ├── ui/                            # Primitive UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Header.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── home/                          # Home screen components
│   │   ├── ImpactDashboard.tsx
│   │   ├── QuickAccessMenu.tsx
│   │   └── ProgramCard.tsx
│   │
│   ├── booking/                       # Booking-specific components
│   │   ├── CalendarPicker.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── LocationMapPicker.tsx
│   │   └── StatusStepper.tsx
│   │
│   ├── donasi/                        # Donation-specific components
│   │   ├── AmountSelector.tsx
│   │   ├── PaymentMethodCard.tsx
│   │   └── DonationReceipt.tsx
│   │
│   └── common/                        # Shared composite components
│       ├── ScreenWrapper.tsx
│       ├── PullToRefresh.tsx
│       └── ErrorBoundary.tsx
│
├── hooks/                             # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useLocation.ts
│   └── useNotifications.ts
│
├── services/                          # API and external services
│   ├── api/
│   │   ├── client.ts                  # Axios instance + interceptors
│   │   ├── auth.ts                    # Auth API calls
│   │   ├── booking.ts                 # Booking API calls
│   │   ├── donation.ts                # Donation API calls
│   │   ├── equipment.ts               # Equipment API calls
│   │   ├── news.ts                    # News API calls
│   │   └── pickup.ts                  # Pickup API calls
│   └── storage.ts                     # SecureStore wrapper
│
├── stores/                            # Zustand state stores
│   ├── authStore.ts
│   ├── bookingStore.ts
│   ├── donationStore.ts
│   └── notificationStore.ts
│
├── constants/                         # App constants
│   ├── colors.ts
│   ├── config.ts
│   ├── typography.ts
│   └── spacing.ts
│
├── utils/                             # Utility functions
│   ├── format.ts                      # Currency, date formatting
│   ├── validation.ts                  # Zod schemas
│   └── helpers.ts                     # Misc helpers
│
├── assets/                            # Static assets
│   ├── fonts/                         # Public Sans font files
│   └── images/                        # App images, icons
│
├── app.json                           # Expo config
├── tailwind.config.js                 # Tailwind / NativeWind config
├── global.css                         # NativeWind global styles
├── babel.config.js                    # Babel config
├── metro.config.js                    # Metro bundler config
├── tsconfig.json                      # TypeScript config
└── package.json
```

---

## 2. Navigation Architecture

### Stack Navigator (Auth)

```
(auth) - Stack Navigator
├── login.tsx        (no header, full screen)
└── register.tsx     (back button header)
```

### Tab Navigator (Sahabat - role: "sahabat")

```
(tabs) - Bottom Tab Navigator
├── Beranda     (icon: home, filled when active)
├── Kegiatan    (icon: event_available)
├── Riwayat     (icon: history)
└── Profil      (icon: account_circle)
```

### Tab Navigator (Admin/Pengurus - role: "admin" | "pengurus")

```
(admin) - Bottom Tab Navigator
├── Dashboard   (icon: dashboard)
├── Inventaris  (icon: inventory_2)
├── Laporan     (icon: bar_chart)
└── Profil      (icon: person)
```

### Role-Based Tab Switching Logic

```typescript
// In app/_layout.tsx or root redirect
const { user } = useAuth();

if (!user) {
  return <Redirect href="/(auth)/login" />;
}

if (user.role === "admin" || user.role === "pengurus") {
  return <Redirect href="/(admin)" />;
}

// Default: sahabat role
return <Redirect href="/(tabs)" />;
```

### Deep Link Routes

| Screen | Route | Params |
|--------|-------|--------|
| Booking Pindahan | `/booking/pindahan` | - |
| Booking Detail | `/booking/[id]` | `id: string` |
| Donasi Step 1 | `/donasi/nominal` | - |
| Donasi Step 2 | `/donasi/pembayaran` | `amount: number, type: string` |
| Donasi Step 3 | `/donasi/sukses` | `donationId: string` |
| Pickup Form | `/pickup/donasi` | - |
| Equipment List | `/alkes` | - |
| Equipment Detail | `/alkes/[id]` | `id: string` |
| News List | `/berita` | - |
| Article Detail | `/berita/[id]` | `id: string` |

---

## 3. State Management (Zustand)

### authStore

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>; // Load tokens from SecureStore on app start
}
```

### bookingStore

```typescript
interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookings: () => Promise<void>;
  fetchBookingById: (id: string) => Promise<void>;
  createBooking: (data: CreateBookingRequest) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
}
```

### donationStore

```typescript
interface DonationState {
  // Multi-step form state
  selectedType: "infaq" | "zakat_mal" | "zakat_fitrah" | "sedekah";
  selectedAmount: number;
  customAmount: number | null;
  selectedPaymentMethod: string | null;

  // Result
  lastDonation: DonationResult | null;

  // Actions
  setType: (type: string) => void;
  setAmount: (amount: number) => void;
  setPaymentMethod: (method: string) => void;
  submitDonation: () => Promise<DonationResult>;
  reset: () => void;
}
```

### notificationStore

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}
```

---

## 4. API Layer

### Axios Client Setup

```typescript
// services/api/client.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/stores/authStore";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await SecureStore.setItemAsync("access_token", data.access_token);
        await SecureStore.setItemAsync("refresh_token", data.refresh_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed: force logout
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Error Handling Strategy

| HTTP Status | Handling |
|-------------|----------|
| 400 | Show inline validation errors from response body |
| 401 | Auto-refresh token; if refresh fails, redirect to login |
| 403 | Show "Anda tidak memiliki akses" toast |
| 404 | Show "Data tidak ditemukan" with empty state |
| 422 | Show validation errors from response body |
| 500 | Show "Terjadi kesalahan server" toast with retry button |
| Network Error | Show "Tidak ada koneksi internet" banner |

---

## 5. Token Storage (expo-secure-store)

```typescript
// services/storage.ts
import * as SecureStore from "expo-secure-store";

const TOKEN_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
};

export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.USER_DATA);
  },

  async setUser(user: object) {
    await SecureStore.setItemAsync(TOKEN_KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUser() {
    const data = await SecureStore.getItemAsync(TOKEN_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },
};
```

---

## 6. Image Handling

### Upload Flow

1. User taps "upload" -> `expo-image-picker` opens camera/gallery
2. Image is compressed client-side (max 1024px width, 80% quality)
3. Image sent as `multipart/form-data` to backend
4. Backend uploads to MinIO, returns URL
5. URL stored in the relevant model (e.g., equipment photo, donation proof)

```typescript
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

async function pickAndUploadImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    // Compress
    const compressed = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Upload via FormData
    const formData = new FormData();
    formData.append("file", {
      uri: compressed.uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);

    const response = await apiClient.post("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.url;
  }
}
```

---

## 7. Maps Integration

Using `react-native-maps` for location picking in booking and pickup screens.

```typescript
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

// Request permission
const { status } = await Location.requestForegroundPermissionsAsync();

// Get current location
const location = await Location.getCurrentPositionAsync({});

// Reverse geocode for address
const address = await Location.reverseGeocodeAsync({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
});
```

---

## 8. Push Notifications (Future Phase)

```typescript
// Setup in Phase 5+
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })
  ).data;

  // Send token to backend
  await apiClient.post("/notifications/register-device", {
    expo_push_token: token,
  });
}
```

---

## 9. Environment Configuration

### app.json

```json
{
  "expo": {
    "name": "Yayasan Sahabat Khairat Indonesia",
    "slug": "clicky-foundation",
    "version": "1.0.0",
    "scheme": "clicky",
    "extra": {
      "apiUrl": "https://api.clickyfoundation.id",
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-image-picker",
      "expo-location"
    ]
  }
}
```

### Accessing Config

```typescript
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl;
```

---

## 10. Form Handling

Using React Hook Form + Zod for form validation across all input screens.

```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Usage in component
const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
  resolver: zodResolver(loginSchema),
});
```
