import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap | React.ComponentType<any>;
  title: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: EmptyStateAction;
  compact?: boolean;
}

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  description,
  actionLabel,
  onAction,
  action,
  compact = false,
}: EmptyStateProps) {
  const displayMessage = description || message;
  const resolvedActionLabel = action?.label || actionLabel;
  const resolvedOnAction = action?.onPress || onAction;

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={compact ? 32 : 40} color="#9CA3AF" />;
    }
    const IconComponent = icon;
    return <IconComponent size={compact ? 32 : 40} color="#9CA3AF" />;
  };

  return (
    <View className={`items-center justify-center ${compact ? 'py-6' : 'py-12'} px-6`}>
      <View className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} bg-gray-100 rounded-full items-center justify-center mb-4`}>
        {renderIcon()}
      </View>
      <Text className="text-gray-800 font-semibold text-lg text-center">{title}</Text>
      {displayMessage && (
        <Text className="text-gray-500 text-center mt-2 mb-6">{displayMessage}</Text>
      )}
      {resolvedActionLabel && resolvedOnAction && (
        <Button title={resolvedActionLabel} onPress={resolvedOnAction} variant="outline" />
      )}
    </View>
  );
}
