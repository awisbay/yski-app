# YSKI Mobile App

Aplikasi mobile untuk Yayasan Sahabat Khairat Indonesia (YSKI).

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm atau yarn
- Android Studio (untuk emulator) atau HP Android
- Expo Go app (untuk development)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## 📱 Build APK

### Option 1: EAS Build (Recommended)

**Step 1: Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

**Step 2: Login ke Expo**
```bash
eas login
# atau
npm run eas:login
```

**Step 3: Configure Project (pertama kali)**
```bash
npm run build:configure
```

**Step 4: Build APK**
```bash
# Build preview (APK untuk testing)
npm run build:preview

# Build production (AAB untuk Play Store)
npm run build:production
```

### Option 2: Build Manual dengan Docker

```bash
docker build -f Dockerfile.build -t yski-mobile-build .
docker run -v $(pwd)/output:/app/output yski-mobile-build
```

### Option 3: GitHub Actions (Auto Build)

1. Push code ke GitHub
2. Go to Actions tab
3. Run "Build YSKI Mobile APK" workflow
4. Download APK dari artifacts

## 🔧 Configuration

### API URL

Backend API URL sudah dikonfigurasi di `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://173.212.211.18:8080/api/v1"
    }
  }
}
```

Jika IP server berubah, update di:
1. `app.json` → `extra.apiUrl`
2. `eas.json` → `env.API_URL` di semua profile

## 📂 Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (tabs)/            # Main tabs (home, donations, etc)
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── constants/             # Constants (API, config)
├── hooks/                 # Custom React hooks
├── services/              # API services
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

## 🔗 Backend API

- **Base URL**: `http://173.212.211.18:8080/api/v1`
- **Docs**: `http://173.212.211.18:8080/docs`

## 🛠️ Development

```bash
# Start with cleared cache
npm start -- --clear

# Start Android
npm run android

# Start iOS (Mac only)
npm run ios
```

## 📝 Build Profiles

| Profile | Format | Use Case |
|---------|--------|----------|
| development | - | Local development with Expo Go |
| preview | APK | Internal testing |
| production | AAB | Google Play Store |

## 🐛 Troubleshooting

### Error: `Unable to resolve module`
```bash
npm start -- --clear
```

### Error: `EAS build failed`
```bash
# Update EAS CLI
npm install -g @expo/eas-cli@latest

# Clean and rebuild
cd mobile
rm -rf node_modules package-lock.json
npm install
eas build --platform android --profile preview
```

### Error: `Network request failed`
- Cek API URL di `app.json`
- Pastikan backend running: `http://173.212.211.18:8080/health`
- Cek koneksi internet HP

## 📦 Dependencies

- **Expo**: ~54.0.0
- **React Native**: ^0.81.5
- **React**: 19.1.0
- **Expo Router**: ~6.0.23
- **TanStack Query**: ^5.90.21
- **Zustand**: ^4.5.0
- **NativeWind**: ^4.0.0

## 📄 License

Private - Yayasan Sahabat Khairat Indonesia
