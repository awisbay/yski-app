import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, CheckCircle2 } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Masukkan email untuk menerima instruksi reset</Text>
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
          {isSubmitted ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={46} color={colors.success[500]} />
              <Text style={styles.successTitle}>Instruksi dikirim</Text>
              <Text style={styles.successText}>
                Jika email terdaftar, instruksi reset password akan dikirimkan ke email Anda.
              </Text>
              <Button title="Kembali ke Login" onPress={() => router.replace('/auth/login')} />
            </View>
          ) : (
            <>
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

              <Button title="Kirim Instruksi Reset" onPress={handleSubmit(onSubmit)} />
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
});
