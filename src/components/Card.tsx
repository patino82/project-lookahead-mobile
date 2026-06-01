import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'outline';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  subtitle,
  children, 
  footer, 
  variant = 'elevated',
  style 
}) => (
  <View style={[
    styles.card, 
    styles[variant],
    style
  ]}>
    {(title || subtitle) && (
      <View style={styles.header}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    backgroundColor: COLORS.surface,
  },
  flat: {
    backgroundColor: COLORS.background,
  },
  elevated: {
    ...SHADOWS.soft,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  content: {
    flexShrink: 1,
  },
  footer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
