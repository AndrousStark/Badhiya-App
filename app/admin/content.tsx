/**
 * /admin/content — Banners + Government Schemes CRUD.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Image, FileText, Plus, Trash2, X } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, SectionLabel, Badge, Button, Chip } from '@/components/ui';
import {
  useAdminBanners, useCreateBanner, useDeleteBanner,
  useAdminSchemes, useCreateScheme,
} from '@/features/admin/hooks';
import type { AdminBanner, AdminScheme, CreateBannerDto } from '@/features/admin/schemas';

export default function AdminContentScreen() {
  const bannersQ = useAdminBanners();
  const schemesQ = useAdminSchemes();
  const deleteBannerMut = useDeleteBanner();
  const [showCreateBanner, setShowCreateBanner] = useState(false);

  const banners = bannersQ.data?.data ?? [];
  const schemes = schemesQ.data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Content</Text>
        <Pressable onPress={() => setShowCreateBanner(true)} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
          <Plus color={Colors.saffron[500]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={bannersQ.isFetching} onRefresh={() => { bannersQ.refetch(); schemesQ.refetch(); }} tintColor={Colors.saffron[500]} />}>

        {/* Banners */}
        <FadeInUp delay={0}>
          <SectionLabel label={`Banners · ${banners.length}`} />
          {bannersQ.isLoading && banners.length === 0 ? (
            <Skeleton height={80} radius={12} />
          ) : banners.length === 0 ? (
            <Text style={styles.emptyText}>Koi banner nahi</Text>
          ) : (
            banners.map((b) => (
              <View key={b.id} style={styles.bannerCard}>
                <View style={styles.bannerIcon}>
                  <Image color={Colors.saffron[500]} size={18} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle} numberOfLines={1}>{b.title}</Text>
                  <Text style={styles.bannerMeta}>
                    {b.position} · {b.targetAudience} · P{b.priority}
                  </Text>
                </View>
                <Badge label={b.isActive ? 'ON' : 'OFF'} tone={b.isActive ? 'profit' : 'warning'} />
                <Pressable onPress={() => Alert.alert('Delete?', `"${b.title}" delete karein?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteBannerMut.mutate(b.id) },
                ])} hitSlop={8}>
                  <Trash2 color={Colors.loss[500]} size={16} strokeWidth={2.2} />
                </Pressable>
              </View>
            ))
          )}
        </FadeInUp>

        {/* Schemes */}
        <FadeInUp delay={40}>
          <SectionLabel label={`Government Schemes · ${schemes.length}`} />
          {schemes.length === 0 ? (
            <Text style={styles.emptyText}>Koi scheme nahi</Text>
          ) : (
            schemes.map((s) => (
              <View key={s.id} style={styles.schemeCard}>
                <FileText color={Colors.trust[500]} size={18} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.schemeTitle} numberOfLines={1}>{s.nameHindi ?? s.name}</Text>
                  <Text style={styles.schemeMeta} numberOfLines={2}>{s.description}</Text>
                  {s.maxAmount && <Text style={styles.schemeAmount}>Max: ₹{s.maxAmount.toLocaleString('en-IN')}</Text>}
                </View>
                <Badge label={s.isActive ? 'ACTIVE' : 'OFF'} tone={s.isActive ? 'profit' : 'warning'} />
              </View>
            ))
          )}
        </FadeInUp>

        <View style={{ height: 60 }} />
      </ScrollView>

      <CreateBannerModal visible={showCreateBanner} onClose={() => setShowCreateBanner(false)} onCreated={() => { setShowCreateBanner(false); bannersQ.refetch(); }} />
    </SafeAreaView>
  );
}

function CreateBannerModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const createMut = useCreateBanner();
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState('dashboard_top');

  async function handleCreate() {
    if (!title.trim()) { Alert.alert('Title chahiye'); return; }
    try {
      await createMut.mutateAsync({
        title: title.trim(),
        targetAudience: 'all' as const,
        position: position as
          | 'whatsapp'
          | 'dashboard_top'
          | 'dashboard_bottom'
          | 'sidebar'
          | 'modal',
        priority: 0,
        isActive: true,
      });
      setTitle('');
      onCreated();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Banner</Text>
            <Pressable onPress={onClose} hitSlop={8}><X color={Colors.ink[400]} size={22} strokeWidth={2.2} /></Pressable>
          </View>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Banner title…" placeholderTextColor={Colors.ink[300]} style={styles.fieldInput} />
          <Text style={styles.fieldLabel}>Position</Text>
          <View style={styles.chipRow}>
            {['dashboard_top', 'dashboard_bottom', 'modal'].map((p) => (
              <Chip key={p} label={p.replace('_', ' ')} active={position === p} onPress={() => { haptic('tap'); setPosition(p); }} />
            ))}
          </View>
          <Button label="Create Banner" onPress={handleCreate} loading={createMut.isPending} size="lg" fullWidth style={{ marginTop: Spacing.lg }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: { flex: 1, fontFamily: FontFamily.heading, fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  addBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.saffron[50], borderWidth: 1, borderColor: Colors.saffron[500], alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.xl },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[400], paddingVertical: Spacing.lg },
  bannerCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  bannerIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.saffron[50], alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  bannerMeta: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2 },
  schemeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  schemeTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  schemeMeta: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2, lineHeight: 16 },
  schemeAmount: { fontFamily: FontFamily.monoBold, fontSize: 11, fontWeight: FontWeight.bold, color: Colors.profit[500], marginTop: 4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, ...Shadow.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  fieldLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.ink[500], textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.xs },
  fieldInput: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.ink[900], backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
