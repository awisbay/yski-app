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
import { Image as ImageIcon, Camera, Save, Plus, LayoutGrid } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import {
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useUploadProgramBanner,
} from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export default function AdminProgramsScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');

  const [tab, setTab] = useState<'active' | 'create'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [pickedBanner, setPickedBanner] = useState<PickedPhoto | null>(null);

  const { data: programs, isLoading, refetch } = usePrograms({ status: 'active', limit: 100 });
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const uploadBanner = useUploadProgramBanner();

  const orderedPrograms = useMemo(
    () => [...(programs || [])].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [programs]
  );

  const isSubmitting = createProgram.isPending || updateProgram.isPending || uploadBanner.isPending;

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Program" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola program.</Text></View>
      </MainThemeLayout>
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setDisplayOrder('1');
    setPickedBanner(null);
  };

  const fillFormForEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setContent(item.description || '');
    setDisplayOrder(String(item.displayOrder || 1));
    setPickedBanner(item.thumbnailUrl ? {
      uri: item.thumbnailUrl,
      mimeType: 'image/jpeg',
      fileName: 'existing-banner.jpg',
    } : null);
    setTab('create');
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Akses kamera dibutuhkan untuk mengambil banner program.');
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
        fileName: asset.fileName || `program-${Date.now()}.jpg`,
      });
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Akses galeri dibutuhkan untuk memilih banner program.');
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
        fileName: asset.fileName || `program-${Date.now()}.jpg`,
      });
    }
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validasi', 'Judul dan content wajib diisi.');
      return;
    }

    const orderNum = Number(displayOrder || '0');
    if (!Number.isFinite(orderNum) || orderNum < 1) {
      Alert.alert('Validasi', 'Urutan program minimal 1.');
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
        description: content.trim(),
        thumbnail_url: bannerUrl,
        display_order: orderNum,
      };

      if (editingId) {
        await updateProgram.mutateAsync({ id: editingId, payload });
        Alert.alert('Berhasil', 'Program berhasil diperbarui.');
      } else {
        await createProgram.mutateAsync(payload);
        Alert.alert('Berhasil', 'Program baru berhasil dibuat.');
      }

      resetForm();
      await refetch();
      setTab('active');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menyimpan program.');
    }
  };

  const renderProgram = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.programCard}
      onPress={() => fillFormForEdit(item)}
      activeOpacity={0.85}
    >
      <View style={styles.orderTag}>
        <Text style={styles.orderTagText}>#{item.displayOrder || 0}</Text>
      </View>
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbFallback}><LayoutGrid size={24} color={colors.primary[600]} /></View>
        )}
      </View>
      <Text style={styles.programTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Manajemen Program"
      subtitle="Kelola program aktif untuk homepage"
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.content}>
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]} onPress={() => setTab('active')}>
              <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Program Aktif</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]} onPress={() => setTab('create')}>
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>{editingId ? 'Update Program' : 'Buat Program'}</Text>
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
                data={orderedPrograms}
                keyExtractor={(item) => item.id}
                renderItem={renderProgram}
                numColumns={2}
                columnWrapperStyle={styles.columnWrap}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>Belum ada program aktif.</Text>}
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
                placeholder="Masukkan judul program"
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Masukkan konten lengkap program"
                placeholderTextColor={colors.gray[400]}
                multiline
              />

              <Text style={styles.label}>Urutan tampil di main page</Text>
              <TextInput
                style={styles.input}
                value={displayOrder}
                onChangeText={(txt) => setDisplayOrder(txt.replace(/[^0-9]/g, ''))}
                placeholder="Contoh: 1"
                keyboardType="number-pad"
                placeholderTextColor={colors.gray[400]}
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
                    <Text style={styles.submitText}>{editingId ? 'Simpan Perubahan Program' : 'Buat Program'}</Text>
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
  content: {
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
  programCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    padding: 10,
    position: 'relative',
  },
  orderTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    minWidth: 28,
    height: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
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
  programTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 17,
    minHeight: 34,
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
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    color: colors.gray[900],
    fontSize: 14,
  },
  textArea: {
    minHeight: 110,
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 10,
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
