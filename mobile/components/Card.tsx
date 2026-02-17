import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CardProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  onPress?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  description,
  imageUrl,
  onPress,
  actionLabel,
  children,
  className = '',
}: CardProps) {
  const CardContent = (
    <View
      className={`
        bg-white rounded-2xl shadow-sm overflow-hidden
        ${className}
      `}
    >
      {imageUrl && (
        <View className="h-40 bg-gray-200" />
      )}
      <View className="p-4">
        {title && (
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </Text>
        )}
        {description && (
          <Text className="text-gray-500 text-sm leading-5">
            {description}
          </Text>
        )}
        {children}
        {actionLabel && (
          <View className="flex-row items-center mt-4">
            <Text className="text-primary-600 font-medium text-sm">
              {actionLabel}
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#10B981" />
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}
