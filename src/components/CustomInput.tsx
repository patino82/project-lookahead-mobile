import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants';

interface CustomInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry,
  multiline = false
}) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      placeholderTextColor={COLORS.textSecondary}
      multiline={multiline}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.soft,
    borderRadius: RADIUS.sm,
    minHeight: 46,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    color: COLORS.ink,
    fontWeight: '500',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  }
});
