import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface MainThemeLayoutProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactNode;
  statsStrip?: ReactNode;
  children: ReactNode;
}

export function MainThemeLayout({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightElement,
  statsStrip,
  children,
}: MainThemeLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress || (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))}
              activeOpacity={0.85}
            >
              <ChevronLeft size={22} color={colors.white} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerTitleWrap}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          {rightElement}
        </View>
        {statsStrip}
      </View>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 18) }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[700],
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary[200],
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
  },
});
