import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Camera, Save, Plus, Sparkles } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import {
  useNewsDetail,
  useCreateNews,
  useUpdateNews,
  useUploadNewsBanner,
  useGenerateNewsContent,
} from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

const NEWS_CATEGORIES = [
  { value: 'general', label: 'Umum' },
  { value: 'kesehatan', label: 'Kesehatan' },
  { value: 'bencana', label: 'Bencana' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'lain_lain', label: 'Lain-lain' },
] as const;

export default function AdminNewsFormScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id || null;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [briefPrompt, setBriefPrompt] = useState('');
  const [category, setCategory] = useState<(typeof NEWS_CATEGORIES)[number]['value']>('general');
  const [pickedBanner, setPickedBanner] = useState<PickedPhoto | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: newsItem, isLoading: isLoadingDetail } = useNewsDetail(editingId || '');
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const uploadBanner = useUploadNewsBanner();
  const generateContent = useGenerateNewsContent();

  useEffect(() => {
    if (editingId && newsItem && !initialized) {
      setTitle(newsItem.title || '');
      setExcerpt(newsItem.excerpt || '');
      setContent(newsItem.content || '');
      setCategory(newsItem.category || 'general');
      setPickedBanner(newsItem.thumbnailUrl ? {
        uri: newsItem.thumbnailUrl,
        mimeType: 'image/jpeg',
        fileName: 'existing-news-banner.jpg',
      } : null);
      setInitialized(true);
    }
  }, [editingId, newsItem, initialized]);

  const isSubmitting = createNews.isPending || updateNews.isPending || uploadBanner.isPending;

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Berita" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/admin/news')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola berita.</Text></View>
      </MainThemeLayout>
    );
  }

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Akses kamera dibutuhkan untuk mengambil banner berita.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPickedBanner({ uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', fileName: asset.fileName || `news-${Date.now()}.jpg` });
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Akses galeri dibutuhkan untuk memilih banner berita.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPickedBanner({ uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', fileName: asset.fileName || `news-${Date.now()}.jpg` });
    }
  };

  const handleGenerateAI = async () => {
    if (!title.trim() || !briefPrompt.trim()) {
      Alert.alert('Validasi', 'Isi judul dan kata kunci singkat dulu sebelum generate.');
      return;
    }
    try {
      const result = await generateContent.mutateAsync({ title: title.trim(), brief: briefPrompt.trim() });
      setContent(result.generated_content || '');
      if (!excerpt.trim()) setExcerpt(result.suggested_excerpt || '');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat generate konten berita.');
    }
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validasi', 'Judul dan content wajib diisi.');
      return;
    }
    try {
      let bannerUrl: string | undefined;
      if (pickedBanner?.uri && !pickedBanner.uri.startsWith('http')) {
        const formData = new FormData();
        formData.append('file', { uri: pickedBanner.uri, type: pickedBanner.mimeType, name: pickedBanner.fileName } as any);
        const uploaded = await uploadBanner.mutateAsync(formData);
        bannerUrl = uploaded.banner_url;
      } else if (pickedBanner?.uri?.startsWith('http')) {
        bannerUrl = pickedBanner.uri;
      }

      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content: content.trim(),
        category,
        thumbnail_url: bannerUrl,
      };

      if (editingId) {
        await updateNews.mutateAsync({ id: editingId, payload });
        Alert.alert('Berhasil', 'Berita berhasil diperbarui.', [{ text: 'OK', onPress: () => router.replace('/admin/news') }]);
      } else {
        await createNews.mutateAsync(payload);
        Alert.alert('Berhasil', 'Berita baru berhasil dibuat.', [{ text: 'OK', onPress: () => router.replace('/admin/news') }]);
      }
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menyimpan berita.');
    }
  };

  return (
    <MainThemeLayout
      title={editingId ? 'Edit Berita' : 'Buat Berita'}
      subtitle={editingId ? 'Perbarui informasi berita' : 'Tambah berita baru'}
      showBackButton
      onBackPress={() => router.replace('/admin/news')}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {editingId && isLoadingDetail && !initialized ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.photoPanel}>
              {pickedBanner?.uri ? (
                <Image source={{ uri: pickedBanner.uri }} style={styles.preview} />
              ) : (
                <View style={styles.previewPlaceholder}><ImageIcon size={24} color={colors.gray[400]} /></View>
              )}
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera}>
                  <Camera size={15} color={colors.primary[700]} />
                  <Text style={styles.photoBtnText}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
                  <ImageIcon size={15} color={colors.primary[700]} />
                  <Text style={styles.photoBtnText}>Galeri</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Judul</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Masukkan judul berita"
              placeholderTextColor={colors.gray[400]}
            />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.chipsRow}>
              {NEWS_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.chip, category === c.value && styles.chipActive]}
                  onPress={() => setCategory(c.value)}
                >
                  <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Kata kunci singkat (untuk AI generate)</Text>
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={briefPrompt}
              onChangeText={setBriefPrompt}
              placeholder="Contoh: Kegiatan pembagian sembako 120 paket di Depok bersama relawan..."
              placeholderTextColor={colors.gray[400]}
              multiline
            />
            <TouchableOpacity
              style={[styles.aiBtn, generateContent.isPending && { opacity: 0.7 }]}
              onPress={handleGenerateAI}
              disabled={generateContent.isPending}
              activeOpacity={0.85}
            >
              {generateContent.isPending ? (
                <ActivityIndicator size="small" color={colors.primary[700]} />
              ) : (
                <>
                  <Sparkles size={16} color={colors.primary[700]} />
                  <Text style={styles.aiBtnText}>AI Generate Content</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Excerpt (opsional)</Text>
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="Ringkasan pendek berita..."
              placeholderTextColor={colors.gray[400]}
              multiline
            />

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Masukkan konten lengkap berita"
              placeholderTextColor={colors.gray[400]}
              multiline
            />

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={submit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  {editingId ? <Save size={16} color={colors.white} /> : <Plus size={16} color={colors.white} />}
                  <Text style={styles.submitText}>{editingId ? 'Simpan Perubahan Berita' : 'Buat Berita'}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 10,
  },
  photoPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 10,
    gap: 10,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  previewPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    height: 38,
    flex: 1,
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[700],
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.gray[700],
  },
  chipTextActive: {
    color: colors.white,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    color: colors.gray[900],
    fontSize: 14,
  },
  textAreaSmall: {
    minHeight: 78,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  aiBtn: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  aiBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary[700],
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 18,
  },
});
