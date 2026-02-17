import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Dashboard Admin</Text>
        <Text className="text-gray-500 mt-1">Kelola aktivitas yayasan</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <MaterialIcons name="people" size={24} color="#3B82F6" />
              <Text className="text-2xl font-bold text-gray-900 mt-2">156</Text>
              <Text className="text-gray-500 text-sm">Total Sahabat</Text>
            </View>
          </View>
          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <MaterialIcons name="local-shipping" size={24} color="#10B981" />
              <Text className="text-2xl font-bold text-gray-900 mt-2">24</Text>
              <Text className="text-gray-500 text-sm">Booking Aktif</Text>
            </View>
          </View>
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <MaterialIcons name="favorite" size={24} color="#F59E0B" />
              <Text className="text-2xl font-bold text-gray-900 mt-2">Rp45jt</Text>
              <Text className="text-gray-500 text-sm">Donasi Bulan Ini</Text>
            </View>
          </View>
          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <MaterialIcons name="pending-actions" size={24} color="#8B5CF6" />
              <Text className="text-2xl font-bold text-gray-900 mt-2">8</Text>
              <Text className="text-gray-500 text-sm">Menunggu Approval</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
