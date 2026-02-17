import { View, TextInput, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  icon?: keyof typeof MaterialIcons.glyphMap;
  multiline?: boolean;
  numberOfLines?: number;
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
  multiline = false,
  numberOfLines = 1,
}: InputProps) {
  return (
    <View className="w-full">
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
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color="#9CA3AF"
            style={{ marginRight: 12 }}
          />
        )}
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
        />
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
