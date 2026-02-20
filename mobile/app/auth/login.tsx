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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();

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
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Brand Header */}
      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={styles.logoCircle}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.orgLabel}>YAYASAN SAHABAT KHAIRAT</Text>
        <Text style={styles.welcomeTitle}>Selamat Datang</Text>
        <Text style={styles.welcomeSubtitle}>
          Masuk ke akun Anda untuk melanjutkan
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
          <Text style={styles.formHeading}>Masuk Akun</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email field */}
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

          {/* Password field */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Password"
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

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotPasswordText}>Lupa password?</Text>
          </TouchableOpacity>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.signInButtonText}>MASUK</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Belum punya akun?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}> Daftar Sekarang</Text>
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
    paddingBottom: 48,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  logoImage: {
    width: 88,
    height: 88,
  },
  orgLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[300],
    letterSpacing: 2,
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
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

  // Forgot password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 28,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[600],
  },

  // Sign In button
  signInButton: {
    backgroundColor: colors.primary[600],
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
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

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
