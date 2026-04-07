/**
 * /admin/business/[id] — Admin business detail + actions.
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Ban, CheckCircle2, UserCog } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, Badge, Button, SectionLabel } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { useAdminBusinessDetail, useSuspendBusiness, useReactivateBusiness } from '@/features/admin/hooks';

export default function AdminBusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { format } = useCurrency();
  const detailQ = useAdminBusinessDetail(id);
  const suspendMut = useSuspendBusiness();
  const reactivateMut = useReactivateBusiness();

  const biz = detailQ.data;

  if (detailQ.isLoading && !biz) {
    return <SafeAreaView style={styles.safe} edges={['top']}><View style={{ padding: Spacing['3xl'] }}><Skeleton height={200} radius={20} /></View></SafeAreaView>;
  }
  if (!biz) {
    return <SafeAreaView style={styles.safe} edges={['top']}><View style={{ padding: Spacing['3xl'] }}><Text style={styles.emptyText}>Business nahi mila</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{biz.name}</Text>
          <Text style={styles.subtitle}>{biz.city ?? ''} · {biz.type ?? ''}</Text>
        </View>
        <Badge label={biz.isActive ? 'ACTIVE' : 'SUSPENDED'} tone={biz.isActive ? 'profit' : 'loss'} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={detailQ.isFetching} onRefresh={() => detailQ.refetch()} tintColor={Colors.saffron[500]} />}>

        <FadeInUp delay={0}>
          <View style={styles.card}>
            <InfoRow label="Owner" value={biz.ownerName ?? '—'} />
            <InfoRow label="Phone" value={biz.ownerPhone ?? '—'} />
            <InfoRow label="GST" value={biz.gstNumber ?? 'Not registered'} />
            <InfoRow label="Health Score" value={String(biz.healthScore)} />
            <InfoRow label="Products" value={String(biz.productCount)} />
            <InfoRow label="ONDC Orders" value={String(biz.ondcOrderCount)} />
            <InfoRow label="Created" value={biz.createdAt.slice(0, 10)} />
            {biz.lastActive && <InfoRow label="Last Active" value={biz.lastActive.slice(0, 10)} />}
          </View>
        </FadeInUp>

        {biz.creditSummary && (
          <FadeInUp delay={40}>
            <SectionLabel label="Credit Summary" />
            <View style={styles.card}>
              <InfoRow label="Outstanding" value={format((biz.creditSummary as any).totalOutstanding ?? 0)} />
              <InfoRow label="Customers" value={String((biz.creditSummary as any).customerCount ?? 0)} />
            </View>
          </FadeInUp>
        )}

        <FadeInUp delay={80}>
          <SectionLabel label="Actions" />
          <View style={styles.actionsRow}>
            {biz.isActive ? (
              <Button label="Suspend" variant="danger" size="md" loading={suspendMut.isPending}
                leftIcon={<Ban color={Colors.white} size={16} strokeWidth={2.4} />}
                onPress={() => Alert.alert('Suspend?', `"${biz.name}" ko suspend karein?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Suspend', style: 'destructive', onPress: () => suspendMut.mutate({ id: biz.id, reason: 'Admin action' }) },
                ])} />
            ) : (
              <Button label="Reactivate" size="md" loading={reactivateMut.isPending}
                leftIcon={<CheckCircle2 color={Colors.white} size={16} strokeWidth={2.4} />}
                onPress={() => reactivateMut.mutate(biz.id)} />
            )}
          </View>
        </FadeInUp>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  subtitle: { fontFamily: FontFamily.body, fontSize: FontSize.micro, color: Colors.ink[400], marginTop: 1 },
  scroll: { padding: Spacing.xl },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.ink[500], textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, ...Shadow.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[400] },
  infoValue: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  actionsRow: { flexDirection: 'row', gap: Spacing.md },
});
