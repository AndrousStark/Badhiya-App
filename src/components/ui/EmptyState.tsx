/**
 * EmptyState — warm, friendly empty screen content.
 *
 * Not a "nothing here" dead end — always offers an action and a
 * reassuring Hindi tagline.
 */

import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '@theme';
import { Button } from './Button';

interface Props {
  icon?: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          size="md"
          variant="primary"
          style={styles.btn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  icon: { marginBottom: Spacing.lg },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  btn: { marginTop: Spacing.xl },
});
