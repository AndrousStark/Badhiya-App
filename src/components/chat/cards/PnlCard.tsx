/**
 * PnlCard — generative card for daily_pnl intent.
 *
 * Fetches today's P&L via useTodayPnl and renders a hero card with
 * revenue / expenses / profit. The AI's text response renders BELOW
 * the card as a contextual message.
 *
 * Pattern: every generative card always shows the AI's text + the
 * structured visualization. Never just text, never just visualization.
 */

import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@theme';
import { useTodayPnl } from '@/features/transactions/hooks';
import { useCurrency } from '@/hooks/useCurrency';
import { Skeleton } from '@/components/ui';

interface Props {
  responseText: string | null;
}

export function PnlCard({ responseText }: Props) {
  const pnlQ = useTodayPnl();
  const { format } = useCurrency();

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconBg}>
            <IndianRupee color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>Aaj ka Hisaab</Text>
        </View>

        {pnlQ.isLoading ? (
          <View style={styles.statsCol}>
            <Skeleton height={28} radius={6} />
            <Skeleton height={28} radius={6} style={{ marginTop: 8 }} />
            <Skeleton height={32} radius={6} style={{ marginTop: 12 }} />
          </View>
        ) : pnlQ.data ? (
          <View style={styles.statsCol}>
            <Row
              icon={
                <TrendingUp color={Colors.profit[500]} size={14} strokeWidth={2.4} />
              }
              label="Revenue"
              value={format(pnlQ.data.totalRevenue)}
              tone="profit"
            />
            <Row
              icon={
                <TrendingDown color={Colors.loss[500]} size={14} strokeWidth={2.4} />
              }
              label="Expenses"
              value={format(pnlQ.data.totalExpenses)}
              tone="loss"
            />
            <View style={styles.divider} />
            <Row
              icon={null}
              label="Munafa"
              value={format(pnlQ.data.profit)}
              tone={pnlQ.data.profit >= 0 ? 'profit' : 'loss'}
              big
            />
            <Text style={styles.meta}>
              {pnlQ.data.transactionCount} transactions
            </Text>
          </View>
        ) : (
          <Text style={styles.errorText}>P&L load nahi hua</Text>
        )}
      </View>

      {responseText && <Text style={styles.responseText}>{responseText}</Text>}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  tone,
  big = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'profit' | 'loss';
  big?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        {icon}
        <Text style={[styles.rowLabelText, big && styles.rowLabelBig]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.rowValue,
          big && styles.rowValueBig,
          { color: tone === 'profit' ? Colors.profit[500] : Colors.loss[500] },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  statsCol: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowLabelText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
  },
  rowLabelBig: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  rowValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
  },
  rowValueBig: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.saffron[200],
    marginVertical: Spacing.sm,
  },
  meta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 4,
    textAlign: 'right',
  },
  responseText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
  },
});
