import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Aktivitas</Text>
        <Text className="text-gray-500 mt-1">Riwayat dan status layanan Anda</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Empty State */}
        <View className="items-center py-12">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="history" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-gray-800 font-semibold text-lg">Belum Ada Aktivitas</Text>
          <Text className="text-gray-500 text-center mt-2 px-8">
            Riwayat booking, donasi, dan peminjaman akan muncul di sini
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
