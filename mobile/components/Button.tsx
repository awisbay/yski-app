import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
}: ButtonProps) {
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

  const isDisabled = disabled || loading;

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
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? 'white' : '#10B981'} />
      ) : (
        <>
          {icon && (
            <MaterialIcons
              name={icon}
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              color={variant === 'primary' || variant === 'secondary' ? 'white' : '#10B981'}
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
        </>
      )}
    </TouchableOpacity>
  );
}
