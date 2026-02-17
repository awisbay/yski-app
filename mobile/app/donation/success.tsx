import { View, Text, TouchableOpacity, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';
import Animated, { FadeIn, ScaleIn } from 'react-native-reanimated';

export default function DonationSuccessScreen() {
  const router = useRouter();

  const handleShare = async () => {
    const message = `Saya baru saja berdonasi Rp 100.000 melalui Clicky Foundation. Yuk, berdonasi bersama! 🌟`;
    const url = 'https://wa.me/?text=' + encodeURIComponent(message);
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        {/* Success Animation */}
        <Animated.View
          entering={ScaleIn.delay(200)}
          className="items-center mb-8"
        >
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="check" size={48} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Terima Kasih!
          </Text>
          <Text className="text-gray-500 text-center">
            Donasi Anda sangat berarti bagi mereka yang membutuhkan
          </Text>
        </Animated.View>

        {/* Transaction Summary */}
        <Animated.View
          entering={FadeIn.delay(400)}
          className="bg-gray-50 rounded-2xl p-6 mb-8"
        >
          <Text className="text-gray-500 text-sm mb-4">Ringkasan Transaksi</Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">ID Donasi</Text>
              <Text className="font-medium text-gray-900">#CKY-12345678</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Tanggal</Text>
              <Text className="font-medium text-gray-900">24 Mei 2024, 14:20</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Metode</Text>
              <Text className="font-medium text-gray-900">QRIS</Text>
            </View>
            <View className="h-px bg-gray-200" />
            <View className="flex-row justify-between">
              <Text className="text-gray-700 font-medium">Total Donasi</Text>
              <Text className="font-bold text-xl text-gray-900">Rp 100.000</Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(600)} className="space-y-3">
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center bg-green-500 py-4 rounded-xl"
          >
            <MaterialIcons name="share" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Bagikan ke WhatsApp</Text>
          </TouchableOpacity>

          <Button
            title="Kembali ke Beranda"
            variant="outline"
            onPress={() => router.replace('/(tabs)')}
          />
        </Animated.View>

        {/* Help Link */}
        <TouchableOpacity className="mt-6 items-center">
          <Text className="text-gray-500 text-sm">
            Butuh bantuan dengan donasi Anda?{' '}
            <Text className="text-primary-600 font-medium">Hubungi Kami</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
