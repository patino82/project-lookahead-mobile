import React from 'react';
import AppNavigation from './src/navigation/AppNavigation';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppNavigation />
    </ErrorBoundary>
  );
}
