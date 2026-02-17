import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { ScreenWrapper } from '@/components/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useAuth } from '@/hooks';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      router.replace('/(tabs)');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <ScreenWrapper scrollable={false}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Buat Akun</Text>
            <Text style={styles.subtitle}>
              Daftar untuk mulai menggunakan aplikasi
            </Text>
          </View>

          {/* Register Form */}
          <Card style={styles.formCard}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  value={value}
                  onChangeText={onChange}
                  leftIcon={<User size={20} color={colors.gray[400]} />}
                  error={errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="nama@email.com"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={20} color={colors.gray[400]} />}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nomor Telepon"
                  placeholder="08xxxxxxxxxx"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  leftIcon={<Phone size={20} color={colors.gray[400]} />}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Minimal 6 karakter"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  leftIcon={<Lock size={20} color={colors.gray[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color={colors.gray[400]} />
                      ) : (
                        <Eye size={20} color={colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                  }
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Konfirmasi Password"
                  placeholder="Ulangi password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                  leftIcon={<Lock size={20} color={colors.gray[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={colors.gray[400]} />
                      ) : (
                        <Eye size={20} color={colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                  }
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              title="Daftar"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              rightIcon={<ArrowRight size={20} color={colors.white} />}
              style={styles.registerButton}
            />
          </Card>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Sudah punya akun?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...typography.h2,
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body1,
    color: colors.gray[500],
  },
  formCard: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    ...typography.body2,
    color: colors.error[600],
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  loginText: {
    ...typography.body2,
    color: colors.gray[500],
  },
  loginLink: {
    ...typography.body2,
    color: colors.primary[600],
    fontWeight: '600',
  },
});
