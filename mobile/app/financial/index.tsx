import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CheckCircle2, CircleDollarSign, Clock3, Wallet, XCircle } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import {
  useFinancialBalances,
  useFinancialCategories,
  useFinancialTransactions,
  useCreateFinancialTransaction,
  useReviewFinancialTransaction,
} from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

const FILTER_TABS = [
  { key: 'transactions', label: 'Transaksi' },
  { key: 'balance', label: 'Saldo Terkini' },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]['key'];
type TransactionType = 'request_fund' | 'income_report';

export default function FinancialScreen() {
  const user = useAuthStore((state) => state.user);
  const isManager = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');
  const isAdmin = ['admin', 'superadmin'].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<FilterTab>('transactions');
  const [transactionType, setTransactionType] = useState<TransactionType>('request_fund');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');

  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useFinancialCategories();
  const { data: balances, isLoading: balancesLoading } = useFinancialBalances();
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useFinancialTransactions({
    limit: 40,
  });

  const createTransaction = useCreateFinancialTransaction();
  const reviewTransaction = useReviewFinancialTransaction();

  const transactions = transactionsData?.transactions || [];

  const formatCurrency = (value: number | string) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numeric);
  };

  const formatThousands = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) return '';
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const submitDisabled = createTransaction.isPending || !selectedCategory || Number(amountInput || 0) <= 0;

  const handleCreateTransaction = async () => {
    const amount = Number(amountInput || 0);
    if (!selectedCategory || amount <= 0) {
      Alert.alert('Validasi', 'Kategori dan nominal wajib diisi.');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        category_id: selectedCategory,
        transaction_type: transactionType,
        amount,
        description: description.trim() || undefined,
      });
      setAmountInput('');
      setDescription('');
      await refetchTransactions();
      await refetchCategories();
      Alert.alert('Berhasil', transactionType === 'request_fund'
        ? 'Request dana berhasil dikirim.'
        : 'Pemasukan berhasil dilaporkan.');
    } catch (error: any) {
      Alert.alert('Gagal', error?.response?.data?.detail || 'Tidak dapat menyimpan transaksi.');
    }
  };

  const pendingTransactions = useMemo(
    () => transactions.filter((item: any) => item.status === 'pending'),
    [transactions]
  );

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await reviewTransaction.mutateAsync({ id, status });
      await refetchTransactions();
      Alert.alert('Berhasil', status === 'approved' ? 'Transaksi disetujui.' : 'Transaksi ditolak.');
    } catch (error: any) {
      Alert.alert('Gagal', error?.response?.data?.detail || 'Tidak dapat memproses transaksi.');
    }
  };

  if (!isManager) {
    return (
      <MainThemeLayout title="Keuangan" subtitle="Akses terbatas" showBackButton>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Menu keuangan hanya untuk admin dan pengurus.</Text>
        </View>
      </MainThemeLayout>
    );
  }

  return (
    <MainThemeLayout title="Keuangan" subtitle="Transaksi, debit/kredit, dan saldo kategori" showBackButton>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Wallet size={16} color={colors.primary[700]} />
              <Text style={styles.summaryLabel}>Saldo Saat Ini</Text>
              <Text style={styles.summaryValue}>{formatCurrency(balances?.current_balance || 0)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <CircleDollarSign size={16} color={colors.success[700]} />
              <Text style={styles.summaryLabel}>Total Kredit</Text>
              <Text style={[styles.summaryValue, { color: colors.success[700] }]}>{formatCurrency(balances?.total_credit || 0)}</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            {FILTER_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === 'transactions' ? (
            <>
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Buat Transaksi Baru</Text>

                <View style={styles.typeSwitchRow}>
                  <TouchableOpacity
                    style={[styles.typeButton, transactionType === 'request_fund' && styles.typeButtonActive]}
                    onPress={() => setTransactionType('request_fund')}
                  >
                    <Text style={[styles.typeButtonText, transactionType === 'request_fund' && styles.typeButtonTextActive]}>
                      Request Dana
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, transactionType === 'income_report' && styles.typeButtonActive]}
                    onPress={() => setTransactionType('income_report')}
                  >
                    <Text style={[styles.typeButtonText, transactionType === 'income_report' && styles.typeButtonTextActive]}>
                      Lapor Pemasukan
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Kategori</Text>
                <View style={styles.categoryWrap}>
                  {categoriesLoading ? (
                    <ActivityIndicator size="small" color={colors.primary[600]} />
                  ) : (
                    categories.map((item: any) => {
                      const active = selectedCategory === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.categoryChip, active && styles.categoryChipActive]}
                          onPress={() => setSelectedCategory(item.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>

                <Text style={styles.label}>Nominal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 1.000.000"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="number-pad"
                  value={formatThousands(amountInput)}
                  onChangeText={(value) => setAmountInput(value.replace(/\D/g, ''))}
                />

                <Text style={styles.label}>Catatan (opsional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tuliskan detail transaksi"
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                <TouchableOpacity
                  style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
                  onPress={handleCreateTransaction}
                  disabled={submitDisabled}
                  activeOpacity={0.85}
                >
                  {createTransaction.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>Simpan Transaksi</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
              {transactionsLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton height={112} borderRadius={14} />
                  <Skeleton height={112} borderRadius={14} />
                </View>
              ) : transactions.length === 0 ? (
                <Text style={styles.emptyText}>Belum ada transaksi.</Text>
              ) : (
                transactions.map((item: any) => {
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const statusColor = isApproved
                    ? colors.success[700]
                    : isPending
                    ? colors.warning[700]
                    : colors.error[700];

                  return (
                    <View key={item.id} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionCategory}>{item.category_name}</Text>
                        <Text style={[styles.transactionStatus, { color: statusColor }]}>{item.status}</Text>
                      </View>
                      <Text style={[styles.transactionAmount, { color: item.entry_side === 'credit' ? colors.success[700] : colors.error[700] }]}>
                        {item.entry_side === 'credit' ? '+' : '-'} {formatCurrency(item.amount)}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {item.transaction_type === 'request_fund' ? 'Request Dana' : 'Lapor Pemasukan'} • {item.requester_name}
                      </Text>
                      {!!item.description && <Text style={styles.transactionDesc}>{item.description}</Text>}

                      {isAdmin && isPending ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReview(item.id, 'rejected')}
                            disabled={reviewTransaction.isPending}
                          >
                            <XCircle size={14} color={colors.error[700]} />
                            <Text style={styles.rejectText}>Tolak</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleReview(item.id, 'approved')}
                            disabled={reviewTransaction.isPending}
                          >
                            <CheckCircle2 size={14} color={colors.success[700]} />
                            <Text style={styles.approveText}>Setujui</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}

              {isAdmin && pendingTransactions.length > 0 && (
                <View style={styles.infoCard}>
                  <Clock3 size={16} color={colors.warning[700]} />
                  <Text style={styles.infoText}>{pendingTransactions.length} request menunggu persetujuan admin.</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Saldo per Kategori</Text>
              {balancesLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton height={92} borderRadius={14} />
                  <Skeleton height={92} borderRadius={14} />
                </View>
              ) : (
                <View style={styles.balanceList}>
                  {(balances?.by_category || []).map((item: any) => (
                    <View key={item.category_id} style={styles.balanceCard}>
                      <Text style={styles.balanceCategory}>{item.category_name}</Text>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceMeta}>Kredit {formatCurrency(item.total_credit)}</Text>
                        <Text style={styles.balanceMeta}>Debet {formatCurrency(item.total_debit)}</Text>
                      </View>
                      <Text style={[styles.balanceValue, { color: Number(item.balance) >= 0 ? colors.success[700] : colors.error[700] }]}>
                        Saldo {formatCurrency(item.balance)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: colors.primary[700],
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
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
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gray[900],
  },
  typeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  typeButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[600],
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  categoryChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[600],
  },
  categoryTextActive: {
    color: colors.white,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.gray[800],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 78,
    height: 78,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gray[900],
    marginTop: 4,
  },
  transactionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  transactionMeta: {
    fontSize: 11,
    color: colors.gray[500],
  },
  transactionDesc: {
    fontSize: 12,
    color: colors.gray[700],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  approveButton: {
    borderColor: colors.success[200],
    backgroundColor: colors.success[50],
  },
  rejectButton: {
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  approveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success[700],
  },
  rejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error[700],
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning[100],
    backgroundColor: colors.warning[50],
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.gray[700],
    flex: 1,
  },
  balanceList: {
    gap: 10,
  },
  balanceCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
    gap: 6,
  },
  balanceCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceMeta: {
    fontSize: 12,
    color: colors.gray[500],
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray[500],
    marginTop: 24,
    fontSize: 13,
  },
});
