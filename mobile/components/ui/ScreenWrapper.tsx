import { ReactNode } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

interface ScreenWrapperProps {
  children: ReactNode;
  scrollable?: boolean;
  refreshable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  backgroundColor?: string;
  style?: any;
  contentContainerStyle?: any;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  refreshable = false,
  refreshing = false,
  onRefresh,
  backgroundColor = colors.background,
  style,
  contentContainerStyle,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const refreshControl = refreshable && onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary[600]}
      colors={[colors.primary[600]]}
    />
  ) : undefined;

  const Container = scrollable ? ScrollView : View;

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Container
        style={[styles.content, style]}
        contentContainerStyle={[
          scrollable && styles.scrollContent,
          contentContainerStyle,
        ]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
});
