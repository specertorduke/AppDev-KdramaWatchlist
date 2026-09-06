import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function AccountChooserScreen({ navigation }) {
  const { user, savedAccounts, switchAccount, removeSavedAccount, closeAccountChooser, isChoosingAccount } = useAuth();
  const [isManaging, setIsManaging] = useState(false);

  const handleSelectAccount = async (account) => {
    if (isManaging) return;

    if (account.token && account.user) {
      const res = await switchAccount(account);
      if (res?.success) {
        return;
      }
    }

    // If no token or token switch failed, navigate to login with email pre-filled
    if (navigation) {
      navigation.navigate('Login', {
        email: account.email,
        message: `Welcome back, ${account.name}! Please enter your password.`,
      });
    }
  };

  const handleRemoveAccount = (account) => {
    const confirmDelete = () => {
      removeSavedAccount(account.id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove saved login for "${account.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Remove Account',
        `Are you sure you want to remove the saved account for ${account.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleSignInAnother = () => {
    closeAccountChooser();
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  const handleBackToApp = () => {
    closeAccountChooser();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* TOP STATUS BAR */}
        <View style={styles.topBar}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.topBarRight}>
            {user && isChoosingAccount && (
              <Pressable
                style={styles.closeBtn}
                onPress={handleBackToApp}
                accessibilityRole="button"
                accessibilityLabel="Back to App"
              >
                <Ionicons name="close" size={16} color="#fff" />
              </Pressable>
            )}
            <View style={styles.statusIcons}>
              <Ionicons name="cellular" size={12} color="#fff" />
              <Ionicons name="wifi" size={12} color="#fff" />
              <Ionicons name="battery-full" size={15} color="#fff" />
            </View>
          </View>
        </View>

        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>SarangTV</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>Who's tracking today?</Text>
        <Text style={styles.subtitle}>Pick your profile to jump back into your watchlist</Text>

        {/* PROFILE GRID */}
        <View style={styles.profileGrid}>
          {savedAccounts.map((account) => (
            <View key={account.id} style={styles.profileWrapper}>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.profileItem,
                  hovered && styles.profileHovered,
                  pressed && styles.profilePressed,
                ]}
                onPress={() => handleSelectAccount(account)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${account.name}`}
              >
                {/* PROFILE AVATAR */}
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: account.color || '#6B2638' },
                  ]}
                >
                  <Text style={styles.avatarInitials}>
                    {account.initials || 'U'}
                  </Text>
                </View>

                {/* PROFILE NAME */}
                <Text style={styles.profileName} numberOfLines={1}>
                  {account.name}
                </Text>
              </Pressable>

              {/* REMOVE BADGE WHEN MANAGING */}
              {isManaging && (
                <Pressable
                  style={styles.removeBadge}
                  onPress={() => handleRemoveAccount(account)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${account.name}`}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              )}
            </View>
          ))}

          {/* ADD / SIGN IN ANOTHER PROFILE */}
          <Pressable
            style={({ pressed, hovered }) => [
              styles.profileItem,
              hovered && styles.profileHovered,
              pressed && styles.profilePressed,
            ]}
            onPress={handleSignInAnother}
            accessibilityRole="button"
            accessibilityLabel="Add Account"
          >
            <View style={styles.addProfileCircle}>
              <Ionicons name="add" size={31} color="#D7D4DC" />
            </View>
            <Text style={styles.profileName}>Add Account</Text>
          </Pressable>
        </View>

        {/* SIGN IN WITH ANOTHER ACCOUNT BUTTON */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.signInButton,
            hovered && styles.signInHovered,
            pressed && styles.signInPressed,
          ]}
          onPress={handleSignInAnother}
          accessibilityRole="button"
          accessibilityLabel="Sign in with another account"
        >
          <Ionicons name="person-add-outline" size={16} color={colors.text} />
          <Text style={styles.signInText}>Sign in with another account</Text>
        </Pressable>

        {/* MANAGE ACCOUNTS BUTTON */}
        {savedAccounts.length > 0 && (
          <Pressable
            style={({ pressed, hovered }) => [
              styles.manageButton,
              hovered && styles.manageHovered,
              pressed && styles.managePressed,
            ]}
            onPress={() => setIsManaging(!isManaging)}
            accessibilityRole="button"
            accessibilityLabel={isManaging ? 'Done Managing' : 'Manage Accounts'}
          >
            <Text style={styles.manageText}>
              {isManaging ? 'Done' : 'Manage Accounts'}
            </Text>
          </Pressable>
        )}

        {/* BOTTOM BRANDING */}
        <View style={styles.bottomArea}>
          <View style={styles.bottomLine} />
          <Text style={styles.bottomText}>SarangTV</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07070E',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#07070E',
  },
  topBar: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  time: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 36,
  },
  logo: {
    color: colors.redBright,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
  },
  subtitle: {
    color: '#8E8B98',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 28,
    columnGap: 18,
    rowGap: 24,
  },
  profileWrapper: {
    position: 'relative',
  },
  profileItem: {
    width: 76,
    alignItems: 'center',
    borderRadius: 9,
    paddingVertical: 2,
  },
  profileHovered: {
    opacity: 0.85,
    transform: [{ scale: 1.03 }],
  },
  profilePressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    opacity: 0.95,
  },
  profileName: {
    color: '#E9E6ED',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 76,
  },
  removeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8213F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#07070E',
    zIndex: 10,
  },
  addProfileCircle: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11111B',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 40,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  signInHovered: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  signInPressed: {
    opacity: 0.7,
  },
  signInText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  manageButton: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  manageHovered: {
    opacity: 0.8,
  },
  managePressed: {
    opacity: 0.6,
  },
  manageText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1,
    marginBottom: 8,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
