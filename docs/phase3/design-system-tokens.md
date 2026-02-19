# Design System Tokens

Extracted from the 8 HTML/Tailwind mockups in the `mockup/` directory. These tokens define the visual language of the Yayasan Sahabat Khairat Indonesia mobile app.

---

## Colors

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#002147` | Brand navy blue. Buttons, headers, active states, primary text |
| `primary/90` | `rgba(0,33,71,0.9)` | Button hover state |
| `primary/60` | `rgba(0,33,71,0.6)` | Secondary text, muted labels |
| `primary/40` | `rgba(0,33,71,0.4)` | Placeholder text, disabled icons |
| `primary/20` | `rgba(0,33,71,0.2)` | Borders, dividers, progress bar track |
| `primary/10` | `rgba(0,33,71,0.1)` | Subtle borders, light dividers |
| `primary/5` | `rgba(0,33,71,0.05)` | Background tint, hover states, icon containers |

### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `background-light` | `#f5f7f8` | Main app background (light mode) |
| `background-dark` | `#0f1823` | Main app background (dark mode) |
| `white` | `#ffffff` | Card backgrounds, modals |
| `slate-900` | `#0f172a` | Card backgrounds (dark mode) |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` / `green-600` | `#16a34a` | Success states, available stock badges |
| `green-100` | `#dcfce7` | Success badge background |
| `warning` / `orange-600` | `#ea580c` | Pending requests, warning states |
| `error` / `red-500` | `#ef4444` | Error states, notification dot, unavailable dates |
| `red-100` | `#fee2e2` | Error/unavailable date background |
| `red-600` | `#dc2626` | Emergency button icon, urgent actions |
| `whatsapp` | `#25D366` | WhatsApp share button |

### Accent Colors (from mockup e-wallet/bank icons)

| Token | Hex | Usage |
|-------|-----|-------|
| `blue-400` | `#60a5fa` | Dark mode active links |
| `blue-50` | `#eff6ff` | GoPay icon background |
| `blue-600` | `#2563eb` | GoPay icon color |
| `purple-50` | `#faf5ff` | OVO icon background |
| `purple-600` | `#9333ea` | OVO icon color |
| `orange-50` | `#fff7ed` | ShopeePay icon background |
| `orange-600` | `#ea580c` | ShopeePay icon color |

---

## Typography

### Font Family

- **Primary:** Public Sans (Google Fonts)
- **Weights:** Regular (400), Medium (500), SemiBold (600), Bold (700)
- **Fallback:** system sans-serif

### Font Size Scale

| Token | Size (px) | Line Height | Usage |
|-------|-----------|-------------|-------|
| `xs` | 10 | 14px | Bottom nav labels, micro text, T&C text |
| `sm` | 12 | 16px | Badge text, captions, helper text |
| `base-sm` | 14 | 20px | Body text, form labels, button text (sm) |
| `base` | 16 | 24px | Default body text, input text, button text |
| `lg` | 18 | 28px | Section headers, screen titles |
| `xl` | 20 | 28px | Impact dashboard numbers, amount displays |
| `2xl` | 24 | 32px | Main headings, donation amount |
| `3xl` | 30 | 36px | Success screen title ("Terima Kasih!") |

### Font Weight Usage

| Weight | NativeWind Class | Usage |
|--------|-----------------|-------|
| 400 (Regular) | `font-normal` | Body text, descriptions |
| 500 (Medium) | `font-medium` | Form labels, secondary nav items |
| 600 (SemiBold) | `font-semibold` | Quick access menu labels, e-wallet names |
| 700 (Bold) | `font-bold` | Headings, button text, active nav, numbers |

---

## Spacing

Based on a 4px grid system, extracted from mockup padding/margin values.

| Token | Value | Usage |
|-------|-------|-------|
| `0.5` | 2px | Micro gaps (notification dot border) |
| `1` | 4px | Tight inline spacing |
| `1.5` | 6px | Badge padding vertical |
| `2` | 8px | Small gaps, calendar cell padding |
| `3` | 12px | Icon-text gaps, card inner spacing |
| `4` | 16px | Standard padding (screen horizontal, card padding) |
| `5` | 20px | Card inner padding (large cards) |
| `6` | 24px | Section horizontal padding, main content padding |
| `8` | 32px | Section vertical spacing |
| `10` | 40px | Large section gaps |
| `12` | 48px | Bottom padding (above bottom nav) |
| `24` | 96px | Bottom nav clearance (pb-24) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `DEFAULT` | 4px (0.25rem) | Small elements |
| `lg` | 8px (0.5rem) | Calendar day cells, small buttons |
| `xl` | 12px (0.75rem) | Cards, input fields, buttons, map containers |
| `2xl` | 16px (1rem) | CTA cards, large containers |
| `full` | 9999px | Pill buttons, badges, avatars, time slot chips |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, list items |
| `md` | `0 4px 6px rgba(0,0,0,0.07)` | Elevated cards, map picker button |
| `lg` | `0 10px 15px rgba(0,33,71,0.2)` | Primary CTA buttons (`shadow-primary/20`) |
| `xl` | `0 20px 25px rgba(0,0,0,0.1)` | Mobile container outer shadow |

---

## Icons

- **Library:** Material Symbols Outlined (Google Fonts)
- **Package:** `@expo/vector-icons` (MaterialCommunityIcons) or `expo-symbols`
- **Variable font settings:** `FILL 0, wght 400, GRAD 0, opsz 24` (default), `FILL 1` for active/selected states

### Icon Inventory (from mockups)

| Icon Name | Screen | Usage |
|-----------|--------|-------|
| `home` | All | Bottom nav - Beranda |
| `event_available` | Home | Bottom nav - Kegiatan |
| `history` | All | Bottom nav - Riwayat |
| `account_circle` | All | Bottom nav - Profil |
| `notifications` | Home, Inventory | Header notification bell |
| `local_shipping` | Home | Quick access - Pindah Gratis |
| `medical_services` | Home, Inventory | Quick access - Alat Medis |
| `favorite` | Home, Donasi | Quick access - Zakat & Donasi |
| `e911_emergency` | Home | Quick access - Laporan Darurat |
| `arrow_back` | All inner screens | Back navigation |
| `calendar_month` | Booking | Date picker header |
| `schedule` | Booking | Time picker, status stepper |
| `location_on` | Booking, Pickup | Map pin, address |
| `map` | Booking, Pickup | "Pilih dari Peta" button |
| `swap_vert` | Booking | Swap pickup/destination |
| `arrow_forward` | Donasi, Booking | CTA button suffix |
| `check_circle` | Donasi, Booking | Selected state, success |
| `qr_code_2` | Payment | QRIS payment method |
| `account_balance_wallet` | Payment | E-wallet icon |
| `account_balance` | Payment | Bank transfer icon |
| `share` | Donasi Sukses, Berita | Share button |
| `volunteer_activism` | Home, Donasi | Donation icon |
| `verified_user` | Pickup | Trust badge |
| `person` | Pickup | Name input icon |
| `call` | Pickup | Phone input icon |
| `edit_location_alt` | Pickup | Edit location button |
| `calendar_today` | Pickup | Date input icon |
| `send` | Pickup | Submit button icon |
| `category` | Inventory | Section header |
| `accessible` | Inventory | Wheelchair icon |
| `air` | Inventory | Oxygen tank icon |
| `pending_actions` | Inventory | Pending requests |
| `search` | Berita | Search button |
| `newspaper` | Berita | Bottom nav - Dampak |
| `dashboard` | Admin | Bottom nav - Dashboard |
| `inventory_2` | Admin | Bottom nav - Inventaris |
| `bar_chart` | Admin | Bottom nav - Laporan |
| `handshake` | Home | Volunteer CTA |
| `info` | Booking, Donasi | Info notice |
| `close` | Donasi Sukses | Close/dismiss header |

---

## tailwind.config.js

Complete Tailwind configuration for NativeWind v4:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#002147",
          50: "#e6eaf0",
          100: "#b3c0d4",
          200: "#8096b8",
          300: "#4d6c9c",
          400: "#264689",
          500: "#002147",
          600: "#001b3a",
          700: "#00152d",
          800: "#001020",
          900: "#000a13",
        },
        "background-light": "#f5f7f8",
        "background-dark": "#0f1823",
        whatsapp: "#25D366",
        success: {
          DEFAULT: "#16a34a",
          light: "#dcfce7",
        },
        warning: {
          DEFAULT: "#ea580c",
          light: "#fff7ed",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
        },
      },
      fontFamily: {
        "public-sans": ["PublicSans_400Regular"],
        "public-sans-medium": ["PublicSans_500Medium"],
        "public-sans-semibold": ["PublicSans_600SemiBold"],
        "public-sans-bold": ["PublicSans_700Bold"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: 9999,
      },
      spacing: {
        // 4px grid (Tailwind default is already 4px-based)
        // Custom additions:
        4.5: "18px",
        13: "52px",
        15: "60px",
        18: "72px",
      },
    },
  },
  plugins: [],
};
```

---

## NativeWind Class Mapping Examples

How Tailwind CSS classes from HTML mockups translate to NativeWind in React Native:

| HTML/Tailwind Mockup | NativeWind (React Native) | Notes |
|----------------------|---------------------------|-------|
| `bg-primary` | `className="bg-primary"` | Direct mapping |
| `text-white text-xl font-bold` | `className="text-white text-xl font-public-sans-bold"` | Use custom font family for weight |
| `rounded-xl` | `className="rounded-md"` | Maps to 12px in our config |
| `shadow-lg shadow-primary/20` | `className="shadow-lg shadow-primary/20"` | Shadow support varies on Android |
| `hover:bg-primary/5` | N/A | No hover on mobile; use Pressable onPress styling |
| `transition-all` | N/A | Use Animated API or reanimated for transitions |
| `backdrop-blur-md` | `blurRadius` prop on BlurView | Use `expo-blur` for blur effects |
| `overflow-x-auto` | `<ScrollView horizontal>` | Use ScrollView for horizontal scroll |
| `grid grid-cols-2 gap-4` | `className="flex flex-row flex-wrap gap-4"` | CSS Grid not supported; use flexbox |
| `aspect-video` | `className="aspect-video"` | NativeWind v4 supports aspect-ratio |
| `sticky top-0` | N/A | Use `stickyHeaderIndices` on ScrollView or fixed positioning |
| `cursor-pointer` | N/A | Irrelevant on mobile; use Pressable/TouchableOpacity |
| `peer-checked:bg-primary` | Conditional className with state | Implement with React state + conditional classes |
