import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { COLORS, FONT_SIZE, RADIUS } from '../constants';
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
        style
      ]}
    >
      <ButtonWrapper 
        {...wrapperProps}
        style={[
          styles.button, 
          size === 'sm' && styles.buttonSm,
          size === 'lg' && styles.buttonLg,
          !isGradient && styles[variant],
          disabled && styles.disabled
        ]}
      >
        <Text style={[
          styles.buttonText, 
          styles[`${variant}Text`],
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
          disabled && styles.disabledText,
          textStyle
        ]}>{title}</Text>
      </ButtonWrapper>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    overflow: 'hidden',
  },
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonSm: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonLg: {
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 24,
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
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  textSm: {
    fontSize: FONT_SIZE.sm,
  },
  textLg: {
    fontSize: FONT_SIZE.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.textDisabled,
  }
});
