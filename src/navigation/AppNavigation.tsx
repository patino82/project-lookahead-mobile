import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Home, Calendar, FileText, AlertCircle, FolderOpen, LayoutGrid, BarChart3, Settings } from 'lucide-react-native';
import { COLORS } from '../constants';
import { amplitude } from '../config/amplitude';

import { LoginScreen } from '../screens/LoginScreen';
import { ProjectListScreen } from '../screens/ProjectListScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { KanbanScreen } from '../screens/KanbanScreen';
import { GanttScreen } from '../screens/GanttScreen';
import { DailyLogScreen } from '../screens/DailyLogScreen';
import { OpenItemsScreen } from '../screens/OpenItemsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, color }: { name: string; color: string }) {
  const size = 22;
  switch (name) {
    case 'Today':
      return <Home size={size} color={color} />;
    case 'Schedule':
      return <Calendar size={size} color={color} />;
    case 'Kanban':
      return <LayoutGrid size={size} color={color} />;
    case 'Gantt':
      return <BarChart3 size={size} color={color} />;
    case 'Logs':
      return <FileText size={size} color={color} />;
    case 'Open Issues':
      return <AlertCircle size={size} color={color} />;
    case 'Documents':
      return <FolderOpen size={size} color={color} />;
    case 'Settings':
      return <Settings size={size} color={color} />;
    case 'Projects':
      return <FolderOpen size={size} color={color} />;
    default:
      return <View style={{ width: size, height: size }} />;
  }
}

function MainTabs({ route }: any) {
  const { projectId } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        initialParams={{ projectId }}
        options={{ title: 'Today' }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        initialParams={{ projectId }}
        options={{ title: 'Schedule' }}
      />
      <Tab.Screen
        name="Kanban"
        component={KanbanScreen}
        initialParams={{ projectId }}
        options={{ title: 'Kanban' }}
      />
      <Tab.Screen
        name="Gantt"
        component={GanttScreen}
        initialParams={{ projectId }}
        options={{ title: 'Gantt' }}
      />
      <Tab.Screen
        name="Logs"
        component={DailyLogScreen}
        initialParams={{ projectId }}
        options={{ title: 'Logs' }}
      />
      <Tab.Screen
        name="Open Issues"
        component={OpenItemsScreen}
        initialParams={{ projectId }}
        options={{ title: 'Open Issues' }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        initialParams={{ projectId }}
        options={{ title: 'Documents' }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectListScreen}
        options={{ title: 'Projects' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  const previousScreen = useRef<string | undefined>(undefined);

  return (
    <NavigationContainer
      onStateChange={(state) => {
        const current = state?.routes[state.index]?.name;
        if (current && current !== previousScreen.current) {
          amplitude.track('Screen Viewed', {
            screen_name: current,
            previous_screen: previousScreen.current ?? null,
          });
          previousScreen.current = current;
        }
      }}
    >
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
