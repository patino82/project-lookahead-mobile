import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomButtonProps extends Pick<TouchableOpacityProps, 'accessibilityLabel' | 'accessibilityHint'> {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style,
  textStyle,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isGradient = variant === 'primary' || variant === 'secondary';
  const gradientColors = variant === 'primary' ? COLORS.brandGradient : COLORS.heroGradient;

  const ButtonWrapper: any = isGradient ? LinearGradient : View;
  const wrapperProps = isGradient ? {
    colors: gradientColors,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  } : {};

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      style={[
        styles.touchable,
        size === 'sm' && styles.sizeSm,
        size === 'lg' && styles.sizeLg,
        style
      ]}
    >
      <ButtonWrapper 
        {...wrapperProps}
        style={[
          styles.button, 
          !isGradient && styles[variant],
          disabled && styles.disabled
        ]}
      >
        <Text style={[
          styles.buttonText, 
          styles[`${variant}Text`],
          size === 'sm' && styles.textSm,
          disabled && styles.disabledText,
          textStyle
        ]}>{title}</Text>
      </ButtonWrapper>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginVertical: SPACING.xs,
  },
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  primary: {
    // Handled by gradient
  },
  primaryText: {
    color: COLORS.textInverse,
    fontWeight: '800',
  },
  secondary: {
    // Handled by gradient
  },
  secondaryText: {
    color: COLORS.textInverse,
    fontWeight: '800',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  outlineText: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.textDisabled,
  }
});
