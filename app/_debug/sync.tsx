/**
 * Sync de-risk screen — Sprint 1 Day 4.
 *
 * Exit criterion: airplane mode ON → create 3 txns → kill app → reopen
 * (all 3 still 'created') → airplane mode OFF → all 3 flip to 'synced'
 * within 30 s → backend shows 3 new records.
 *
 * Delete this file in Phase 4 once Legend State sync engine replaces this.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { desc } from 'drizzle-orm';
import { db } from '../../src/db/client';
import { transactions, type Transaction } from '../../src/db/schema';
import {
  createTransactionOffline,
  syncPendingTransactions,
  type SyncResult,
} from '../../src/services/sync';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
} from '../../src/theme';
import { haptic } from '../../src/lib/haptics';
import { auth$ } from '../../src/stores/auth';

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  created: { bg: Colors.warning[50], fg: Colors.warning[700] },
  updated: { bg: Colors.warning[50], fg: Colors.warning[700] },
  syncing: { bg: Colors.trust[50], fg: Colors.trust[700] },
  synced: { bg: Colors.profit[50], fg: Colors.profit[700] },
  deleted: { bg: Colors.loss[50], fg: Colors.loss[700] },
};

export default function SyncDebugScreen() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('250');
  const [item, setItem] = useState('Test atta 5kg');
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(50);
    setRows(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addTransaction() {
    if (!auth$.businessId.get()) {
      auth$.set({
        ...auth$.get(),
        isAuthenticated: true,
        userId: 'debug',
        businessId: 'debug-biz',
        businessName: 'Debug Shop',
      });
    }

    setBusy(true);
    try {
      await createTransactionOffline({
        type: 'sale',
        amount: parseFloat(amount) || 0,
        item,
        category: 'debug',
        recordedVia: 'manual',
      });
      haptic('confirm');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    try {
      const result = await syncPendingTransactions();
      setLastResult(result);
      haptic(result.failed === 0 ? 'confirm' : 'error');
      await refresh();
    } finally {
      setSyncing(false);
    }
  }

  const pendingCount = rows.filter((r) => r.syncStatus !== 'synced').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Sprint 1 · Day 4</Text>
          <Text style={styles.instructionBody}>
            1. Tap <Text style={styles.bold}>Add Transaction</Text> 3 times (airplane
            mode ON){'\n'}
            2. Kill the app, reopen this screen — all 3 still show{' '}
            <Text style={styles.bold}>created</Text>{'\n'}
            3. Turn airplane mode OFF, tap{' '}
            <Text style={styles.bold}>Force Sync</Text>{'\n'}
            4. All 3 flip to <Text style={styles.bold}>synced</Text>, backend
            shows them
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="250"
          />
          <Text style={styles.formLabel}>Item</Text>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={setItem}
            placeholder="Test item"
          />
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={addTransaction}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.ctaText}>+ Add Transaction (offline)</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillValue}>{rows.length}</Text>
            <Text style={styles.statusPillLabel}>total</Text>
          </View>
          <View style={[styles.statusPill, styles.statusPillWarn]}>
            <Text style={styles.statusPillValue}>{pendingCount}</Text>
            <Text style={styles.statusPillLabel}>pending</Text>
          </View>
          <View style={[styles.statusPill, styles.statusPillOk]}>
            <Text style={styles.statusPillValue}>
              {rows.length - pendingCount}
            </Text>
            <Text style={styles.statusPillLabel}>synced</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.syncBtn,
            pressed && styles.ctaPressed,
            syncing && styles.syncBtnDisabled,
          ]}
          onPress={runSync}
          disabled={syncing || pendingCount === 0}
        >
          {syncing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.syncBtnText}>
              🔄 Force Sync ({pendingCount})
            </Text>
          )}
        </Pressable>

        {lastResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Last sync result</Text>
            <Text style={styles.resultLine}>
              Attempted: {lastResult.attempted} · Succeeded:{' '}
              {lastResult.succeeded} · Failed: {lastResult.failed}
            </Text>
            {lastResult.errors.slice(0, 3).map((e, i) => (
              <Text key={i} style={styles.resultError}>
                · {e}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.listHeader}>Local rows ({rows.length})</Text>
        {rows.length === 0 ? (
          <Text style={styles.empty}>No transactions yet — add one above</Text>
        ) : (
          rows.map((r) => {
            const c = STATUS_COLORS[r.syncStatus] ?? STATUS_COLORS.created!;
            return (
              <View key={r.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowItem}>{r.item ?? '(no item)'}</Text>
                  <Text style={styles.rowAmt}>
                    ₹{r.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.rowMeta}>
                  <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.badgeText, { color: c.fg }]}>
                      {r.syncStatus}
                    </Text>
                  </View>
                  <Text style={styles.rowId}>{r.id.slice(-12)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  instructionCard: {
    backgroundColor: Colors.trust[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.trust[500],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  instructionTitle: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.trust[700],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  instructionBody: {
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    lineHeight: 22,
  },
  bold: { fontWeight: FontWeight.bold },
  formCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.label,
    color: Colors.ink[900],
    marginBottom: Spacing.md,
    minHeight: TouchTarget.comfort,
  },
  cta: {
    backgroundColor: Colors.saffron[500],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.badhiya,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.label },
  statusRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statusPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statusPillWarn: { backgroundColor: Colors.warning[50] },
  statusPillOk: { backgroundColor: Colors.profit[50] },
  statusPillValue: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  statusPillLabel: {
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: Colors.trust[500],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: TouchTarget.badhiya,
    justifyContent: 'center',
  },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.label },
  resultCard: {
    backgroundColor: Colors.profit[50],
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  resultLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.profit[700],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  resultLine: { fontSize: FontSize.caption, color: Colors.ink[700] },
  resultError: { fontSize: 11, color: Colors.loss[500], marginTop: 2 },
  listHeader: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  empty: {
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.xl,
  },
  row: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowItem: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.ink[900] },
  rowAmt: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    fontFamily: 'monospace',
    color: Colors.saffron[600],
  },
  rowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowId: { fontSize: 10, color: Colors.ink[300], fontFamily: 'monospace' },
});
