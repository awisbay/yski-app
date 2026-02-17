import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ isVisible, onClose, title, children, height = 400 }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT - height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(SCREEN_HEIGHT - height + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: SCREEN_HEIGHT - height,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isVisible) return null;

  return (
    <Animated.View
      className="absolute inset-0 z-50"
      style={{ opacity }}
    >
      {/* Backdrop */}
      <TouchableOpacity
        className="absolute inset-0 bg-black/50"
        onPress={onClose}
        activeOpacity={1}
      />
      
      {/* Sheet */}
      <Animated.View
        className="absolute left-0 right-0 bg-white rounded-t-3xl"
        style={{
          height,
          transform: [{ translateY }],
        }}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View className="items-center pt-3 pb-2">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </View>

        {/* Header */}
        {title && (
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View className="flex-1">
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
