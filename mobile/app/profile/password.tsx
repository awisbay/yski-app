import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function ProfilePasswordScreen() {
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validasi', 'Semua field password wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validasi', 'Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validasi', 'Konfirmasi password tidak sama.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      await logout();
      Alert.alert('Berhasil', 'Password berhasil diubah. Silakan login ulang.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Gagal', error?.response?.data?.detail || 'Tidak dapat mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainThemeLayout title="Ubah Password" subtitle="Jaga keamanan akun Anda" showBackButton>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <PasswordField
              label="Password Saat Ini"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              onToggle={() => setShowCurrent((prev) => !prev)}
            />
            <PasswordField
              label="Password Baru"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              onToggle={() => setShowNew((prev) => !prev)}
            />
            <PasswordField
              label="Konfirmasi Password Baru"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              onToggle={() => setShowConfirm((prev) => !prev)}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Setelah password diubah, Anda akan diminta login ulang.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.submitText}>Simpan Password Baru</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry: boolean;
  onToggle: () => void;
};

function PasswordField({ label, value, onChangeText, secureTextEntry, onToggle }: PasswordFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Lock size={18} color={value ? colors.primary[600] : colors.gray[400]} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={colors.gray[400]}
          secureTextEntry={secureTextEntry}
        />
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {secureTextEntry ? <Eye size={18} color={colors.gray[400]} /> : <EyeOff size={18} color={colors.gray[400]} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 14,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 6,
  },
  inputRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.gray[900],
    fontSize: 14,
  },
  infoBox: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    padding: 10,
  },
  infoText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
