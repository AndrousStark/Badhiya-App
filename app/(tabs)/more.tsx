/**
 * More tab — settings, rewards, help, logout, plus links to
 * later-phase screens (ONDC, AI Chat, Notifications, Health Score).
 *
 * Phase 2 placeholder with the full nav pattern. Real sheets ship
 * in Phase 10 (settings + rewards) and Phases 3/7/8/9 (others).
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import {
  User,
  Bell,
  Globe,
  Fingerprint,
  Trophy,
  HelpCircle,
  LogOut,
  Sparkles,
  Building2,
  Store as StoreIcon,
  ChevronRight,
  Network,
  Users,
  Calendar,
  Wallet,
  Lightbulb,
  Crown,
  Shield,
} from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '../../src/theme';
import { auth$, logout } from '../../src/stores/auth';
import { haptic } from '../../src/lib/haptics';
import { FadeInUp } from '../../src/components/animations';
import { SectionLabel } from '../../src/components/ui';

interface Row {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
}

export default observer(function MoreScreen() {
  const name = auth$.name.get() ?? 'Rajesh ji';
  const shop = auth$.businessName.get() ?? 'Sharma General Store';
  const score = auth$.healthScore.get() ?? 644;
  const tier = auth$.healthTier.get() ?? 'gold';
  const streak = auth$.streakDays.get();
  const coins = auth$.badhiyaCoins.get();

  const shopSection: Row[] = [
    {
      icon: <StoreIcon color={Colors.saffron[600]} size={18} strokeWidth={2.4} />,
      label: 'Dukan Profile',
      onPress: () => { haptic('tap'); router.push('/settings/profile'); },
    },
    {
      icon: <Building2 color={Colors.saffron[600]} size={18} strokeWidth={2.4} />,
      label: 'GST & Udyam',
      onPress: () => { haptic('tap'); router.push('/settings/gst'); },
    },
    {
      icon: <Crown color={Colors.gold[500]} size={18} strokeWidth={2.4} />,
      label: 'Subscription',
      hint: 'Plan & billing',
      onPress: () => { haptic('tap'); router.push('/settings/subscription'); },
    },
  ];

  const insightsSection: Row[] = [
    {
      icon: <Lightbulb color={Colors.saffron[600]} size={18} strokeWidth={2.4} />,
      label: 'Smart Insights',
      hint: 'Prices · Demand · Festivals',
      onPress: () => {
        haptic('tap');
        router.push('/insights');
      },
    },
  ];

  const commerceSection: Row[] = [
    {
      icon: <Network color={Colors.saffron[600]} size={18} strokeWidth={2.4} />,
      label: 'ONDC Commerce',
      hint: 'Bharat ka network',
      onPress: () => {
        haptic('tap');
        router.push('/ondc');
      },
    },
  ];

  const teamSection: Row[] = [
    {
      icon: <Users color={Colors.trust[500]} size={18} strokeWidth={2.4} />,
      label: 'Meri Team',
      hint: 'Members & Roles',
      onPress: () => {
        haptic('tap');
        router.push('/team');
      },
    },
    {
      icon: <Calendar color={Colors.saffron[600]} size={18} strokeWidth={2.4} />,
      label: 'Attendance',
      hint: 'Hajri lagao',
      onPress: () => {
        haptic('tap');
        router.push('/team/attendance');
      },
    },
    {
      icon: <Wallet color={Colors.trust[500]} size={18} strokeWidth={2.4} />,
      label: 'Payroll',
      hint: 'Salary & Payslips',
      onPress: () => {
        haptic('tap');
        router.push('/team/payroll');
      },
    },
  ];

  const prefSection: Row[] = [
    { icon: <Globe color={Colors.saffron[600]} size={18} strokeWidth={2.4} />, label: 'Bhasha', hint: 'Hindi', onPress: () => { haptic('tap'); router.push('/settings/language'); } },
    { icon: <Bell color={Colors.saffron[600]} size={18} strokeWidth={2.4} />, label: 'Notifications', onPress: () => { haptic('tap'); router.push('/settings/notifications'); } },
    { icon: <Fingerprint color={Colors.saffron[600]} size={18} strokeWidth={2.4} />, label: 'Biometric Lock', hint: 'ON', onPress: () => { haptic('tap'); router.push('/settings/biometric'); } },
  ];

  const engageSection: Row[] = [
    {
      icon: <Trophy color={Colors.gold[500]} size={18} strokeWidth={2.4} />,
      label: 'Badhiya Rewards',
      hint: `${streak} din streak · ${coins} 🪙`,
      onPress: () => {
        haptic('tap');
        router.push('/rewards');
      },
    },
    {
      icon: <Sparkles color={Colors.saffron[600]} size={18} strokeWidth={2.4} />,
      label: 'AI Chat',
      hint: 'Pucho Kuch Bhi',
      onPress: () => {
        haptic('tap');
        router.push('/chat');
      },
    },
  ];

  const supportSection: Row[] = [
    { icon: <HelpCircle color={Colors.trust[500]} size={18} strokeWidth={2.4} />, label: 'Madad chahiye?', onPress: () => { haptic('tap'); router.push('/settings/help'); } },
  ];

  // Admin panel — only show for admin-role users (checks adminAuth)
  const adminSection: Row[] = [
    {
      icon: <Shield color={Colors.ink[700]} size={18} strokeWidth={2.4} />,
      label: 'Admin Panel',
      hint: 'Super admin',
      onPress: () => { haptic('tap'); router.push('/admin'); },
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInUp delay={0}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <User color={Colors.white} size={26} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileShop}>{shop}</Text>
              <View style={styles.profileStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{score}</Text>
                  <Text style={styles.statLabel}>Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, styles.statTier]}>{tier.toUpperCase()}</Text>
                  <Text style={styles.statLabel}>Tier</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{coins}</Text>
                  <Text style={styles.statLabel}>Coins 🪙</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={60}>
          <SectionLabel label="Shop" />
          <RowCard rows={shopSection} />
        </FadeInUp>

        <FadeInUp delay={85}>
          <SectionLabel label="Insights" />
          <RowCard rows={insightsSection} />
        </FadeInUp>

        <FadeInUp delay={90}>
          <SectionLabel label="Commerce" />
          <RowCard rows={commerceSection} />
        </FadeInUp>

        <FadeInUp delay={105}>
          <SectionLabel label="Team" />
          <RowCard rows={teamSection} />
        </FadeInUp>

        <FadeInUp delay={120}>
          <SectionLabel label="Preferences" />
          <RowCard rows={prefSection} />
        </FadeInUp>

        <FadeInUp delay={180}>
          <SectionLabel label="Engagement" />
          <RowCard rows={engageSection} />
        </FadeInUp>

        <FadeInUp delay={240}>
          <SectionLabel label="Support" />
          <RowCard rows={supportSection} />
        </FadeInUp>

        <FadeInUp delay={260}>
          <SectionLabel label="Admin" />
          <RowCard rows={adminSection} />

          <Pressable
            style={({ pressed }) => [styles.logoutRow, pressed && styles.logoutPressed]}
            onPress={() => {
              haptic('error');
              logout();
            }}
          >
            <LogOut color={Colors.loss[500]} size={18} strokeWidth={2.4} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </FadeInUp>

        <Text style={styles.version}>Badhiya · v0.1.0 · Made for Bharat</Text>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
});

function RowCard({ rows }: { rows: Row[] }) {
  return (
    <View style={styles.rowCard}>
      {rows.map((r, i) => (
        <Pressable
          key={r.label}
          onPress={r.onPress}
          style={({ pressed }) => [
            styles.row,
            i < rows.length - 1 && styles.rowWithDivider,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.rowIcon}>{r.icon}</View>
          <Text style={styles.rowLabel}>{r.label}</Text>
          {r.hint ? <Text style={styles.rowHint}>{r.hint}</Text> : null}
          <ChevronRight color={Colors.ink[300]} size={18} strokeWidth={2.2} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl },
  profileCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  profileShop: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: 2,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  stat: { alignItems: 'flex-start' },
  statValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  statTier: { color: Colors.gold[500] },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  rowCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPressed: { backgroundColor: Colors.saffron[50] },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[900],
  },
  rowHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
  },
  logoutPressed: { opacity: 0.6 },
  logoutText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    fontWeight: FontWeight.bold,
  },
  version: {
    textAlign: 'center',
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[300],
    marginTop: Spacing.md,
  },
});
