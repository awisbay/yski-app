import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks';
import { colors } from '@/constants/colors';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = String(params.token || '');
  const [isDone, setIsDone] = useState(false);
  const { resetPassword, isLoading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    await resetPassword({ token, newPassword: data.password });
    setIsDone(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <Text style={styles.title}>Password Baru</Text>
        <Text style={styles.subtitle}>Masukkan password baru untuk akun Anda</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.formPanel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!token ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>Token reset tidak ditemukan.</Text>
            </View>
          ) : null}

          {isDone ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={46} color={colors.success[500]} />
              <Text style={styles.successTitle}>Password berhasil diubah</Text>
              <Text style={styles.successText}>
                Silakan masuk kembali menggunakan password baru Anda.
              </Text>
              <Button title="Ke Halaman Login" onPress={() => router.replace('/auth/login')} />
            </View>
          ) : (
            <>
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Password baru"
                    secureTextEntry
                    autoCapitalize="none"
                    leftIcon={<Lock size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Konfirmasi password baru"
                    secureTextEntry
                    autoCapitalize="none"
                    leftIcon={<Lock size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              <Button
                title={isLoading ? 'Memproses...' : 'Simpan Password Baru'}
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                disabled={!token}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[700],
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary[200],
    lineHeight: 20,
  },
  formPanel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formContent: {
    padding: 28,
  },
  successBox: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  successText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 6,
  },
  errorBanner: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 14,
    color: colors.error[600],
    textAlign: 'center',
  },
});
