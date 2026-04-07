/**
 * /admin/user/[id] — User 360 detail + admin actions.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Ban, CheckCircle2, MessageSquare, Activity, Send } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, Badge, Button, SectionLabel } from '@/components/ui';
import {
  useAdminUserDetail, useAdminUserActivity, useAdminUserNotes,
  useAddUserNote, useBlockUser, useUnblockUser,
} from '@/features/admin/hooks';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detailQ = useAdminUserDetail(id);
  const activityQ = useAdminUserActivity(id);
  const notesQ = useAdminUserNotes(id);
  const addNoteMut = useAddUserNote(id ?? '');
  const blockMut = useBlockUser();
  const unblockMut = useUnblockUser();

  const user = detailQ.data;
  const activities = activityQ.data?.activities ?? [];
  const notes = notesQ.data ?? [];
  const [noteText, setNoteText] = useState('');

  async function handleAddNote() {
    if (!noteText.trim()) return;
    haptic('tap');
    try {
      await addNoteMut.mutateAsync(noteText.trim());
      setNoteText('');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  if (detailQ.isLoading && !user) {
    return <SafeAreaView style={styles.safe} edges={['top']}><View style={{ padding: Spacing['3xl'] }}><Skeleton height={200} radius={20} /></View></SafeAreaView>;
  }
  if (!user) {
    return <SafeAreaView style={styles.safe} edges={['top']}><View style={{ padding: Spacing['3xl'] }}><Text style={styles.emptyText}>User nahi mila</Text></View></SafeAreaView>;
  }

  const isActive = user.is_active ?? true;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{user.name ?? 'Unknown'}</Text>
          <Text style={styles.subtitle}>{user.phone ?? '—'}</Text>
        </View>
        <Badge label={isActive ? 'ACTIVE' : 'BLOCKED'} tone={isActive ? 'profit' : 'loss'} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={detailQ.isFetching} onRefresh={() => { detailQ.refetch(); activityQ.refetch(); notesQ.refetch(); }} tintColor={Colors.saffron[500]} />}>

        {/* Profile info */}
        <FadeInUp delay={0}>
          <View style={styles.card}>
            <InfoRow label="Language" value={user.preferred_language ?? '—'} />
            <InfoRow label="Created" value={user.created_at?.slice(0, 10) ?? '—'} />
            <InfoRow label="Last Active" value={user.last_active_at?.slice(0, 10) ?? '—'} />
            <InfoRow label="Businesses" value={String((user.businesses as any[])?.length ?? 0)} />
          </View>
        </FadeInUp>

        {/* Activity timeline */}
        <FadeInUp delay={40}>
          <SectionLabel label={`Activity · ${activities.length}`} />
          {activities.slice(0, 10).map((a, i) => (
            <View key={a.id} style={styles.actRow}>
              <Activity color={Colors.ink[400]} size={14} strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actAction}>{a.action}</Text>
                <Text style={styles.actSource}>{a.source} · {a.created_at?.slice(0, 10) ?? ''}</Text>
              </View>
            </View>
          ))}
        </FadeInUp>

        {/* Admin notes */}
        <FadeInUp delay={80}>
          <SectionLabel label={`Admin Notes · ${notes.length}`} />
          <View style={styles.noteInputRow}>
            <TextInput value={noteText} onChangeText={setNoteText} placeholder="Add a note…" placeholderTextColor={Colors.ink[300]} style={styles.noteInput} multiline />
            <Pressable onPress={handleAddNote} style={styles.noteSend}>
              <Send color={Colors.saffron[500]} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>
          {notes.map((n) => (
            <View key={n.id} style={styles.noteCard}>
              <Text style={styles.noteContent}>{n.content}</Text>
              <Text style={styles.noteMeta}>{n.admin_name ?? 'Admin'} · {n.created_at?.slice(0, 10) ?? ''}</Text>
            </View>
          ))}
        </FadeInUp>

        {/* Actions */}
        <FadeInUp delay={120}>
          <SectionLabel label="Actions" />
          {isActive ? (
            <Button label="Block User" variant="danger" size="md"
              leftIcon={<Ban color={Colors.white} size={16} strokeWidth={2.4} />}
              loading={blockMut.isPending}
              onPress={() => Alert.alert('Block?', `"${user.name}" ko block karein?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Block', style: 'destructive', onPress: () => blockMut.mutate({ id: user.id, reason: 'Admin action' }) },
              ])} />
          ) : (
            <Button label="Unblock User" size="md"
              leftIcon={<CheckCircle2 color={Colors.white} size={16} strokeWidth={2.4} />}
              loading={unblockMut.isPending}
              onPress={() => unblockMut.mutate(user.id)} />
          )}
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
  actRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actAction: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[700] },
  actSource: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[400], marginTop: 2 },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  noteInput: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[900], backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 40 },
  noteSend: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.saffron[50], alignItems: 'center', justifyContent: 'center' },
  noteCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  noteContent: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[900], lineHeight: 20 },
  noteMeta: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[400], marginTop: Spacing.xs },
});
