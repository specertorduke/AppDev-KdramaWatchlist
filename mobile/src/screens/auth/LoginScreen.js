import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const handleMockLogin = () => {
    login({ id: 1, name: 'K-Drama Fan', email: 'user@example.com' }, 'mock-token-123');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SarangTV</Text>
      <Text style={styles.subtitle}>Track your favorite K-Dramas anywhere</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleMockLogin}>
        <Text style={styles.buttonText}>Quick Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.secondaryButtonText}>Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
