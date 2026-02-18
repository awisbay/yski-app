import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  isLoading,
  icon,
  leftIcon,
  rightIcon,
  className = '',
}: ButtonProps) {
  const isLoadingResolved = isLoading ?? loading;
  const baseStyles = 'flex-row items-center justify-center rounded-xl';
  
  const variantStyles = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    outline: 'bg-transparent border-2 border-primary-500',
    ghost: 'bg-transparent',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };
  
  const textStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-500',
    ghost: 'text-primary-500',
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || isLoadingResolved;
  const resolvedLeftIcon = leftIcon || icon;
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const iconColor = variant === 'primary' || variant === 'secondary' ? 'white' : '#10B981';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {isLoadingResolved ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {resolvedLeftIcon && (
            <MaterialIcons
              name={resolvedLeftIcon}
              size={iconSize}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={`
              font-semibold
              ${textStyles[variant]}
              ${textSizes[size]}
            `}
          >
            {title}
          </Text>
          {rightIcon && (
            <MaterialIcons
              name={rightIcon}
              size={iconSize}
              color={iconColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
