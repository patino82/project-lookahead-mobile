import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from './api';

const PUSH_TOKEN_KEY = 'pushToken';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function areNotificationsEnabled() {
  return (await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY)) === 'true';
}

export async function setNotificationsEnabled(enabled: boolean) {
  if (enabled) {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
  } else {
    await AsyncStorage.removeItem(NOTIFICATIONS_ENABLED_KEY);
  }
}

export async function registerForPushNotificationsAsync() {
  if (!(await areNotificationsEnabled())) return null;
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
  await sendTokenToServer(token.data);
  return token.data;
}

export async function sendTokenToServer(token: string) {
  try {
    await apiFetch('/api/mobile/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  }
}

export function setupNotificationListeners() {
  const receivedSubscription = Notifications.addNotificationReceivedListener(() => {});
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {});

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

export async function scheduleTaskDueReminder(taskId: string, title: string, dueDate: string) {
  const reminderDate = new Date(`${dueDate.slice(0, 10)}T09:00:00`);
  reminderDate.setDate(reminderDate.getDate() - 1);
  if (reminderDate.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task due tomorrow',
      body: title,
      data: { taskId, type: 'task-due' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

export async function scheduleDailyLogReminder() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily log reminder',
      body: "Capture today's field report.",
      data: { type: 'daily-log' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

export async function scheduleOpenItemFollowUp(itemId: string, description: string, followUpDate: string) {
  const reminderDate = new Date(`${followUpDate.slice(0, 10)}T09:00:00`);
  if (reminderDate.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Open item follow-up',
      body: description,
      data: { itemId, type: 'open-item-follow-up' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}
