# Phase 3: Mobile App Foundation - Checklist

**Objective:** Initialize the React Native + Expo mobile project, establish the design system, configure navigation, implement authentication flow, and build reusable UI components.

**Estimated Duration:** 2 weeks

---

## Project Initialization

- [x] Initialize Expo project (SDK 52, TypeScript template)
- [x] Install and configure NativeWind v4 + tailwind.config.js
- [ ] Setup custom fonts (Public Sans family: 400, 500, 600, 700)
- [ ] Configure design tokens (colors, spacing, typography) in constants/
- [ ] Verify project builds and runs on iOS simulator
- [ ] Verify project builds and runs on Android emulator

## Navigation & Routing

- [x] Setup Expo Router file-based navigation structure (app/ directory)
- [x] Create `(auth)` layout group with `_layout.tsx` (Stack navigator)
  - [x] `login.tsx` - Login screen
  - [x] `register.tsx` - Register screen
- [x] Create `(tabs)` layout for sahabat role with `_layout.tsx` (Tab navigator)
  - [ ] Beranda tab (home icon)
  - [ ] Kegiatan tab (event_available icon)
  - [ ] Riwayat tab (history icon)
  - [ ] Profil tab (account_circle icon)
- [ ] Create `(admin)` layout for admin/pengurus role with `_layout.tsx` (Tab navigator)
  - [ ] Dashboard tab (dashboard icon)
  - [ ] Inventory tab (inventory_2 icon)
  - [ ] Laporan tab (bar_chart icon)
  - [ ] Profil tab (person icon)
- [ ] Implement role-based tab switching (sahabat -> (tabs), admin/pengurus -> (admin))
- [ ] Setup root `_layout.tsx` with auth guard (redirect to login if not authenticated)

## Design System & UI Components

- [x] Build reusable `Button` component (primary, secondary, outline, ghost variants; sm, md, lg sizes)
- [x] Build reusable `Card` component (with image, title, description, actions)
- [x] Build reusable `Input` component (text, tel, email, password; with icon prefix, validation error)
- [x] Build reusable `Badge` component (status colors: success, warning, error, info)
- [ ] Build reusable `BottomSheet` component (modal overlay, draggable)
- [ ] Build `Header` component (back button, title, right action)
- [ ] Build `ProgressBar` component (step indicator for multi-step flows)
- [ ] Build `EmptyState` component (icon, message, action button)
- [ ] Build `LoadingSpinner` component (full screen and inline variants)

## API Client & Networking

- [x] Setup API client (axios instance with baseURL from config)
- [ ] Implement request interceptor (attach JWT access token to Authorization header)
- [ ] Implement response interceptor (auto-refresh on 401, retry original request)
- [ ] Setup error handling (network errors, 403 forbidden, 500 server error)
- [ ] Configure environment-based API URL (app.json extra field)

## Authentication Flow

- [ ] Implement login screen (phone/email + password, form validation)
- [ ] Implement register screen (name, phone, email, password, confirm password)
- [ ] Integrate login API call (`POST /api/v1/auth/login`)
- [ ] Integrate register API call (`POST /api/v1/auth/register`)
- [ ] Token storage using `expo-secure-store` (access_token, refresh_token)
- [ ] Implement auto-refresh token logic (refresh before expiry or on 401)
- [ ] Implement logout (clear tokens, redirect to login)

## State Management

- [ ] Setup Zustand `authStore` (user, tokens, isAuthenticated, login/logout actions)
- [ ] Setup Zustand `bookingStore` (bookings list, current booking, loading state)
- [ ] Setup Zustand `notificationStore` (notifications list, unread count)
- [ ] Create `useAuth` hook (wraps authStore with token management helpers)

## Constants & Configuration

- [ ] Create `constants/colors.ts` (all design system color tokens)
- [ ] Create `constants/config.ts` (API_URL, app version, feature flags)
- [ ] Create `constants/typography.ts` (font families, sizes, weights)
- [ ] Create `constants/spacing.ts` (spacing scale based on 4px grid)

## Verification

- [ ] App builds and runs on iOS simulator without errors
- [ ] App builds and runs on Android emulator without errors
- [ ] NativeWind styles render correctly with custom theme
- [ ] Navigation flow works: launch -> auth check -> login/tabs
- [ ] Login/register forms submit to backend API
- [ ] Token persists across app restarts
