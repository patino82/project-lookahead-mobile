import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tab.Screen 
        name="Today" 
        component={TodayScreen} 
        initialParams={{ projectId }}
      />
      <Tab.Screen 
        name="Logs" 
        component={DailyLogScreen} 
        initialParams={{ projectId }}
      />
      <Tab.Screen 
        name="Open Items" 
        component={OpenItemsScreen} 
        initialParams={{ projectId }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        initialParams={{ projectId }}
      />
      <Tab.Screen 
        name="Docs" 
        component={DocumentsScreen} 
        initialParams={{ projectId }}
      />
      <Tab.Screen name="Projects" component={ProjectListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
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
