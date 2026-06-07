import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import AppNavigation from './src/navigation/AppNavigation';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initDB } from './src/services/offline-db';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    initDB().catch(error => console.error('Failed to initialize offline database', error));

    const cleanupNotifications = setupNotificationListeners();
    SecureStore.getItemAsync('accessToken')
      .then(token => {
        if (token) return registerForPushNotificationsAsync();
        return null;
      })
      .catch(error => console.error('Failed to register notifications', error));

    return cleanupNotifications;
  }, []);

  return (
    <ErrorBoundary>
      <AppNavigation />
    </ErrorBoundary>
  );
}
