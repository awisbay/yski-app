import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminInventory() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Inventory</Text>
        <Text className="text-gray-500 mt-1">Kelola alat medis</Text>
      </View>
    </SafeAreaView>
  );
}
