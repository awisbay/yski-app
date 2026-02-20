import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof MaterialIcons.glyphMap;
    onPress: () => void;
  };
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

export function Header({
  title,
  showBackButton = true,
  onBackPress,
  rightAction,
  rightElement,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        transparent ? '' : 'bg-white border-b border-gray-200'
      }`}
    >
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color={transparent ? 'white' : '#374151'} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}

      <Text
        className={`flex-1 text-center text-lg font-semibold ${
          transparent ? 'text-white' : 'text-gray-900'
        }`}
        numberOfLines={1}
      >
        {title}
      </Text>

      {rightElement ? (
        rightElement
      ) : rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress} className="p-2 -mr-2">
          <MaterialIcons
            name={rightAction.icon}
            size={24}
            color={transparent ? 'white' : '#374151'}
          />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}
