import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({
  size = 'large',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
        <ActivityIndicator size={size} color="#10B981" />
        {message && (
          <Text className="mt-4 text-gray-600 text-sm">{message}</Text>
        )}
      </View>
    );
  }

  return (
    <View className="py-4 items-center">
      <ActivityIndicator size={size} color="#10B981" />
      {message && (
        <Text className="mt-2 text-gray-600 text-sm">{message}</Text>
      )}
    </View>
  );
}
