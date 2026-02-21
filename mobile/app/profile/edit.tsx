import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Info } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { isProfileComplete } from '@/utils/profile';

export default function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [showKunyahHint, setShowKunyahHint] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [kunyahName, setKunyahName] = useState(user?.kunyah_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [province, setProvince] = useState(user?.province || '');

  const [interestedDonatur, setInterestedDonatur] = useState(!!user?.interested_as_donatur);
  const [interestedRelawan, setInterestedRelawan] = useState(!!user?.interested_as_relawan);
  const [wantsBeneficiary, setWantsBeneficiary] = useState(!!user?.wants_beneficiary_survey);

  const canSave = useMemo(
    () =>
      fullName.trim().length > 0 &&
      kunyahName.trim().length > 0 &&
      email.trim().length > 0 &&
      occupation.trim().length > 0 &&
      phone.trim().length > 0 &&
      address.trim().length > 0 &&
      city.trim().length > 0 &&
      province.trim().length > 0,
    [fullName, kunyahName, email, occupation, phone, address, city, province]
  );

  const onSave = async () => {
    if (!canSave) {
      Alert.alert('Validasi', 'Mohon lengkapi semua data profil wajib terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        kunyah_name: kunyahName.trim(),
        email: email.trim().toLowerCase(),
        occupation: occupation.trim(),
        phone: phone.replace(/[^0-9+]/g, ''),
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        interested_as_donatur: interestedDonatur,
        interested_as_relawan: interestedRelawan,
        wants_beneficiary_survey: wantsBeneficiary,
      };

      const res = await usersApi.updateMe(payload);
      setUser(res.data);
      if (isProfileComplete(res.data)) {
        Alert.alert('Berhasil', 'Profil berhasil diperbarui.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Profil belum lengkap', 'Silakan lengkapi semua data wajib.');
      }
    } catch (error: any) {
      Alert.alert('Gagal', error?.response?.data?.detail || 'Tidak dapat menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainThemeLayout title="Edit Profil" subtitle="Lengkapi data akun Anda" showBackButton>
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
          <View style={styles.formCard}>
            <Field label="Nama" value={fullName} onChangeText={setFullName} />

            <View>
              <View style={styles.inlineLabelRow}>
                <Text style={styles.label}>Nama Kunyah</Text>
                <TouchableOpacity onPress={() => setShowKunyahHint((prev) => !prev)} activeOpacity={0.8}>
                  <Info size={14} color={colors.primary[600]} />
                </TouchableOpacity>
              </View>
              {showKunyahHint ? <Text style={styles.hint}>Contoh: Abu Hamzah / Ummu Khadijah</Text> : null}
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama kunyah"
                placeholderTextColor={colors.gray[400]}
                value={kunyahName}
                onChangeText={setKunyahName}
              />
            </View>

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="Pekerjaan" value={occupation} onChangeText={setOccupation} />
            <Field
              label="No. Handphone"
              value={phone}
              onChangeText={(txt) => setPhone(txt.replace(/[^0-9+]/g, ''))}
              keyboardType="phone-pad"
            />
            <Field
              label="Alamat"
              value={address}
              onChangeText={setAddress}
              multiline
              inputStyle={styles.textArea}
            />
            <Field label="Kota" value={city} onChangeText={setCity} />
            <Field label="Provinsi" value={province} onChangeText={setProvince} />

            <View style={styles.switchGroup}>
              <SwitchRow
                label="Berminat sebagai donatur"
                value={interestedDonatur}
                onValueChange={setInterestedDonatur}
              />
              <SwitchRow
                label="Berminat sebagai relawan"
                value={interestedRelawan}
                onValueChange={setInterestedRelawan}
              />
              <SwitchRow
                label="Ingin menjadi penerima manfaat dan bersedia disurvey (sodaqoh/zakat)"
                value={wantsBeneficiary}
                onValueChange={setWantsBeneficiary}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Simpan Profil</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  inputStyle?: any;
};

function Field({ label, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences', multiline = false, inputStyle }: FieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea, inputStyle]}
        placeholder={`Masukkan ${label.toLowerCase()}`}
        placeholderTextColor={colors.gray[400]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
    </View>
  );
}

type SwitchRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SwitchRow({ label, value, onValueChange }: SwitchRowProps) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
        thumbColor={value ? colors.primary[600] : colors.gray[500]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 14,
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: colors.gray[700],
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 12,
    color: colors.gray[900],
    fontSize: 14,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 82,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: colors.primary[700],
    marginBottom: 8,
  },
  switchGroup: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
