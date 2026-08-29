import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Annyeonghaseyo 👋</Text>
        <Text style={styles.subgreeting}>Here is your K-Drama daily roundup</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎬 Continue Watching</Text>
        <Text style={styles.cardSubtitle}>You have 3 ongoing series in progress.</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Tracker')}
        >
          <Text style={styles.actionButtonText}>View Watchlist</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  greeting: {
    ...typography.h1,
  },
  subgreeting: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.white,
  },
});
