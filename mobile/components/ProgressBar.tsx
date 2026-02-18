import { View, Text, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface StepProgressBarProps {
  steps: string[];
  currentStep: number;
  showLabels?: boolean;
  progress?: never;
  style?: ViewStyle;
}

interface SimpleProgressBarProps {
  progress: number;
  steps?: never;
  currentStep?: never;
  showLabels?: never;
  style?: ViewStyle;
}

export type ProgressBarProps = StepProgressBarProps | SimpleProgressBarProps;

export function ProgressBar(props: ProgressBarProps) {
  // Simple progress bar mode (0-1 value)
  if (typeof props.progress === 'number') {
    const percent = Math.min(Math.max(props.progress, 0), 1) * 100;
    return (
      <View
        style={[{ height: 8, backgroundColor: colors.gray[200], borderRadius: 4, overflow: 'hidden' }, props.style]}
      >
        <View
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: colors.primary[500],
            borderRadius: 4,
          }}
        />
      </View>
    );
  }

  // Step progress bar mode
  const { steps, currentStep, showLabels = true, style } = props;

  return (
    <View className="px-6 py-4" style={style}>
      {/* Step Indicators */}
      <View className="flex-row items-center">
        {steps.map((step, index) => (
          <View key={index} className="flex-1 flex-row items-center">
            {/* Step Circle */}
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                index < currentStep
                  ? 'bg-primary-500'
                  : index === currentStep
                  ? 'bg-primary-500'
                  : 'bg-gray-200'
              }`}
            >
              {index < currentStep ? (
                <Text className="text-white font-bold">&#10003;</Text>
              ) : (
                <Text
                  className={`font-semibold ${
                    index === currentStep ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {index + 1}
                </Text>
              )}
            </View>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Labels */}
      {showLabels && (
        <View className="flex-row mt-2">
          {steps.map((step, index) => (
            <View key={index} className="flex-1">
              <Text
                className={`text-xs text-center ${
                  index <= currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Step Counter */}
      <Text className="text-center text-sm text-gray-500 mt-3">
        Langkah {currentStep + 1} dari {steps.length}
      </Text>
    </View>
  );
}
