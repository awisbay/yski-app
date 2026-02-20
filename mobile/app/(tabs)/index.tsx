import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  TrendingUp,
  Heart,
  Users,
  Layers,
  Plus,
  Newspaper,
} from 'lucide-react-native';
import { Skeleton } from '@/components/ui';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useMyBookings, usePrograms, useNews } from '@/hooks';
import { colors } from '@/constants/colors';

const OPS_DASHBOARD_MENU = [
  { key: 'users', label: 'User', route: '/admin/users', icon: Users, color: colors.primary[600], adminOnly: true },
  { key: 'bookings', label: 'Booking', route: '/admin/bookings', icon: Calendar, color: colors.secondary[600] },
  { key: 'equipment', label: 'Peralatan', route: '/admin/equipment', icon: Layers, color: colors.success[600] },
  { key: 'donations', label: 'Donasi', route: '/admin/donations', icon: Heart, color: colors.warning[600] },
  { key: 'pickups', label: 'Pickup', route: '/admin/pickups', icon: MapPin, color: colors.info[600] },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useMyBookings();
  const { data: programs, isLoading: programsLoading } = usePrograms({ limit: 4 });
  const { data: news, isLoading: newsLoading } = useNews({ limit: 3 });

  const [refreshing, setRefreshing] = useState(false);
  const isOperationalRole = ['admin', 'pengurus', 'relawan', 'superadmin'].includes(user?.role || '');
  const isAdminRole = ['admin', 'superadmin'].includes(user?.role || '');
  const quickMenus = OPS_DASHBOARD_MENU.filter((item) => !item.adminOnly || isAdminRole);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchBookings();
    setRefreshing(false);
  };

  const activeBookings = bookings?.filter(
    (b: any) =>
      b.status === 'confirmed' ||
      b.status === 'approved' ||
      b.status === 'pending' ||
      b.status === 'in_progress'
  ) || [];
  const nextBooking = activeBookings[0];
  const featuredProgram = programs?.[0];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const pct = (a: number, b: number) => Math.min(Math.round((a / b) * 100), 100);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Green Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greetingLabel}>Selamat Datang,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.full_name || 'Pengguna'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={22} color={colors.white} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeBookings.length}</Text>
            <Text style={styles.statLabel}>Booking{'\n'}Aktif</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Total{'\n'}Donasi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Alat{'\n'}Dipinjam</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>47</Text>
            <Text style={styles.statLabel}>Program{'\n'}Aktif</Text>
          </View>
        </View>
      </View>

      {/* ── White Content Panel ── */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={[styles.panelContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
            colors={[colors.primary[600]]}
          />
        }
      >

        {/* ── Featured Campaign ── */}
        {programsLoading ? (
          <Skeleton height={160} borderRadius={20} />
        ) : featuredProgram ? (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => router.push(`/programs/${featuredProgram.id}`)}
            activeOpacity={0.9}
          >
            <View style={styles.featuredBadgeRow}>
              <View style={styles.featuredBadge}>
                <Heart size={11} color={colors.white} fill={colors.white} />
                <Text style={styles.featuredBadgeText}>Kampanye Aktif</Text>
              </View>
              <Text style={styles.featuredPct}>
                {pct(featuredProgram.collectedAmount, featuredProgram.targetAmount)}%
              </Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {featuredProgram.title}
            </Text>
            <ProgressBar
              progress={featuredProgram.collectedAmount / featuredProgram.targetAmount}
              style={styles.featuredBar}
            />
            <View style={styles.featuredFooter}>
              <Text style={styles.featuredRaised}>
                {formatCurrency(featuredProgram.collectedAmount)}
              </Text>
              <Text style={styles.featuredTarget}>
                {' '}dari {formatCurrency(featuredProgram.targetAmount)}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={styles.featuredCta}>
                <Text style={styles.featuredCtaText}>Donasi</Text>
                <ChevronRight size={14} color={colors.primary[600]} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          /* Static impact card when no programs */
          <View style={styles.impactCard}>
            <View style={styles.impactRow}>
              <View style={styles.impactItem}>
                <View style={[styles.impactIcon, { backgroundColor: colors.primary[50] }]}>
                  <Heart size={18} color={colors.primary[600]} fill={colors.primary[100]} />
                </View>
                <Text style={styles.impactValue}>Rp 124 Jt</Text>
                <Text style={styles.impactLabel}>Dana Terkumpul</Text>
              </View>
              <View style={styles.impactItem}>
                <View style={[styles.impactIcon, { backgroundColor: '#FFF1F2' }]}>
                  <Users size={18} color="#E11D48" />
                </View>
                <Text style={styles.impactValue}>1.200+</Text>
                <Text style={styles.impactLabel}>Keluarga Terbantu</Text>
              </View>
              <View style={styles.impactItem}>
                <View style={[styles.impactIcon, { backgroundColor: colors.secondary[50] }]}>
                  <Layers size={18} color={colors.secondary[600]} />
                </View>
                <Text style={styles.impactValue}>47</Text>
                <Text style={styles.impactLabel}>Program Aktif</Text>
              </View>
            </View>
          </View>
        )}

        {isOperationalRole && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Akses Cepat</Text>
            </View>
            <View style={styles.quickGrid}>
              {quickMenus.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.quickItem}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: `${item.color}18` }]}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!isOperationalRole && (
          <>
            {/* ── Booking Berikutnya ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Booking Berikutnya</Text>
              <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/booking')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
                <ChevronRight size={13} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>

            {bookingsLoading ? (
              <Skeleton height={130} borderRadius={18} />
            ) : nextBooking ? (
              <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => router.push(`/booking/${nextBooking.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.bookingAccent} />
                <View style={styles.bookingBody}>
                  <View style={styles.bookingTopRow}>
                    <Badge
                      label={
                        nextBooking.status === 'approved' ? 'disetujui' :
                        nextBooking.status === 'in_progress' ? 'berjalan' :
                        nextBooking.status
                      }
                      variant={
                        nextBooking.status === 'confirmed' || nextBooking.status === 'approved'
                          ? 'success'
                          : nextBooking.status === 'in_progress'
                          ? 'secondary'
                          : 'warning'
                      }
                    />
                    <Text style={styles.bookingId}>#{nextBooking.id.slice(-6).toUpperCase()}</Text>
                  </View>
                  <View style={styles.bookingInfoList}>
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconBox, { backgroundColor: colors.primary[50] }]}>
                        <Calendar size={13} color={colors.primary[600]} />
                      </View>
                      <Text style={styles.infoText}>
                        {new Date(nextBooking.bookingDate).toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconBox, { backgroundColor: colors.primary[50] }]}>
                        <Clock size={13} color={colors.primary[600]} />
                      </View>
                      <Text style={styles.infoText}>
                        {(nextBooking.timeSlots && nextBooking.timeSlots.length > 0)
                          ? nextBooking.timeSlots.join(', ')
                          : (nextBooking.timeSlot || '-')}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconBox, { backgroundColor: colors.primary[50] }]}>
                        <MapPin size={13} color={colors.primary[600]} />
                      </View>
                      <Text style={styles.infoText} numberOfLines={1}>
                        {nextBooking.pickupAddress}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyBooking}>
                <View style={styles.emptyBookingAccent} />
                <View style={styles.emptyBookingBody}>
                  <View style={styles.emptyIconCircle}>
                    <Calendar size={26} color={colors.primary[600]} />
                  </View>
                  <Text style={styles.emptyTitle}>Belum ada jadwal booking</Text>
                  <Text style={styles.emptySubtitle}>
                    Mulai buat booking pertama Anda dan kami siap membantu
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => router.push('/booking/new')}
                    activeOpacity={0.85}
                  >
                    <Plus size={15} color={colors.white} />
                    <Text style={styles.emptyBtnText}>Buat Booking</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Program Unggulan ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Program Unggulan</Text>
          <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/programs')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
            <ChevronRight size={13} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {programsLoading ? (
          <Skeleton height={180} borderRadius={18} />
        ) : programs?.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.programsRow}
          >
            {programs.map((p: any, idx: number) => {
              const CARD_COLORS = [
                { from: colors.primary[600], to: colors.primary[400] },
                { from: '#E11D48', to: '#FB7185' },
                { from: colors.secondary[600], to: colors.secondary[400] },
                { from: '#7C3AED', to: '#A78BFA' },
              ];
              const cc = CARD_COLORS[idx % CARD_COLORS.length];
              const progress = pct(p.collectedAmount, p.targetAmount);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.programCard}
                  onPress={() => router.push(`/programs/${p.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Colored header */}
                  <View style={[styles.programHeader, { backgroundColor: cc.from }]}>
                    <Heart size={34} color="rgba(255,255,255,0.35)" fill="rgba(255,255,255,0.2)" />
                    <View style={styles.programPctBadge}>
                      <Text style={styles.programPctText}>{progress}%</Text>
                    </View>
                  </View>
                  {/* Content */}
                  <View style={styles.programBody}>
                    <Badge label={p.category} variant="primary" size="sm" />
                    <Text style={styles.programTitle} numberOfLines={2}>{p.title}</Text>
                    <ProgressBar
                      progress={p.collectedAmount / p.targetAmount}
                      style={styles.programBar}
                    />
                    <View style={styles.programAmountRow}>
                      <Text style={[styles.programRaised, { color: cc.from }]}>
                        {formatCurrency(p.collectedAmount)}
                      </Text>
                      <Text style={styles.programTarget}>
                        {' '}/ {formatCurrency(p.targetAmount)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyProgram}>
            <View style={[styles.emptyProgramIcon, { backgroundColor: '#FFF1F2' }]}>
              <Heart size={26} color="#E11D48" />
            </View>
            <View style={styles.emptyProgramText}>
              <Text style={styles.emptyTitle}>Belum ada program aktif</Text>
              <Text style={styles.emptySubtitle}>Program unggulan akan segera hadir</Text>
            </View>
            <View style={styles.emptyProgramDots}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={[styles.dot, { backgroundColor: i === 0 ? colors.primary[400] : colors.gray[200] }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Berita Terbaru ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Berita Terbaru</Text>
          <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/news')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
            <ChevronRight size={13} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {newsLoading ? (
          <>
            <Skeleton height={100} borderRadius={18} />
            <Skeleton height={100} borderRadius={18} />
          </>
        ) : news?.length > 0 ? (
          news.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsCard}
              onPress={() => router.push(`/news/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.newsThumb} />
              <View style={styles.newsBody}>
                <Badge label={item.category} variant="secondary" size="sm" />
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsDate}>
                  {new Date(item.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.newsArrow}>
                <ChevronRight size={16} color={colors.gray[400]} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyNews}>
            <View style={[styles.emptyNewsThumb, { backgroundColor: colors.gray[100] }]}>
              <Newspaper size={28} color={colors.gray[400]} />
            </View>
            <View style={styles.emptyNewsText}>
              <Text style={styles.emptyTitle}>Belum ada berita</Text>
              <Text style={styles.emptySubtitle}>Nantikan berita terbaru dari kami</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[700],
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  greetingLabel: {
    fontSize: 12,
    color: colors.primary[200],
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: colors.primary[700],
  },

  // ── Stats strip ──
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.primary[200],
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 13,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 6,
  },

  // ── White panel ──
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  panelContent: {
    padding: 20,
  },

  // ── Section headers ──
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
  },

  // ── Featured campaign card ──
  featuredCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginTop: 8,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  featuredPct: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary[700],
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
    lineHeight: 22,
  },
  featuredBar: {
    marginBottom: 12,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredRaised: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary[700],
  },
  featuredTarget: {
    fontSize: 12,
    color: colors.gray[500],
  },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  featuredCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[600],
  },

  // ── Operational quick grid ──
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quickItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[800],
  },

  // ── Impact card (fallback) ──
  impactCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    marginTop: 8,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  impactItem: {
    alignItems: 'center',
    gap: 6,
  },
  impactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gray[900],
  },
  impactLabel: {
    fontSize: 10,
    color: colors.gray[500],
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Booking card ──
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  bookingAccent: {
    width: 4,
    backgroundColor: colors.primary[500],
  },
  bookingBody: {
    flex: 1,
    padding: 16,
  },
  bookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bookingId: {
    fontSize: 12,
    color: colors.gray[400],
    fontWeight: '600',
  },
  bookingInfoList: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: colors.gray[700],
    flex: 1,
    lineHeight: 18,
  },

  // ── Program cards ──
  programsRow: {
    gap: 14,
    paddingRight: 4,
  },
  programCard: {
    width: 240,
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  programHeader: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  programPctBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  programPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  programBody: {
    padding: 14,
  },
  programTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 8,
    marginBottom: 10,
    lineHeight: 18,
  },
  programBar: {
    marginBottom: 8,
  },
  programAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  programRaised: {
    fontSize: 13,
    fontWeight: '700',
  },
  programTarget: {
    fontSize: 11,
    color: colors.gray[400],
  },

  // ── News cards ──
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  newsThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
    marginRight: 12,
  },
  newsBody: {
    flex: 1,
    gap: 4,
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[900],
    lineHeight: 18,
  },
  newsDate: {
    fontSize: 11,
    color: colors.gray[400],
    fontWeight: '500',
  },
  newsArrow: {
    paddingLeft: 4,
  },

  // ── Empty states ──
  emptyBooking: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyBookingAccent: {
    width: 4,
    backgroundColor: colors.primary[200],
  },
  emptyBookingBody: {
    flex: 1,
    padding: 20,
    alignItems: 'flex-start',
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[800],
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.gray[500],
    lineHeight: 17,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  emptyProgram: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyProgramIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProgramText: {
    flex: 1,
    gap: 4,
  },
  emptyProgramDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  emptyNews: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyNewsThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyNewsText: {
    flex: 1,
    gap: 4,
  },
});
