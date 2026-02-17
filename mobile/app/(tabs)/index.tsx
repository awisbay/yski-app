import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const quickActions = [
    {
      title: 'Pindah Gratis',
      icon: 'local-shipping',
      color: '#10B981',
      onPress: () => router.push('/booking'),
    },
    {
      title: 'Alat Medis',
      icon: 'healing',
      color: '#3B82F6',
      onPress: () => router.push('/equipment'),
    },
    {
      title: 'Zakat & Donasi',
      icon: 'favorite',
      color: '#F59E0B',
      onPress: () => router.push('/donation'),
    },
    {
      title: 'Jemput Zakat',
      icon: 'cleaning-services',
      color: '#8B5CF6',
      onPress: () => router.push('/pickup'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary-500 px-6 pt-6 pb-8 rounded-b-3xl">
          <Text className="text-white/80 text-sm">Selamat datang,</Text>
          <Text className="text-white text-2xl font-bold mt-1">
            {user?.full_name || 'Sahabat'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-4">
          <View className="bg-white rounded-2xl shadow-sm p-4">
            <Text className="text-gray-800 font-semibold mb-4">Layanan Kami</Text>
            <View className="flex-row flex-wrap">
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/4 items-center py-3"
                  onPress={action.onPress}
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <MaterialIcons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text className="text-xs text-gray-600 text-center">{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Programs Section */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">Program Sosial</Text>
            <TouchableOpacity>
              <Text className="text-primary-600 text-sm">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-gray-500 text-center py-4">Program akan ditampilkan di sini</Text>
          </View>
        </View>

        {/* News Section */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">Berita Terbaru</Text>
            <TouchableOpacity>
              <Text className="text-primary-600 text-sm">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-gray-500 text-center py-4">Berita akan ditampilkan di sini</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
