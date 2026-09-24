import React, { useState } from 'react';

import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';


/*
|--------------------------------------------------------------------------
| ACCOUNT CHOOSER SCREEN
|--------------------------------------------------------------------------
*/

const DEFAULT_ACCOUNTS = [
  {
    id: 'ji-young',
    name: 'Ji-young',
    color: '#6B2638',
    initials: 'JY',
  },

  {
    id: 'min-seo',
    name: 'Min-seo',
    color: '#29234D',
    initials: 'MS',
  },

  {
    id: 'daniel',
    name: 'Daniel',
    color: '#19313B',
    initials: 'D',
  },
];


export default function AccountChooserScreen({
  accounts = DEFAULT_ACCOUNTS,
  onSelectAccount,
  onAddProfile,
  onSignIn,
  onManageAccounts,
}) {

  /*
  |--------------------------------------------------------------------------
  | CREATE PROFILE STATE
  |--------------------------------------------------------------------------
  */

  const [showCreateProfile, setShowCreateProfile] =
    useState(false);

  const [profileName, setProfileName] =
    useState('');

  const [profileError, setProfileError] =
    useState('');


  /*
  |--------------------------------------------------------------------------
  | SELECT ACCOUNT
  |--------------------------------------------------------------------------
  */

  const handleSelectAccount = (account) => {

    if (
      typeof onSelectAccount === 'function'
    ) {
      onSelectAccount(account);
    }

  };


  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE PROFILE
  |--------------------------------------------------------------------------
  */

  const handleAddProfile = () => {

    setProfileName('');
    setProfileError('');
    setShowCreateProfile(true);

  };


  /*
  |--------------------------------------------------------------------------
  | CLOSE CREATE PROFILE
  |--------------------------------------------------------------------------
  */

  const handleCancelCreateProfile = () => {

    setProfileName('');
    setProfileError('');
    setShowCreateProfile(false);

  };


  /*
  |--------------------------------------------------------------------------
  | CREATE PROFILE
  |--------------------------------------------------------------------------
  */

  const handleCreateProfile = () => {

    const cleanName =
      String(
        profileName || ''
      ).trim();


    if (!cleanName) {

      setProfileError(
        'Please enter a profile name.'
      );

      return;
    }


    /*
     * Prevent duplicate profile names.
     */

    const duplicate =
      accounts.some(
        (account) =>
          String(
            account?.name || ''
          )
            .trim()
            .toLowerCase() ===
          cleanName.toLowerCase()
      );


    if (duplicate) {

      setProfileError(
        'A profile with this name already exists.'
      );

      return;
    }


    /*
     * Generate initials.
     */

    const initials =
      cleanName
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (part) =>
            part.charAt(0)
        )
        .join('')
        .slice(0, 2)
        .toUpperCase();


    const newProfile = {

      id:
        `profile-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}`,

      name:
        cleanName,

      color:
        '#3A315A',

      initials:
        initials || 'P',

    };


    console.log(
      'AccountChooser: Creating profile:',
      newProfile
    );


    /*
     * Send the new profile to App.js.
     */

    if (
      typeof onAddProfile === 'function'
    ) {

      onAddProfile(
        newProfile
      );

    } else {

      console.error(
        'AccountChooserScreen: onAddProfile is not connected.'
      );

      setProfileError(
        'Unable to create profile.'
      );

      return;
    }


    /*
     * Close form after successful creation.
     */

    setProfileName('');
    setProfileError('');
    setShowCreateProfile(false);

  };


  /*
  |--------------------------------------------------------------------------
  | SIGN IN
  |--------------------------------------------------------------------------
  */

  const handleSignIn = () => {

    if (
      typeof onSignIn === 'function'
    ) {
      onSignIn();
    }

  };


  /*
  |--------------------------------------------------------------------------
  | MANAGE ACCOUNTS
  |--------------------------------------------------------------------------
  */

  const handleManageAccounts = () => {

    if (
      typeof onManageAccounts === 'function'
    ) {
      onManageAccounts();
    }

  };


  return (
    <SafeAreaView style={styles.screen}>

      <View style={styles.container}>

        {/* ================================================================
            TOP BAR
        ================================================================= */}

        <View style={styles.topBar}>

          <Text style={styles.time}>
            9:41
          </Text>

          <View style={styles.statusIcons}>

            <Ionicons
              name="cellular"
              size={12}
              color="#fff"
            />

            <Ionicons
              name="wifi"
              size={12}
              color="#fff"
            />

            <Ionicons
              name="battery-full"
              size={15}
              color="#fff"
            />

          </View>

        </View>


        {/* ================================================================
            LOGO
        ================================================================= */}

        <View style={styles.logoContainer}>

          <Text style={styles.logo}>
            SarangTV
          </Text>

        </View>


        {/* ================================================================
            TITLE
        ================================================================= */}

        <Text style={styles.title}>
          Who's watching?
        </Text>


        {/* ================================================================
            PROFILE GRID
        ================================================================= */}

        <View style={styles.profileGrid}>

          {accounts.map((account) => (

            <Pressable
              key={account.id}
              style={({ pressed, hovered }) => [

                styles.profileItem,

                hovered &&
                  styles.profileHovered,

                pressed &&
                  styles.profilePressed,

              ]}
              onPress={() =>
                handleSelectAccount(account)
              }
              accessibilityRole="button"
              accessibilityLabel={
                `Select ${account.name}`
              }
            >

              {/* PROFILE AVATAR */}

              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor:
                      account.color,
                  },
                ]}
              >

                <Text style={styles.avatarInitials}>
                  {account.initials}
                </Text>

              </View>


              {/* PROFILE NAME */}

              <Text
                style={styles.profileName}
                numberOfLines={1}
              >
                {account.name}
              </Text>

            </Pressable>

          ))}


          {/* ==============================================================
              ADD PROFILE
          ============================================================== */}

          {!showCreateProfile && (

            <Pressable
              style={({ pressed, hovered }) => [

                styles.profileItem,

                hovered &&
                  styles.profileHovered,

                pressed &&
                  styles.profilePressed,

              ]}
              onPress={handleAddProfile}
              accessibilityRole="button"
              accessibilityLabel="Add Profile"
            >

              <View
                style={[
                  styles.addProfileCircle,

                  styles.addProfileCircleDefault,
                ]}
              >

                <Ionicons
                  name="add"
                  size={31}
                  color="#D7D4DC"
                />

              </View>

              <Text style={styles.profileName}>
                Add Profile
              </Text>

            </Pressable>

          )}

        </View>


        {/* ================================================================
            CREATE PROFILE FORM
        ================================================================= */}

        {showCreateProfile && (

          <View style={styles.createProfileCard}>

            <View style={styles.createProfileHeader}>

              <Text style={styles.createProfileTitle}>
                Create Profile
              </Text>

              <Pressable
                onPress={
                  handleCancelCreateProfile
                }
                hitSlop={8}
                style={({ pressed, hovered }) => [

                  styles.closeButton,

                  hovered &&
                    styles.closeButtonHovered,

                  pressed &&
                    styles.closeButtonPressed,

                ]}
                accessibilityRole="button"
                accessibilityLabel="Close create profile"
              >

                <Ionicons
                  name="close"
                  size={16}
                  color={colors.muted}
                />

              </Pressable>

            </View>


            <Text style={styles.createProfileSubtitle}>
              Enter a name for your new profile.
            </Text>


            <TextInput
              value={profileName}
              onChangeText={(value) => {

                setProfileName(value);

                if (profileError) {
                  setProfileError('');
                }

              }}
              placeholder="Profile name"
              placeholderTextColor="#666370"
              style={styles.profileInput}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={
                handleCreateProfile
              }
              maxLength={24}
            />


            {profileError !== '' && (

              <Text style={styles.profileError}>
                {profileError}
              </Text>

            )}


            <View style={styles.createProfileActions}>

              <Pressable
                onPress={
                  handleCancelCreateProfile
                }
                style={({ pressed, hovered }) => [

                  styles.cancelCreateButton,

                  hovered &&
                    styles.cancelCreateHovered,

                  pressed &&
                    styles.cancelCreatePressed,

                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >

                <Text style={styles.cancelCreateText}>
                  Cancel
                </Text>

              </Pressable>


              <Pressable
                onPress={
                  handleCreateProfile
                }
                style={({ pressed, hovered }) => [

                  styles.createButton,

                  hovered &&
                    styles.createButtonHovered,

                  pressed &&
                    styles.createButtonPressed,

                ]}
                accessibilityRole="button"
                accessibilityLabel="Create profile"
              >

                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#fff"
                />

                <Text style={styles.createButtonText}>
                  Create Profile
                </Text>

              </Pressable>

            </View>

          </View>

        )}


        {/* ================================================================
            SIGN IN WITH ANOTHER ACCOUNT
        ================================================================= */}

        {!showCreateProfile && (

          <Pressable
            style={({ pressed, hovered }) => [

              styles.signInButton,

              hovered &&
                styles.signInHovered,

              pressed &&
                styles.signInPressed,

            ]}
            onPress={handleSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in with another account"
          >

            <Ionicons
              name="person-add-outline"
              size={16}
              color={colors.text}
            />

            <Text style={styles.signInText}>
              Sign in with another account
            </Text>

          </Pressable>

        )}


        {/* ================================================================
            MANAGE ACCOUNTS
        ================================================================= */}

        {!showCreateProfile && (

          <Pressable
            style={({ pressed, hovered }) => [

              styles.manageButton,

              hovered &&
                styles.manageHovered,

              pressed &&
                styles.managePressed,

            ]}
            onPress={handleManageAccounts}
            accessibilityRole="button"
            accessibilityLabel="Manage Accounts"
          >

            <Text style={styles.manageText}>
              Manage Accounts
            </Text>

          </Pressable>

        )}


        {/* ================================================================
            BOTTOM BRANDING
        ================================================================= */}

        <View style={styles.bottomArea}>

          <View style={styles.bottomLine} />

          <Text style={styles.bottomText}>
            SarangTV
          </Text>

        </View>

      </View>

    </SafeAreaView>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

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
    paddingHorizontal: 15,
    backgroundColor: '#07070E',
  },


  /*
   * TOP BAR
   */

  topBar: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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


  /*
   * LOGO
   */

  logoContainer: {
    alignItems: 'center',
    marginTop: 24,
  },


  logo: {
    color: colors.redBright,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },


  /*
   * TITLE
   */

  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },


  /*
   * PROFILE GRID
   */

  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    columnGap: 15,
    rowGap: 22,
  },


  profileItem: {
    width: 74,
    alignItems: 'center',
    borderRadius: 9,
    paddingVertical: 2,
  },


  profileHovered: {
    opacity: 0.85,
    transform: [
      {
        scale: 1.025,
      },
    ],
  },


  profilePressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },


  /*
   * AVATAR
   */

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },


  avatarInitials: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 19,
    opacity: 0.9,
  },


  /*
   * PROFILE NAME
   */

  profileName: {
    color: '#E9E6ED',
    fontSize: 8.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },


  /*
   * ADD PROFILE
   */

  addProfileCircle: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },


  addProfileCircleDefault: {
    backgroundColor: '#11111B',
    borderColor: 'rgba(255,255,255,0.08)',
  },


  /*
   * CREATE PROFILE CARD
   */

  createProfileCard: {
    width: '100%',
    marginTop: 28,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },


  createProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  createProfileTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },


  createProfileSubtitle: {
    color: colors.muted,
    fontSize: 8,
    marginTop: 4,
    marginBottom: 12,
  },


  closeButton: {
    width: 25,
    height: 25,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },


  closeButtonHovered: {
    backgroundColor: colors.panel2,
    opacity: 0.9,
  },


  closeButtonPressed: {
    opacity: 0.55,
    transform: [
      {
        scale: 0.9,
      },
    ],
  },


  profileInput: {
    width: '100%',
    height: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#0C0C14',
    color: colors.text,
    fontSize: 9,
    paddingHorizontal: 11,
    paddingVertical: 0,
  },


  profileError: {
    color: colors.redBright,
    fontSize: 7.5,
    marginTop: 6,
  },


  createProfileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 7,
  },


  cancelCreateButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },


  cancelCreateHovered: {
    backgroundColor: colors.panel2,
  },


  cancelCreatePressed: {
    opacity: 0.55,
  },


  cancelCreateText: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
  },


  createButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 7,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },


  createButtonHovered: {
    opacity: 0.9,
    transform: [
      {
        scale: 1.015,
      },
    ],
  },


  createButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  createButtonText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },


  /*
   * SIGN IN
   */

  signInButton: {
    height: 39,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: '#11111B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 31,
  },


  signInHovered: {
    backgroundColor: '#171722',
    borderColor: 'rgba(255,255,255,0.20)',
  },


  signInPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  signInText: {
    color: colors.text,
    fontSize: 8.5,
    fontWeight: '600',
    marginLeft: 7,
  },


  /*
   * MANAGE ACCOUNTS
   */

  manageButton: {
    alignSelf: 'center',
    marginTop: 17,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },


  manageHovered: {
    backgroundColor: '#11111B',
  },


  managePressed: {
    opacity: 0.55,
  },


  manageText: {
    color: '#8D8B98',
    fontSize: 8,
    fontWeight: '600',
  },


  /*
   * BOTTOM
   */

  bottomArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 17,
  },


  bottomLine: {
    width: 34,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#36343D',
    marginBottom: 8,
  },


  bottomText: {
    color: '#55525E',
    fontSize: 7,
    fontWeight: '700',
  },

});