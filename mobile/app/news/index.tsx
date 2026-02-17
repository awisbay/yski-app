import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '@/components';

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'kesehatan', label: 'Kesehatan' },
  { id: 'bencana', label: 'Bencana' },
  { id: 'pendidikan', label: 'Pendidikan' },
];

const NEWS_ITEMS = [
  {
    id: '1',
    title: 'Program Vaksinasi Gratis untuk Warga Kurang Mampu',
    excerpt: 'YSKI mengadakan program vaksinasi gratis bagi warga yang kurang mampu di wilayah Jakarta Timur...',
    category: 'kesehatan',
    date: '15 Mei 2024',
    image: null,
  },
  {
    id: '2',
    title: 'Bantuan Darurat untuk Korban Banjir',
    excerpt: 'Tim relawan YSKI menyalurkan bantuan makanan dan obat-obatan untuk korban banjir...',
    category: 'bencana',
    date: '12 Mei 2024',
    image: null,
  },
  {
    id: '3',
    title: 'Beasiswa Pendidikan untuk 100 Anak Yatim',
    excerpt: 'Program beasiswa tahunan YSKI kembali dibuka untuk membantu pendidikan anak yatim...',
    category: 'pendidikan',
    date: '10 Mei 2024',
    image: null,
  },
  {
    id: '4',
    title: 'Pembukaan Posko Kesehatan di Daerah Terpencil',
    excerpt: 'YSKI membuka posko kesehatan untuk memberikan pelayanan kesehatan gratis...',
    category: 'kesehatan',
    date: '8 Mei 2024',
    image: null,
  },
];

export default function NewsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredNews = activeCategory === 'all'
    ? NEWS_ITEMS
    : NEWS_ITEMS.filter(item => item.category === activeCategory);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Berita & Dampak</Text>
        <Text className="text-gray-500 mt-1">Update kegiatan dan dampak sosial</Text>
      </View>

      {/* Category Filter */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              className={`mr-3 px-5 py-2 rounded-full ${
                activeCategory === category.id
                  ? 'bg-primary-500'
                  : 'bg-gray-100'
              }`}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text className={`font-medium ${
                activeCategory === category.id ? 'text-white' : 'text-gray-700'
              }`}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* News List */}
      <ScrollView className="flex-1 px-6 pt-6">
        {filteredNews.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm"
            onPress={() => {}}
          >
            {/* Image Placeholder */}
            <View className="h-48 bg-gray-200 items-center justify-center">
              <MaterialIcons name="image" size={48} color="#9CA3AF" />
            </View>
            
            <View className="p-4">
              {/* Category Badge */}
              <View className="self-start bg-primary-50 px-3 py-1 rounded-full mb-3">
                <Text className="text-primary-700 text-xs font-medium capitalize">
                  {item.category}
                </Text>
              </View>

              <Text className="text-lg font-bold text-gray-900 mb-2" numberOfLines={2}>
                {item.title}
              </Text>
              
              <Text className="text-gray-500 text-sm mb-4" numberOfLines={2}>
                {item.excerpt}
              </Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialIcons name="calendar-today" size={16} color="#9CA3AF" />
                  <Text className="ml-1 text-gray-400 text-sm">{item.date}</Text>
                </View>
                <TouchableOpacity className="flex-row items-center">
                  <Text className="text-primary-600 font-medium text-sm mr-1">Baca Selengkapnya</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Load More */}
        <TouchableOpacity className="py-4 items-center">
          <Text className="text-primary-600 font-medium">Muat Lebih Banyak</Text>
        </TouchableOpacity>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
