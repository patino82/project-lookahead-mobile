import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { amplitude } from '../config/amplitude';

import { LoginScreen } from '../screens/LoginScreen';
import { ProjectListScreen } from '../screens/ProjectListScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { DailyLogScreen } from '../screens/DailyLogScreen';
import { OpenItemsScreen } from '../screens/OpenItemsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ route }: any) {
  const { projectId } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Today') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Logs') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Open Items') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Projects') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Docs') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Projects" 
        component={ProjectListScreen} 
        options={{ title: 'Portfolios' }}
      />
      <Tab.Screen 
        name="Today" 
        component={TodayScreen} 
        initialParams={{ projectId }}
        options={{ title: 'Kinetic' }}
      />
      <Tab.Screen 
        name="Logs" 
        component={DailyLogScreen} 
        initialParams={{ projectId }}
        options={{ title: 'Capture' }}
      />
      <Tab.Screen 
        name="Open Items" 
        component={OpenItemsScreen} 
        initialParams={{ projectId }}
        options={{ title: 'Blockers' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        initialParams={{ projectId }}
        options={{ title: 'Timeline' }}
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
