/**
 * App Configuration
 * Clicky Foundation - YSKI App
 */

import Constants from 'expo-constants';

export const config = {
  // API Configuration
  api: {
    baseUrl: Constants.expoConfig?.extra?.apiUrl || 'http://localhost/api/v1',
    timeout: 10000,
    retries: 3,
  },
  // App Info
  app: {
    name: 'Clicky Foundation',
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
  },
  // Feature Flags
  features: {
    enablePushNotifications: true,
    enableBiometricAuth: false,
    enableOfflineMode: false,
  },
  // Auth Configuration
  auth: {
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryBuffer: 300, // 5 minutes before expiry
  },
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  // Cache
  cache: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
} as const;

export type Config = typeof config;

// Direct exports for convenience
export const API_BASE_URL = config.api.baseUrl;
