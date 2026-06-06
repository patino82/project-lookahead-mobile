import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CustomButton } from './CustomButton';
import { COLORS, SPACING } from '../constants';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Render error caught by boundary', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>Retry the current screen or sign in again if the issue continues.</Text>
            <CustomButton title="Retry" onPress={this.handleRetry} style={styles.button} />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 240,
  },
});

