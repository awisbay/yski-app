import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ServicesScreen() {
  const router = useRouter();

  const services = [
    {
      category: 'Layanan Utama',
      items: [
        { title: 'Booking Pindahan', icon: 'local-shipping', desc: 'Pesan armada pindahan', route: '/booking' },
        { title: 'Pinjam Alat Medis', icon: 'healing', desc: 'Peminjaman alkes gratis', route: '/equipment' },
        { title: 'Jemput Zakat', icon: 'cleaning-services', desc: 'Penjemputan zakat & donasi', route: '/pickup' },
        { title: 'Donasi Online', icon: 'favorite', desc: 'Donasi infaq & sedekah', route: '/donation' },
      ]
    },
    {
      category: 'Informasi',
      items: [
        { title: 'Program Yayasan', icon: 'volunteer-activism', desc: 'Lihat program sosial', route: '/programs' },
        { title: 'Berita & Dampak', icon: 'article', desc: 'Update kegiatan yayasan', route: '/news' },
        { title: 'Laporan Keuangan', icon: 'account-balance', desc: 'Transparansi keuangan', route: '/finance' },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Layanan</Text>
        <Text className="text-gray-500 mt-1">Pilih layanan yang Anda butuhkan</Text>
      </View>

      <ScrollView className="flex-1">
        {services.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mt-6 px-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">{section.category}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm"
                onPress={() => router.push(item.route)}
              >
                <View className="w-12 h-12 bg-primary-50 rounded-xl items-center justify-center">
                  <MaterialIcons name={item.icon as any} size={24} color="#10B981" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="font-semibold text-gray-800">{item.title}</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">{item.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
