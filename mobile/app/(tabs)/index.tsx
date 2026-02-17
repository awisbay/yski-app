import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components';

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

  const programs = [
    { id: '1', title: 'Bantuan Pendidikan Anak Yatim', progress: 75, target: 'Rp 100jt', collected: 'Rp 75jt' },
    { id: '2', title: 'Program Kesehatan Gratis', progress: 45, target: 'Rp 50jt', collected: 'Rp 22.5jt' },
    { id: '3', title: 'Bantuan Bencana Alam', progress: 90, target: 'Rp 200jt', collected: 'Rp 180jt' },
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
          
          {/* Impact Stats */}
          <View className="flex-row mt-6">
            <View className="flex-1 bg-white/10 rounded-xl p-4 mr-3">
              <MaterialIcons name="favorite" size={24} color="white" />
              <Text className="text-white text-xl font-bold mt-2">Rp500jt+</Text>
              <Text className="text-white/80 text-sm">Total Donasi</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-4">
              <MaterialIcons name="people" size={24} color="white" />
              <Text className="text-white text-xl font-bold mt-2">1.2k+</Text>
              <Text className="text-white/80 text-sm">Aksi Sosial</Text>
            </View>
          </View>
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
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {programs.map((program) => (
              <TouchableOpacity
                key={program.id}
                className="w-72 bg-white rounded-2xl p-4 mr-3 shadow-sm"
              >
                <View className="h-32 bg-gray-200 rounded-xl mb-4 items-center justify-center">
                  <MaterialIcons name="volunteer-activism" size={40} color="#9CA3AF" />
                </View>
                <Text className="font-bold text-gray-900 mb-2" numberOfLines={2}>{program.title}</Text>
                <View className="h-2 bg-gray-200 rounded-full mb-2">
                  <View 
                    className="h-2 bg-primary-500 rounded-full" 
                    style={{ width: `${program.progress}%` }}
                  />
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-primary-600 font-semibold text-sm">{program.collected}</Text>
                  <Text className="text-gray-500 text-sm">{program.target}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Volunteer CTA */}
        <View className="px-6 mt-6">
          <TouchableOpacity 
            className="bg-secondary-500 rounded-2xl p-6 flex-row items-center"
            onPress={() => {}}
          >
            <View className="w-14 h-14 bg-white/20 rounded-xl items-center justify-center">
              <MaterialIcons name="group-add" size={32} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold text-lg">Jadi Relawan?</Text>
              <Text className="text-white/80 text-sm">Daftar sekarang dan bantu sesama</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* News Section */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">Berita Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/news')}>
              <Text className="text-primary-600 text-sm">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
            onPress={() => router.push('/news')}
          >
            <View className="h-40 bg-gray-200 items-center justify-center">
              <MaterialIcons name="article" size={48} color="#9CA3AF" />
            </View>
            <View className="p-4">
              <View className="self-start bg-primary-50 px-3 py-1 rounded-full mb-2">
                <Text className="text-primary-700 text-xs font-medium">Kesehatan</Text>
              </View>
              <Text className="font-bold text-gray-900 mb-1">Program Vaksinasi Gratis</Text>
              <Text className="text-gray-500 text-sm">YSKI mengadakan vaksinasi gratis untuk warga kurang mampu...</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
