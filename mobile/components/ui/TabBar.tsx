import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  User,
  LayoutGrid,
  Calendar,
  Package,
  Heart,
  Truck,
  Gavel,
  Wallet,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { isProfileComplete } from '@/utils/profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SERVICES = [
  { icon: Calendar, label: 'Booking',   route: '/booking',   color: colors.primary[600],   bg: colors.primary[50]   },
  { icon: Heart,    label: 'Donasi',    route: '/donations', color: '#E11D48',             bg: '#FFF1F2'            },
  { icon: Truck,    label: 'Jemput',    route: '/pickups',   color: colors.warning[600],   bg: colors.warning[50]   },
  { icon: Package,  label: 'Peralatan', route: '/equipment', color: colors.secondary[600], bg: colors.secondary[50] },
  { icon: Gavel,    label: 'Lelang',    route: '/auctions',  color: '#7C3AED',             bg: '#F5F3FF'            },
  { icon: Wallet,   label: 'Keuangan',  route: '/financial', color: '#0891B2',             bg: '#ECFEFF', roles: ['admin', 'superadmin', 'pengurus'] },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const role = user?.role || '';
  const [isOpen, setIsOpen] = useState(false);
  const visibleServices = SERVICES.filter((svc: any) => !svc.roles || svc.roles.includes(role));

  const backdropAnim  = useRef(new Animated.Value(0)).current;
  const panelAnim     = useRef(new Animated.Value(400)).current;
  const rotateAnim    = useRef(new Animated.Value(0)).current;
  const itemAnims     = useRef(SERVICES.map(() => new Animated.Value(0))).current;

  const isActive = (name: string) => state.routes[state.index]?.name === name;

  const openMenu = () => {
    itemAnims.forEach((a: Animated.Value) => a.setValue(0));
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(panelAnim,    { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
      Animated.timing(rotateAnim,   { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.stagger(55, itemAnims.map((a: Animated.Value) =>
        Animated.spring(a, { toValue: 1, tension: 130, friction: 8, useNativeDriver: true })
      )),
    ]).start();
  };

  const closeMenu = (afterClose?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(panelAnim,    { toValue: 400, duration: 240, useNativeDriver: true }),
      Animated.timing(rotateAnim,   { toValue: 0, duration: 220, useNativeDriver: true }),
      ...itemAnims.map((a: Animated.Value) =>
        Animated.timing(a, { toValue: 0, duration: 130, useNativeDriver: true })
      ),
    ]).start(() => {
      setIsOpen(false);
      afterClose?.();
    });
  };

  const handleService = (route: string) => {
    if (!isProfileComplete(user as any)) {
      closeMenu(() => router.push('/profile/edit'));
      return;
    }
    closeMenu(() => router.push(route));
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] });
  const tabBarHeight = 64 + Math.max(insets.bottom, 0);
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  return (
    <>
      {/* ── Layanan Popup Modal ── */}
      <Modal
        transparent
        visible={isOpen}
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeMenu()}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />

        {/* Service Panel */}
        <Animated.View
          style={[
            styles.servicePanel,
            { paddingBottom: tabBarHeight + 12 },
            { transform: [{ translateY: panelAnim }] },
          ]}
        >
          <View style={styles.panelHandle} />
          <Text style={styles.panelTitle}>Pilih Layanan</Text>

          <View style={styles.serviceGrid}>
            {visibleServices.map((svc, i) => (
              <Animated.View
                key={svc.label}
                style={{
                  opacity: itemAnims[i],
                  transform: [{ scale: itemAnims[i] }],
                  width: (SCREEN_WIDTH - 48) / 3,
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <TouchableOpacity
                  style={styles.serviceItem}
                  onPress={() => handleService(svc.route)}
                  activeOpacity={0.72}
                >
                  <View style={[styles.serviceIconBox, { backgroundColor: svc.bg }]}>
                    <svc.icon size={28} color={svc.color} />
                  </View>
                  <Text style={styles.serviceLabel}>{svc.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </Modal>

      {/* ── Tab Bar ── */}
      <View style={[styles.tabBar, { height: tabBarHeight, paddingBottom: tabBarPaddingBottom }]}>
        {/* Beranda */}
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('index')}>
          <Home size={24} color={isActive('index') ? colors.primary[600] : colors.gray[400]} />
          <Text style={[styles.tabLabel, isActive('index') && styles.tabLabelActive]}>
            Beranda
          </Text>
        </TouchableOpacity>

        {/* Center Layanan FAB */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fab}
            onPress={isOpen ? () => closeMenu() : openMenu}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <LayoutGrid size={26} color={colors.white} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Layanan</Text>
        </View>

        {/* Profil */}
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('profile')}>
          <User size={24} color={isActive('profile') ? colors.primary[600] : colors.gray[400]} />
          <Text style={[styles.tabLabel, isActive('profile') && styles.tabLabelActive]}>
            Profil
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Modal overlay ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // ── Service panel ──
  servicePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    alignSelf: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 24,
    textAlign: 'center',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  serviceItem: {
    alignItems: 'center',
  },
  serviceIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
  },

  // ── Tab bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  // ── FAB ──
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[600],
    marginTop: 3,
  },
});
