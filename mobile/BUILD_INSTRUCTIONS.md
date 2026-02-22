# YSKI Mobile - Build Instructions

## 🚀 Cara Build APK dengan EAS (Expo Application Services)

### Persiapan

1. **Install EAS CLI di lokal machine:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login ke Expo:**
   ```bash
   eas login
   ```

3. **Configure Project (hanya sekali):**
   ```bash
   cd mobile
   eas build:configure
   ```
   Pilih platform `Android` dan `Managed workflow`.

### Build APK

#### Build Preview (APK - Internal Distribution)
```bash
cd mobile
eas build --platform android --profile preview
```

Hasil: File APK yang bisa langsung di-install di Android.

#### Build Production (AAB - Play Store)
```bash
cd mobile
eas build --platform android --profile production
```

Hasil: File AAB untuk upload ke Google Play Store.

### 📱 Install APK di HP

1. Download APK dari link yang diberikan EAS
2. Transfer ke HP (WhatsApp, Telegram, USB, dll)
3. Aktifkan "Install from Unknown Sources" di HP
4. Install APK

### 🔧 Troubleshooting

#### Error: "Project not found"
```bash
eas build:configure
```

#### Error: "No EXPO_TOKEN found"
Buat token di https://expo.dev/settings/access-tokens
```bash
export EXPO_TOKEN=your_token_here
```

#### Update API URL
Edit file `mobile/app.json`:
```json
"extra": {
  "apiUrl": "http://173.212.211.18:8080/api/v1"
}
```

### 🌐 API Configuration

Backend API sudah dikonfigurasi ke:
```
http://173.212.211.18:8080/api/v1
```

Jika IP server berubah, update di:
1. `mobile/app.json` → `extra.apiUrl`
2. `mobile/eas.json` → semua profile `env.API_URL`

### 📦 Output Files

| Profile | Format | Kegunaan |
|---------|--------|----------|
| preview | .apk | Testing internal |
| production | .aab | Google Play Store |

### 📝 Catatan

- Build pertama memakan waktu ~15-20 menit
- Build selanjutnya lebih cepat (~5-10 menit)
- APK preview bisa di-download langsung dari Expo dashboard
- Maksimum ukuran APK: 100MB (gunakan AAB untuk Play Store)

### 🔗 Useful Links

- Expo Dashboard: https://expo.dev
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- YSKI Backend: http://173.212.211.18:8080/api/v1
