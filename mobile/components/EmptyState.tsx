import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-6">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <MaterialIcons name={icon} size={40} color="#9CA3AF" />
      </View>
      <Text className="text-gray-800 font-semibold text-lg text-center">{title}</Text>
      <Text className="text-gray-500 text-center mt-2 mb-6">{message}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" />
      )}
    </View>
  );
}
