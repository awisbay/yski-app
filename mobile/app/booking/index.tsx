import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Input } from '@/components';

const TIME_SLOTS = [
  { time: '08:00', label: '08:00 - 10:00' },
  { time: '10:00', label: '10:00 - 12:00' },
  { time: '13:00', label: '13:00 - 15:00' },
  { time: '15:00', label: '15:00 - 17:00' },
];

export default function BookingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupNotes: '',
    dropoffAddress: '',
    dropoffNotes: '',
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center py-4">
      <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 1 ? 'bg-primary-500' : 'bg-gray-300'}`}>
        <Text className="text-white font-semibold">1</Text>
      </View>
      <View className={`w-12 h-1 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-300'}`} />
      <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 2 ? 'bg-primary-500' : 'bg-gray-300'}`}>
        <Text className="text-white font-semibold">2</Text>
      </View>
      <View className={`w-12 h-1 ${step >= 3 ? 'bg-primary-500' : 'bg-gray-300'}`} />
      <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 3 ? 'bg-primary-500' : 'bg-gray-300'}`}>
        <Text className="text-white font-semibold">3</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View className="px-6">
      <Text className="text-xl font-bold text-gray-900 mb-2">Pilih Tanggal & Waktu</Text>
      <Text className="text-gray-500 mb-6">Kapan Anda ingin pindahan?</Text>

      {/* Date Picker */}
      <TouchableOpacity
        className="flex-row items-center border border-gray-300 rounded-xl px-4 py-4 mb-6"
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
          minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
          onChange={handleDateChange}
        />
      )}

      {/* Time Slots */}
      <Text className="text-sm font-medium text-gray-700 mb-3">Pilih Jam</Text>
      <View className="flex-row flex-wrap">
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot.time}
            className={`w-[48%] mb-3 p-4 rounded-xl border-2 ${
              selectedSlot === slot.time
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white'
            }`}
            onPress={() => setSelectedSlot(slot.time)}
          >
            <Text className={`text-center font-medium ${
              selectedSlot === slot.time ? 'text-primary-700' : 'text-gray-700'
            }`}>
              {slot.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Lanjutkan"
        onPress={() => setStep(2)}
        disabled={!selectedSlot}
        className="mt-6"
      />
    </View>
  );

  const renderStep2 = () => (
    <ScrollView className="px-6">
      <Text className="text-xl font-bold text-gray-900 mb-2">Alamat Pindahan</Text>
      <Text className="text-gray-500 mb-6">Masukkan alamat penjemputan dan tujuan</Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Alamat Penjemputan</Text>
        <Input
          value={formData.pickupAddress}
          onChangeText={(text) => setFormData({ ...formData, pickupAddress: text })}
          placeholder="Masukkan alamat lengkap"
          icon="location-on"
          multiline
          numberOfLines={3}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Catatan Penjemputan (Opsional)</Text>
        <Input
          value={formData.pickupNotes}
          onChangeText={(text) => setFormData({ ...formData, pickupNotes: text })}
          placeholder="Patokan, lantai, dll"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Alamat Tujuan</Text>
        <Input
          value={formData.dropoffAddress}
          onChangeText={(text) => setFormData({ ...formData, dropoffAddress: text })}
          placeholder="Masukkan alamat lengkap"
          icon="location-on"
          multiline
          numberOfLines={3}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Catatan Tujuan (Opsional)</Text>
        <Input
          value={formData.dropoffNotes}
          onChangeText={(text) => setFormData({ ...formData, dropoffNotes: text })}
          placeholder="Patokan, lantai, dll"
        />
      </View>

      <View className="flex-row space-x-3 mt-6">
        <Button
          title="Kembali"
          variant="outline"
          onPress={() => setStep(1)}
          className="flex-1"
        />
        <Button
          title="Lanjutkan"
          onPress={() => setStep(3)}
          disabled={!formData.pickupAddress || !formData.dropoffAddress}
          className="flex-1"
        />
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="px-6">
      <Text className="text-xl font-bold text-gray-900 mb-2">Konfirmasi</Text>
      <Text className="text-gray-500 mb-6">Periksa kembali detail pemesanan Anda</Text>

      <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <View className="flex-row items-center mb-4">
          <MaterialIcons name="calendar-today" size={24} color="#10B981" />
          <View className="ml-3">
            <Text className="text-gray-500 text-sm">Tanggal & Waktu</Text>
            <Text className="text-gray-900 font-medium">
              {date.toLocaleDateString('id-ID')} • {selectedSlot}
            </Text>
          </View>
        </View>

        <View className="h-px bg-gray-200 my-4" />

        <View className="mb-4">
          <View className="flex-row items-start">
            <MaterialIcons name="location-on" size={24} color="#10B981" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Penjemputan</Text>
              <Text className="text-gray-900">{formData.pickupAddress}</Text>
              {formData.pickupNotes && (
                <Text className="text-gray-500 text-sm mt-1">Catatan: {formData.pickupNotes}</Text>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-center my-2">
          <MaterialIcons name="arrow-downward" size={24} color="#6B7280" />
        </View>

        <View className="flex-row items-start">
          <MaterialIcons name="location-on" size={24} color="#EF4444" />
          <View className="ml-3 flex-1">
            <Text className="text-gray-500 text-sm">Tujuan</Text>
            <Text className="text-gray-900">{formData.dropoffAddress}</Text>
            {formData.dropoffNotes && (
              <Text className="text-gray-500 text-sm mt-1">Catatan: {formData.dropoffNotes}</Text>
            )}
          </View>
        </View>
      </View>

      <View className="bg-yellow-50 rounded-xl p-4 mb-6">
        <View className="flex-row items-start">
          <MaterialIcons name="info" size={20} color="#F59E0B" />
          <Text className="flex-1 ml-2 text-yellow-800 text-sm">
            Dengan menekan "Konfirmasi Pesanan", Anda menyetujui syarat dan ketentuan layanan kami.
          </Text>
        </View>
      </View>

      <View className="flex-row space-x-3">
        <Button
          title="Kembali"
          variant="outline"
          onPress={() => setStep(2)}
          className="flex-1"
        />
        <Button
          title="Konfirmasi Pesanan"
          onPress={() => {
            // Submit booking
            router.push('/(tabs)');
          }}
          className="flex-1"
        />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900 mr-6">
          Booking Pindahan
        </Text>
      </View>

      {renderStepIndicator()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </SafeAreaView>
  );
}
