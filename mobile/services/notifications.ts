import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi } from './api';

// Check if running in Expo Go (push notifications removed in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy-load expo-notifications to avoid crash in Expo Go
function getNotificationsModule() {
  return require('expo-notifications') as typeof import('expo-notifications');
}

// Configure notification behavior (only in dev builds)
if (!isExpoGo) {
  const Notifications = getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Register for push notifications
 * Returns the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    console.log('Push notifications are not supported in Expo Go (SDK 53+). Use a development build.');
    return null;
  }

  const Notifications = getNotificationsModule();
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        console.warn('EAS project ID not configured in app.json extra.eas.projectId');
        return null;
      }
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushToken.data;

      // Register token with backend
      await notificationsApi.registerPushToken({
        token,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      });
    } catch (error) {
      console.warn('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Unregister push notification token
 */
export async function unregisterPushNotificationsAsync(token: string): Promise<void> {
  try {
    await notificationsApi.removePushToken(token);
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
) {
  if (isExpoGo) {
    return () => {};
  }

  const Notifications = getNotificationsModule();

  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get badge count
 */
export async function getBadgeCountAsync(): Promise<number> {
  if (isExpoGo) return 0;
  return await getNotificationsModule().getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCountAsync(count: number): Promise<void> {
  if (isExpoGo) return;
  await getNotificationsModule().setBadgeCountAsync(count);
}
