import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: any;
  disabled?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style,
  disabled = false 
}) => (
  <TouchableOpacity 
    style={[
      styles.button, 
      styles[variant], 
      style,
      disabled && styles.disabled
    ]} 
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[
      styles.buttonText, 
      styles[`${variant}Text`],
      disabled && styles.disabledText
    ]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
  },
  primary: {
    backgroundColor: COLORS.ink,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  primaryText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondary: {
    backgroundColor: COLORS.primary,
  },
  secondaryText: {
    color: '#FFF',
    fontWeight: '800',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.ink,
  },
  outlineText: {
    color: COLORS.ink,
    fontWeight: '850',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 14,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.textSecondary,
  }
});
