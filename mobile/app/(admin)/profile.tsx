import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';

export default function AdminProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Profil</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="m-6 bg-white rounded-2xl p-6 shadow-sm">
          <View className="items-center">
            <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="person" size={48} color="#10B981" />
            </View>
            <Text className="text-xl font-bold text-gray-900">{user?.full_name || 'Admin'}</Text>
            <Text className="text-gray-500 mt-1">{user?.email || ''}</Text>
            <View className="mt-3 px-4 py-1 bg-primary-50 rounded-full">
              <Text className="text-primary-700 text-sm font-medium capitalize">{user?.role || 'admin'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="mx-6 mt-6 bg-red-50 py-4 rounded-xl items-center"
          onPress={handleLogout}
        >
          <Text className="text-red-600 font-semibold">Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
