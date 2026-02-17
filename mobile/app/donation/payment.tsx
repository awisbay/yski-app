import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';

const PAYMENT_METHODS = [
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Gopay, OVO, LinkAja, Dana, & Mobile Banking',
    icon: 'qr-code',
    popular: true,
  },
  {
    id: 'gopay',
    name: 'GoPay',
    description: 'Pembayaran via GoPay',
    icon: 'account-wallet',
  },
  {
    id: 'ovo',
    name: 'OVO',
    description: 'Pembayaran via OVO',
    icon: 'account-balance-wallet',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    description: 'Pembayaran via ShopeePay',
    icon: 'shopping-bag',
  },
  {
    id: 'bca',
    name: 'Bank BCA',
    description: 'Transfer Virtual Account',
    icon: 'account-balance',
    autoVerify: true,
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    description: 'Transfer Virtual Account',
    icon: 'account-balance',
    autoVerify: true,
  },
  {
    id: 'manual',
    name: 'Transfer Manual',
    description: 'Transfer ke rekening yayasan',
    icon: 'swap-horiz',
  },
];

export default function PaymentMethodScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900 mr-6">
          Metode Pembayaran
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Step Indicator */}
        <View className="px-6 py-6">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-primary-500 rounded-full" />
            <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center mx-2">
              <Text className="text-white font-bold">2</Text>
            </View>
            <View className="flex-1 h-2 bg-gray-200 rounded-full" />
          </View>
          <Text className="text-center text-sm text-gray-500 mt-2">Langkah 2 dari 3</Text>
        </View>

        {/* Summary */}
        <View className="mx-6 bg-primary-50 rounded-2xl p-4 mb-6">
          <Text className="text-gray-600 text-sm">Total Infaq Anda</Text>
          <Text className="text-2xl font-bold text-primary-700">Rp 100.000</Text>
        </View>

        {/* Popular Methods */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Paling Populer
          </Text>
          {PAYMENT_METHODS.filter(m => m.popular).map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`flex-row items-center p-4 rounded-xl border-2 mb-3 ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                <MaterialIcons name={method.icon as any} size={24} color="#374151" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900">{method.name}</Text>
                <Text className="text-gray-500 text-sm">{method.description}</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <MaterialIcons name="check" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* E-Wallet */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            E-Wallet
          </Text>
          {PAYMENT_METHODS.filter(m => ['gopay', 'ovo', 'shopeepay'].includes(m.id)).map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`flex-row items-center p-4 rounded-xl border-2 mb-3 ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                <MaterialIcons name={method.icon as any} size={24} color="#374151" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900">{method.name}</Text>
                <Text className="text-gray-500 text-sm">{method.description}</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <MaterialIcons name="check" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transfer Bank */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Transfer Bank (Virtual Account)
          </Text>
          {PAYMENT_METHODS.filter(m => ['bca', 'mandiri', 'manual'].includes(m.id)).map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`flex-row items-center p-4 rounded-xl border-2 mb-3 ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                <MaterialIcons name={method.icon as any} size={24} color="#374151" />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900">{method.name}</Text>
                  {method.autoVerify && (
                    <View className="ml-2 px-2 py-0.5 bg-green-100 rounded">
                      <Text className="text-green-700 text-xs">Verifikasi otomatis</Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-500 text-sm">{method.description}</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <MaterialIcons name="check" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-blue-50 rounded-xl p-4">
            <MaterialIcons name="verified-user" size={20} color="#3B82F6" />
            <Text className="flex-1 ml-2 text-blue-800 text-sm">
              Pembayaran Anda diproses secara aman oleh Clicky Foundation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="p-6 border-t border-gray-200 bg-white">
        <Button
          title="Lanjut ke Pembayaran"
          onPress={() => router.push('/donation/success')}
          disabled={!selectedMethod}
        />
      </View>
    </SafeAreaView>
  );
}
