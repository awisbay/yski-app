import { View, Text, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary' | 'secondary';

interface BadgeProps {
  text?: string;
  label?: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ text, label, variant = 'default', size = 'md', style }: BadgeProps) {
  const displayText = label || text || '';
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <View className={`rounded-full ${variantStyles[variant].split(' ')[0]} ${sizeStyles[size]}`} style={style}>
      <Text className={`font-medium ${variantStyles[variant].split(' ')[1]}`}>
        {displayText}
      </Text>
    </View>
  );
}
