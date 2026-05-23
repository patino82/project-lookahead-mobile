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
          backgroundColor: '#111827', // Matching Cyber Dark theme
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '950',
          textTransform: 'uppercase',
          letterSpacing: 1,
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
            iconName = focused ? 'apps' : 'apps-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Projects" 
        component={ProjectListScreen} 
        options={{ title: 'MISSIONS' }}
      />
      <Tab.Screen 
        name="Today" 
        component={TodayScreen} 
        initialParams={{ projectId }}
        options={{ title: 'KINETIC' }}
      />
      <Tab.Screen 
        name="Logs" 
        component={DailyLogScreen} 
        initialParams={{ projectId }}
        options={{ title: 'CAPTURE' }}
      />
      <Tab.Screen 
        name="Open Items" 
        component={OpenItemsScreen} 
        initialParams={{ projectId }}
        options={{ title: 'DEBT' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        initialParams={{ projectId }}
        options={{ title: 'TIMELINE' }}
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
