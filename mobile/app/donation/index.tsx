import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';

const PRESET_AMOUNTS = [
  { amount: 50000, label: 'Nominal Minimal' },
  { amount: 100000, label: 'Sering Dipilih' },
  { amount: 500000, label: 'Sangat Berarti' },
];

const DONATION_TYPES = [
  { id: 'infaq', label: 'Infaq', icon: 'favorite' },
  { id: 'sedekah', label: 'Sedekah', icon: 'volunteer-activism' },
  { id: 'wakaf', label: 'Wakaf', icon: 'account-balance' },
  { id: 'zakat', label: 'Zakat', icon: 'clean-hands' },
];

export default function DonationScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('infaq');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getTotalAmount = () => {
    if (selectedAmount) return selectedAmount;
    return parseInt(customAmount.replace(/\./g, '')) || 0;
  };

  const handleCustomAmountChange = (text: string) => {
    setSelectedAmount(null);
    setCustomAmount(formatCurrency(text));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900 mr-6">
          Pilih Nominal
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Step Indicator */}
        <View className="py-6">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-primary-500 rounded-full" />
            <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center mx-2">
              <Text className="text-white font-bold">1</Text>
            </View>
            <View className="flex-1 h-2 bg-gray-200 rounded-full" />
          </View>
          <Text className="text-center text-sm text-gray-500 mt-2">Langkah 1 dari 3</Text>
        </View>

        {/* Donation Type */}
        <Text className="text-lg font-semibold text-gray-900 mb-4">Jenis Donasi</Text>
        <View className="flex-row flex-wrap mb-6">
          {DONATION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              className={`w-[48%] mb-3 p-4 rounded-xl border-2 ${
                selectedType === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              onPress={() => setSelectedType(type.id)}
            >
              <MaterialIcons
                name={type.icon as any}
                size={24}
                color={selectedType === type.id ? '#10B981' : '#6B7280'}
              />
              <Text className={`mt-2 font-medium ${
                selectedType === type.id ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preset Amounts */}
        <Text className="text-lg font-semibold text-gray-900 mb-4">Pilih Nominal</Text>
        <View className="space-y-3 mb-6">
          {PRESET_AMOUNTS.map((item) => (
            <TouchableOpacity
              key={item.amount}
              className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${
                selectedAmount === item.amount
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              onPress={() => {
                setSelectedAmount(item.amount);
                setCustomAmount('');
              }}
            >
              <View>
                <Text className={`text-lg font-bold ${
                  selectedAmount === item.amount ? 'text-primary-700' : 'text-gray-900'
                }`}>
                  Rp {item.amount.toLocaleString('id-ID')}
                </Text>
                <Text className="text-gray-500 text-sm">{item.label}</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedAmount === item.amount
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedAmount === item.amount && (
                  <MaterialIcons name="check" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <Text className="text-lg font-semibold text-gray-900 mb-4">Nominal Lain</Text>
        <View className="flex-row items-center border-2 border-gray-300 rounded-xl px-4 py-3 mb-2">
          <Text className="text-gray-700 font-semibold text-lg mr-2">Rp</Text>
          <TextInput
            value={customAmount}
            onChangeText={handleCustomAmountChange}
            placeholder="0"
            keyboardType="numeric"
            className="flex-1 text-xl font-semibold text-gray-900"
          />
        </View>
        <Text className="text-gray-500 text-sm mb-6">
          Minimal donasi via aplikasi adalah Rp 10.000
        </Text>
      </ScrollView>

      {/* Footer */}
      <View className="p-6 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-600">Total {DONATION_TYPES.find(t => t.id === selectedType)?.label}</Text>
          <Text className="text-xl font-bold text-gray-900">
            Rp {getTotalAmount().toLocaleString('id-ID')}
          </Text>
        </View>
        <Button
          title="Lanjut ke Pembayaran"
          onPress={() => router.push('/donation/payment')}
          disabled={getTotalAmount() < 10000}
        />
      </View>
    </SafeAreaView>
  );
}
