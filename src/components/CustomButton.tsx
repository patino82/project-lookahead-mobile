import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: any;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, variant = 'primary', style }) => (
  <TouchableOpacity 
    style={[styles.button, styles[variant], style]} 
    onPress={onPress}
  >
    <Text style={[styles.buttonText, styles[`${variant}Text`]]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  secondaryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 16,
  },
});
