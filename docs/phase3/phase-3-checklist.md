# Phase 3: Mobile App Foundation - Checklist

**Objective:** Initialize the React Native + Expo mobile project, establish the design system, configure navigation, implement authentication flow, and build reusable UI components.

**Estimated Duration:** 2 weeks

---

## Project Initialization

- [x] Initialize Expo project (SDK 52, TypeScript template)
- [x] Install and configure NativeWind v4 + tailwind.config.js
- [x] Setup custom fonts (Public Sans family: 400, 500, 600, 700) - CONFIGURED (fonts need to be added to assets)
- [x] Configure design tokens (colors, spacing, typography) in constants/
- [ ] Verify project builds and runs on iOS simulator
- [ ] Verify project builds and runs on Android emulator

## Navigation & Routing

- [x] Setup Expo Router file-based navigation structure (app/ directory)
- [x] Create `(auth)` layout group with `_layout.tsx` (Stack navigator)
  - [x] `login.tsx` - Login screen
  - [x] `register.tsx` - Register screen
- [x] Create `(tabs)` layout for sahabat role with `_layout.tsx` (Tab navigator)
  - [x] Beranda tab (home icon)
  - [x] Layanan tab (apps icon)
  - [x] Riwayat tab (history icon)
  - [x] Profil tab (account_circle icon)
- [x] Create `(admin)` layout for admin/pengurus role with `_layout.tsx` (Tab navigator)
  - [x] Dashboard tab (dashboard icon)
  - [x] Inventory tab (inventory_2 icon)
  - [x] Laporan tab (bar_chart icon)
  - [x] Profil tab (person icon)
- [x] Implement role-based tab switching (sahabat -> (tabs), admin/pengurus -> (admin))
- [x] Setup root `_layout.tsx` with auth guard (redirect to login if not authenticated)

## Design System & UI Components

- [x] Build reusable `Button` component (primary, secondary, outline, ghost variants; sm, md, lg sizes)
- [x] Build reusable `Card` component (with image, title, description, actions)
- [x] Build reusable `Input` component (text, tel, email, password; with icon prefix, validation error)
- [x] Build reusable `Badge` component (status colors: success, warning, error, info)
- [x] Build reusable `BottomSheet` component (modal overlay, draggable)
- [x] Build `Header` component (back button, title, right action)
- [x] Build `ProgressBar` component (step indicator for multi-step flows)
- [x] Build `EmptyState` component (icon, message, action button)
- [x] Build `LoadingSpinner` component (full screen and inline variants)

## API Client & Networking

- [x] Setup API client (axios instance with baseURL from config)
- [x] Implement request interceptor (attach JWT access token to Authorization header)
- [x] Implement response interceptor (auto-refresh on 401, retry original request)
- [x] Setup error handling (network errors, 403 forbidden, 500 server error)
- [x] Configure environment-based API URL (app.json extra field)

## Authentication Flow

- [x] Implement login screen (phone/email + password, form validation)
- [x] Implement register screen (name, phone, email, password, confirm password)
- [x] Integrate login API call (`POST /api/v1/auth/login`)
- [x] Integrate register API call (`POST /api/v1/auth/register`)
- [x] Token storage using `expo-secure-store` (access_token, refresh_token)
- [x] Implement auto-refresh token logic (refresh before expiry or on 401)
- [x] Implement logout (clear tokens, redirect to login)

## State Management

- [x] Setup Zustand `authStore` (user, tokens, isAuthenticated, login/logout actions)
- [x] Setup Zustand `bookingStore` (bookings list, current booking, loading state)
- [x] Setup Zustand `notificationStore` (notifications list, unread count)
- [x] Create `useAuth` hook (wraps authStore with token management helpers)

## Constants & Configuration

- [x] Create `constants/colors.ts` (all design system color tokens)
- [x] Create `constants/config.ts` (API_URL, app version, feature flags)
- [x] Create `constants/typography.ts` (font families, sizes, weights)
- [x] Create `constants/spacing.ts` (spacing scale based on 4px grid)

## Verification

- [ ] App builds and runs on iOS simulator without errors
- [ ] App builds and runs on Android emulator without errors
- [ ] NativeWind styles render correctly with custom theme
- [ ] Navigation flow works: launch -> auth check -> login/tabs
- [ ] Login/register forms submit to backend API
- [ ] Token persists across app restarts
