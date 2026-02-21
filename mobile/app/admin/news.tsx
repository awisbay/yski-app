import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Camera, Save, Plus, Sparkles, Newspaper } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import {
  useNews,
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

export default function AdminNewsScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');

  const [tab, setTab] = useState<'active' | 'create'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [briefPrompt, setBriefPrompt] = useState('');
  const [category, setCategory] = useState<(typeof NEWS_CATEGORIES)[number]['value']>('general');
  const [pickedBanner, setPickedBanner] = useState<PickedPhoto | null>(null);

  const { data: news, isLoading, refetch } = useNews({ limit: 100, is_published: undefined });
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const uploadBanner = useUploadNewsBanner();
  const generateContent = useGenerateNewsContent();

  const sortedNews = useMemo(
    () =>
      [...(news || [])].sort((a: any, b: any) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    [news]
  );

  const isSubmitting = createNews.isPending || updateNews.isPending || uploadBanner.isPending;

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Berita" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola berita.</Text></View>
      </MainThemeLayout>
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setBriefPrompt('');
    setCategory('general');
    setPickedBanner(null);
  };

  const fillFormForEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setExcerpt(item.excerpt || '');
    setContent(item.content || '');
    setBriefPrompt('');
    setCategory(item.category || 'general');
    setPickedBanner(item.thumbnailUrl ? {
      uri: item.thumbnailUrl,
      mimeType: 'image/jpeg',
      fileName: 'existing-news-banner.jpg',
    } : null);
    setTab('create');
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Akses kamera dibutuhkan untuk mengambil banner berita.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPickedBanner({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `news-${Date.now()}.jpg`,
      });
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Akses galeri dibutuhkan untuk memilih banner berita.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPickedBanner({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `news-${Date.now()}.jpg`,
      });
    }
  };

  const handleGenerateAI = async () => {
    if (!title.trim() || !briefPrompt.trim()) {
      Alert.alert('Validasi', 'Isi judul dan kata kunci singkat dulu sebelum generate.');
      return;
    }
    try {
      const result = await generateContent.mutateAsync({
        title: title.trim(),
        brief: briefPrompt.trim(),
      });
      setContent(result.generated_content || '');
      if (!excerpt.trim()) {
        setExcerpt(result.suggested_excerpt || '');
      }
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
        formData.append('file', {
          uri: pickedBanner.uri,
          type: pickedBanner.mimeType,
          name: pickedBanner.fileName,
        } as any);
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
        Alert.alert('Berhasil', 'Berita berhasil diperbarui.');
      } else {
        await createNews.mutateAsync(payload);
        Alert.alert('Berhasil', 'Berita baru berhasil dibuat.');
      }

      resetForm();
      await refetch();
      setTab('active');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menyimpan berita.');
    }
  };

  const renderNews = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => fillFormForEdit(item)}
      activeOpacity={0.85}
    >
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbFallback}><Newspaper size={24} color={colors.primary[600]} /></View>
        )}
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.newsMeta} numberOfLines={1}>
        {(item.category || 'general').replace('_', '-')} · {new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Manajemen Berita"
      subtitle="Kelola konten berita untuk semua user"
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.contentWrap}>
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]} onPress={() => setTab('active')}>
              <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Berita Aktif</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]} onPress={() => setTab('create')}>
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>{editingId ? 'Update Berita' : 'Buat Berita'}</Text>
            </TouchableOpacity>
          </View>

          {tab === 'active' ? (
            isLoading ? (
              <View style={{ gap: 10 }}>
                <Skeleton height={140} borderRadius={14} />
                <Skeleton height={140} borderRadius={14} />
              </View>
            ) : (
              <FlatList
                data={sortedNews}
                keyExtractor={(item) => item.id}
                renderItem={renderNews}
                numColumns={2}
                columnWrapperStyle={styles.columnWrap}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>Belum ada berita.</Text>}
              />
            )
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
                  <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera}><Camera size={15} color={colors.primary[700]} /><Text style={styles.photoBtnText}>Kamera</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}><ImageIcon size={15} color={colors.primary[700]} /><Text style={styles.photoBtnText}>Galeri</Text></TouchableOpacity>
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

              {editingId ? (
                <TouchableOpacity style={styles.cancelEditBtn} onPress={resetForm}>
                  <Text style={styles.cancelEditText}>Batal Edit</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[500],
  },
  tabTextActive: {
    color: colors.primary[700],
  },
  columnWrap: {
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingBottom: 100,
    gap: 10,
  },
  newsCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    padding: 10,
  },
  thumbWrap: {
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    marginBottom: 8,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 17,
    minHeight: 34,
  },
  newsMeta: {
    marginTop: 4,
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.gray[500],
  },
  formContent: {
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
  cancelEditBtn: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[600],
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 18,
  },
});
