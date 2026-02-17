import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Input } from '@/components';

const PICKUP_TYPES = [
  { id: 'zakat', label: 'Zakat', icon: 'clean-hands', color: '#10B981' },
  { id: 'kencleng', label: 'Kencleng/Infaq', icon: 'savings', color: '#3B82F6' },
];

const TIME_SLOTS = [
  { id: 'morning', label: '09:00-12:00', time: 'Pagi' },
  { id: 'afternoon', label: '13:00-15:00', time: 'Siang' },
  { id: 'evening', label: '16:00-18:00', time: 'Sore' },
];

export default function PickupScreen() {
  const router = useRouter();
  const [pickupType, setPickupType] = useState('zakat');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900 mr-6">
          Penjemputan Donasi
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Type Selection */}
        <View className="py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Jenis Donasi</Text>
          <View className="flex-row">
            {PICKUP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl mr-2 ${
                  pickupType === type.id
                    ? 'bg-primary-500'
                    : 'bg-gray-100'
                }`}
                onPress={() => setPickupType(type.id)}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={20}
                  color={pickupType === type.id ? 'white' : '#374151'}
                />
                <Text className={`ml-2 font-medium ${
                  pickupType === type.id ? 'text-white' : 'text-gray-700'
                }`}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Donor Info */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Informasi Donatur</Text>
          <View className="space-y-4">
            <Input
              label="Nama Lengkap"
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap"
              icon="person"
            />
            <Input
              label="Nomor Telepon (WhatsApp)"
              value={phone}
              onChangeText={setPhone}
              placeholder="081234567890"
              icon="phone"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Location */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Lokasi Penjemputan</Text>
          <View className="bg-gray-100 rounded-xl h-40 items-center justify-center mb-4">
            <MaterialIcons name="map" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">Peta akan ditampilkan di sini</Text>
          </View>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Masukkan alamat lengkap"
            icon="location-on"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity className="flex-row items-center mt-3 py-2">
            <MaterialIcons name="my-location" size={20} color="#10B981" />
            <Text className="ml-2 text-primary-600 font-medium">Gunakan Lokasi Saat Ini</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Jadwal Penjemputan (Opsional)</Text>
          
          <TouchableOpacity
            className="flex-row items-center border border-gray-300 rounded-xl px-4 py-4 mb-4"
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={24} color="#6B7280" />
            <Text className="flex-1 ml-3 text-gray-900">
              {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <Text className="text-sm text-gray-600 mb-3">Slot Waktu</Text>
          <View className="flex-row">
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                className={`flex-1 py-3 px-2 rounded-xl border-2 mr-2 ${
                  selectedSlot === slot.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setSelectedSlot(slot.id)}
              >
                <Text className={`text-center text-sm font-medium ${
                  selectedSlot === slot.id ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 rounded-xl p-4 mb-6">
          <View className="flex-row items-start">
            <MaterialIcons name="verified" size={20} color="#3B82F6" />
            <Text className="flex-1 ml-2 text-blue-800 text-sm">
              Layanan penjemputan resmi dari Clicky Foundation. Aman dan Terpercaya.
            </Text>
          </View>
        </View>

        <Button
          title="Ajukan Penjemputan"
          onPress={() => {
            // Submit pickup request
            router.push('/(tabs)');
          }}
          disabled={!name || !phone || !address}
          className="mb-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
