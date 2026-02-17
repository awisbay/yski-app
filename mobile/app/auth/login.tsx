import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { ScreenWrapper } from '@/components/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useAuth } from '@/hooks';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({ email: data.email, password: data.password });
      router.replace('/(tabs)');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>YSKI</Text>
          </View>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>
            Masuk ke akun Anda untuk melanjutkan
          </Text>
        </View>

        {/* Login Form */}
        <Card style={styles.formCard}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="Masukkan password"
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Lupa password?</Text>
          </TouchableOpacity>

          <Button
            title="Masuk"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            rightIcon={<ArrowRight size={20} color={colors.white} />}
            style={styles.loginButton}
          />
        </Card>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Belum punya akun?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  title: {
    ...typography.h2,
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body1,
    color: colors.gray[500],
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    ...typography.body2,
    color: colors.primary[600],
  },
  loginButton: {
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    ...typography.body2,
    color: colors.gray[500],
  },
  registerLink: {
    ...typography.body2,
    color: colors.primary[600],
    fontWeight: '600',
  },
});
