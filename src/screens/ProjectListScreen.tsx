import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { Project } from '../types';

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Downtown Plaza', location: 'NYC', status: 'active', lastUpdated: '2026-05-19' },
  { id: '2', name: 'Westside Bridge', location: 'SF', status: 'active', lastUpdated: '2026-05-18' },
  { id: '3', name: 'East Lake Residences', location: 'Miami', status: 'on-hold', lastUpdated: '2026-05-15' },
  { id: '4', name: 'North Port Terminal', location: 'Seattle', status: 'completed', lastUpdated: '2026-04-20' },
];

interface ProjectListScreenProps {
  navigation: any;
}

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation }) => {
  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('Today', { projectId: item.id })}
    >
      <Card title={item.name}>
        <Text style={styles.locationText}>{item.location}</Text>
        <Text style={styles.statusText}>Status: {item.status}</Text>
        <Text style={styles.dateText}>Last Updated: {item.lastUpdated}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Projects</Text>
      <FlatList
        data={MOCK_PROJECTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: SPACING.lg,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  itemContainer: {
    marginBottom: SPACING.sm,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
