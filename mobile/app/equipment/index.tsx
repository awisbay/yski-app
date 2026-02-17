import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Badge } from '@/components';

const STATS = [
  { label: 'Total Alat', value: '24', icon: 'medical-services', color: '#3B82F6' },
  { label: 'Dipinjam', value: '8', icon: 'assignment', color: '#F59E0B' },
  { label: 'Permintaan', value: '3', icon: 'pending', color: '#8B5CF6' },
  { label: 'Tersedia', value: '16', icon: 'check-circle', color: '#10B981' },
];

const EQUIPMENT = [
  {
    id: '1',
    name: 'Kursi Roda Standard',
    category: 'Mobility',
    available: 5,
    borrowed: 2,
    image: null,
  },
  {
    id: '2',
    name: 'Tabung Oksigen 1M',
    category: 'Respiratory',
    available: 3,
    borrowed: 1,
    image: null,
  },
  {
    id: '3',
    name: 'Tempat Tidur Pasien',
    category: 'Furniture',
    available: 2,
    borrowed: 3,
    image: null,
  },
];

const ACTIVE_LOANS = [
  { id: '1', borrower: 'Ahmad Subari', item: 'Kursi Roda', returnDate: '20 Mei 2024' },
  { id: '2', borrower: 'Siti Aminah', item: 'Tabung Oksigen', returnDate: '18 Mei 2024' },
  { id: '3', borrower: 'Budi Santoso', item: 'Tongkat Jalan', returnDate: '25 Mei 2024' },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Inventaris Alat Medis</Text>
        <Text className="text-gray-500 mt-1">Peminjaman alkes gratis untuk sahabat</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Stats */}
        <View className="flex-row flex-wrap px-6 pt-6">
          {STATS.map((stat, index) => (
            <View key={index} className="w-1/2 pr-2 mb-3">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
                  </View>
                  <View className="ml-3">
                    <Text className="text-2xl font-bold text-gray-900">{stat.value}</Text>
                    <Text className="text-gray-500 text-xs">{stat.label}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* New Requests Banner */}
        <View className="mx-6 mt-2">
          <View className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white/20 rounded-lg items-center justify-center">
                  <MaterialIcons name="notifications" size={24} color="white" />
                </View>
                <View className="ml-3">
                  <Text className="text-white font-semibold">Ada 3 Permintaan Baru</Text>
                  <Text className="text-white/80 text-sm">Segera verifikasi permintaan</Text>
                </View>
              </View>
              <TouchableOpacity className="bg-white px-4 py-2 rounded-lg">
                <Text className="text-primary-600 font-medium text-sm">Setujui</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Equipment Catalog */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Ketersediaan Alat</Text>
            <TouchableOpacity>
              <Text className="text-primary-600 text-sm">Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {EQUIPMENT.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              onPress={() => {}}
            >
              <View className="flex-row">
                <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center">
                  <MaterialIcons name="healing" size={32} color="#9CA3AF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="font-semibold text-gray-900">{item.name}</Text>
                  <Text className="text-gray-500 text-sm">{item.category}</Text>
                  <View className="flex-row mt-2">
                    <View className="bg-green-100 px-2 py-1 rounded-md mr-2">
                      <Text className="text-green-700 text-xs">Tersedia: {item.available}</Text>
                    </View>
                    <View className="bg-blue-100 px-2 py-1 rounded-md">
                      <Text className="text-blue-700 text-xs">Dipinjam: {item.borrowed}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Loans Table */}
        <View className="px-6 mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Peminjaman Aktif</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            {/* Table Header */}
            <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-200">
              <Text className="flex-1 text-gray-600 text-sm font-medium">Peminjam</Text>
              <Text className="w-24 text-gray-600 text-sm font-medium">Item</Text>
              <Text className="w-20 text-gray-600 text-sm font-medium text-right">Kembali</Text>
            </View>
            {/* Table Rows */}
            {ACTIVE_LOANS.map((loan, index) => (
              <View
                key={loan.id}
                className={`flex-row items-center px-4 py-3 ${
                  index !== ACTIVE_LOANS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-1 flex-row items-center">
                  <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-2">
                    <Text className="text-primary-700 font-semibold text-xs">
                      {loan.borrower.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-gray-900 text-sm" numberOfLines={1}>
                    {loan.borrower}
                  </Text>
                </View>
                <Text className="w-24 text-gray-600 text-sm">{loan.item}</Text>
                <Text className="w-20 text-gray-600 text-sm text-right">{loan.returnDate}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
