import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AlertCircle, Calendar, FileText, LayoutGrid, Zap } from 'lucide-react-native';
import { COLORS } from '../constants';
import { amplitude } from '../config/amplitude';
import { navigationRef } from './RootNavigation';
import type { MainTabsScreenProps, MainTabParamList, RootStackParamList } from './types';

import { LoginScreen } from '../screens/LoginScreen';
import { ProjectListScreen } from '../screens/ProjectListScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { DailyLogScreen } from '../screens/DailyLogScreen';
import { OpenItemsScreen } from '../screens/OpenItemsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs({ route }: MainTabsScreenProps) {
  const projectId = route.params?.params && 'projectId' in route.params.params
    ? route.params.params.projectId
    : undefined;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Today') {
            return <Zap size={size} color={color} fill={focused ? color : 'transparent'} />;
          }
          if (route.name === 'Logs') {
            return <FileText size={size} color={color} fill={focused ? color : 'transparent'} />;
          }
          if (route.name === 'Open Items') {
            return <AlertCircle size={size} color={color} fill={focused ? color : 'transparent'} />;
          }
          if (route.name === 'Schedule') {
            return <Calendar size={size} color={color} fill={focused ? color : 'transparent'} />;
          }

          return <LayoutGrid size={size} color={color} fill={focused ? color : 'transparent'} />;
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
      ref={navigationRef}
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
