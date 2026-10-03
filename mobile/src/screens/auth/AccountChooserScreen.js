import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Alert,
  Image,
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
        {/* TOP BAR */}
        <View style={styles.topBar}>
          {user && isChoosingAccount ? (
            <Pressable
              style={styles.closeBtn}
              onPress={handleBackToApp}
              accessibilityRole="button"
              accessibilityLabel="Back to App"
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/sarangtv-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logo}>
            Sarang<Text style={styles.logoTv}>TV</Text>
          </Text>
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
                  {account.avatar_url ? (
                    <Image
                      source={{ uri: account.avatar_url }}
                      style={styles.avatarPhoto}
                      resizeMode="cover"
                    />
                  ) : account.avatarIcon ? (
                    <Ionicons name={account.avatarIcon} size={34} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.avatarInitials}>
                      {account.initials || 'U'}
                    </Text>
                  )}
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
          <Text style={styles.bottomText}>Sarang<Text style={{ color: '#eb5b78' }}>TV</Text></Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080808',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#080808',
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  logo: {
    color: '#ed8ea4',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  logoTv: {
    color: '#eb5b78',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    color: '#8E8B98',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 36,
    columnGap: 24,
    rowGap: 28,
  },
  profileWrapper: {
    position: 'relative',
  },
  profileItem: {
    width: 90,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 4,
  },
  profileHovered: {
    opacity: 0.9,
    transform: [{ scale: 1.04 }],
  },
  profilePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    opacity: 0.95,
  },
  profileName: {
    color: '#E9E6ED',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 90,
  },
  removeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8213F',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  addProfileCircle: {
    width: 84,
    height: 84,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161424',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#161424',
    marginTop: 44,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  signInHovered: {
    backgroundColor: '#1E1B30',
  },
  signInPressed: {
    opacity: 0.75,
  },
  signInText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  manageButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  manageHovered: {
    opacity: 0.8,
  },
  managePressed: {
    opacity: 0.6,
  },
  manageText: {
    color: colors.muted,
    fontSize: 14,
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
    width: 44,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    marginBottom: 8,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
