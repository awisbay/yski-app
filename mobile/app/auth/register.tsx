import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();

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
        full_name: data.fullName,
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
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Brand Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.logoCircle}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.orgLabel}>YAYASAN SAHABAT KHAIRAT</Text>
        <Text style={styles.welcomeTitle}>Buat Akun</Text>
        <Text style={styles.welcomeSubtitle}>
          Daftar untuk mulai menggunakan aplikasi
        </Text>
      </View>

      {/* Form Panel */}
      <KeyboardAvoidingView
        style={styles.formPanel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formHeading}>Data Diri</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Full Name */}
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Nama Lengkap"
                autoCapitalize="words"
                autoCorrect={false}
                leftIcon={<User size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                error={errors.fullName?.message}
              />
            )}
          />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Mail size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                error={errors.email?.message}
              />
            )}
          />

          {/* Phone */}
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Nomor Telepon"
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                error={errors.phone?.message}
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Password (min. 6 karakter)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                leftIcon={<Lock size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                rightIcon={(
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword
                      ? <EyeOff size={20} color={colors.gray[400]} />
                      : <Eye size={20} color={colors.gray[400]} />}
                  </TouchableOpacity>
                )}
                error={errors.password?.message}
              />
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Konfirmasi Password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                leftIcon={<Lock size={20} color={value ? colors.primary[500] : colors.gray[400]} />}
                rightIcon={(
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showConfirmPassword
                      ? <EyeOff size={20} color={colors.gray[400]} />
                      : <Eye size={20} color={colors.gray[400]} />}
                  </TouchableOpacity>
                )}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.registerButtonText}>DAFTAR</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Sudah punya akun?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}> Masuk Sekarang</Text>
            </TouchableOpacity>
          </View>
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

  // Brand header
  header: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  orgLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[300],
    letterSpacing: 2,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.primary[200],
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form panel
  formPanel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  formContent: {
    padding: 28,
  },
  formHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 28,
  },

  // Error banner
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

  // Register button
  registerButton: {
    backgroundColor: colors.primary[600],
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    fontSize: 13,
    color: colors.gray[400],
  },

  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
