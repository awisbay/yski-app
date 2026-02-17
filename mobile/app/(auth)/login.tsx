import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6 py-12">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang
          </Text>
          <Text className="text-gray-500">
            Masuk ke akun Anda untuk melanjutkan
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
              placeholder="nama@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
              placeholder="********"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <Text className="text-error text-sm">{error}</Text>
          )}

          <TouchableOpacity
            className="w-full bg-primary-500 py-4 rounded-xl mt-6"
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Memuat...' : 'Masuk'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-500">Belum punya akun? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-primary-600 font-semibold">Daftar</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
