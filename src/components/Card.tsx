import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'glass' | 'solid';
}

export const Card: React.FC<CardProps> = ({ title, children, footer, variant = 'glass' }) => (
  <View style={[
    styles.card, 
    variant === 'solid' ? styles.solid : styles.glass
  ]}>
    {title && (
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
    )}
    <View style={styles.content}>{children}</View>
    {footer && <View style={styles.footer}>{footer}</View>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  glass: {
    backgroundColor: COLORS.surface,
    // Note: real glassmorphism in RN requires Expo Blur, 
    // using rgba background for cross-platform compatibility
  },
  solid: {
    backgroundColor: COLORS.cardSolid,
    shadowColor: '#1f1a12',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 36,
    elevation: 5,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
});
