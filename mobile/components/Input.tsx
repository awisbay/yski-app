import React from 'react';
import { View, TextInput, Text, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type IconProp = keyof typeof MaterialIcons.glyphMap | React.ReactNode;

export interface InputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  icon?: IconProp;
  leftIcon?: IconProp;
  rightIcon?: IconProp;
  style?: StyleProp<ViewStyle>;
}

function renderIcon(icon: IconProp, style?: object) {
  if (typeof icon === 'string') {
    return (
      <MaterialIcons
        name={icon as keyof typeof MaterialIcons.glyphMap}
        size={20}
        color="#9CA3AF"
        style={style}
      />
    );
  }
  return <View style={style}>{icon}</View>;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  leftIcon,
  rightIcon,
  multiline = false,
  numberOfLines = 1,
  style,
  ...textInputProps
}: InputProps) {
  const resolvedLeftIcon = leftIcon || icon;

  return (
    <View className="w-full" style={[{ marginBottom: 16 }, style]}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center border rounded-xl px-4
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${multiline ? 'py-3' : ''}
        `}
      >
        {resolvedLeftIcon && renderIcon(resolvedLeftIcon, { marginRight: 12 })}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          className={`
            flex-1 text-gray-900
            ${multiline ? 'h-24 text-base' : 'py-3'}
          `}
          placeholderTextColor="#9CA3AF"
          {...textInputProps}
        />
        {rightIcon && renderIcon(rightIcon, { marginLeft: 12 })}
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
