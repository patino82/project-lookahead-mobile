import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';

export type ProjectRouteParams = {
  projectId?: string;
};

export type MainTabParamList = {
  Projects: undefined;
  Today: ProjectRouteParams | undefined;
  Logs: ProjectRouteParams | undefined;
  'Open Items': ProjectRouteParams | undefined;
  Schedule: ProjectRouteParams | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;
export type MainTabsScreenProps = StackScreenProps<RootStackParamList, 'MainTabs'>;
export type ProjectListScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Projects'>,
  StackScreenProps<RootStackParamList>
>;
