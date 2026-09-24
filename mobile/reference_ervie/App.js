import '@expo/metro-runtime';

import React from 'react';

import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from './src/theme';

import MobileNav from './src/components/Mobilenav';

import HomeScreen from './src/screens/HomeScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import TrackerScreen from './src/screens/TrackerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DramaDetailScreen from './src/screens/DramaDetailScreen';
import AddDramaScreen from './src/screens/AddDramaScreen';
import AccountChooserScreen from './src/screens/AccountChooserScreen';

import { dramas } from './src/data/dramas';


/*
|--------------------------------------------------------------------------
| ERROR BOUNDARY
|--------------------------------------------------------------------------
*/

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error(
      'SarangTV render error:',
      error,
      info
    );
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorScreen}>

          <Text style={styles.errorTitle}>
            SarangTV could not render
          </Text>

          <Text style={styles.errorText}>
            {String(
              this.state.error?.message ||
              this.state.error
            )}
          </Text>

          <Text style={styles.errorHint}>
            Check the browser console for the full error.
          </Text>

        </View>
      );
    }

    return this.props.children;
  }
}


/*
|--------------------------------------------------------------------------
| MAIN APP
|--------------------------------------------------------------------------
*/

export default function App() {

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  const [page, setPage] =
    React.useState('home');


  /*
  |--------------------------------------------------------------------------
  | SELECTED DRAMA
  |--------------------------------------------------------------------------
  */

  const [selectedDrama, setSelectedDrama] =
    React.useState(null);


  /*
  |--------------------------------------------------------------------------
  | CUSTOM / ADDED DRAMAS
  |--------------------------------------------------------------------------
  */

  const [addedDramas, setAddedDramas] =
    React.useState([]);


  /*
  |--------------------------------------------------------------------------
  | FAVORITES
  |--------------------------------------------------------------------------
  */

  const [favoriteIds, setFavoriteIds] =
    React.useState([]);


  /*
  |--------------------------------------------------------------------------
  | TRACKER
  |--------------------------------------------------------------------------
  */

  const [trackerState, setTrackerState] =
    React.useState(() => {

      const initial = {};

      dramas
        .slice(0, 4)
        .forEach((drama, index) => {

          const defaults = [

            {
              status: 'Watching',
              watchedEpisodes: 3,
              rating: 9,
              notes:
                'Love the chemistry between the leads!',
            },

            {
              status: 'Plan to Watch',
              watchedEpisodes: 0,
              rating: 0,
              notes: '',
            },

            {
              status: 'Completed',
              watchedEpisodes:
                drama.episodes || 12,
              rating: 10,
              notes:
                'Best mystery of 2025. Cried at the finale.',
            },

            {
              status: 'On Hold',
              watchedEpisodes: 3,
              rating: 0,
              notes:
                'Cute but need to be in the right mood.',
            },

          ];

          initial[drama.id] =
            defaults[index];
        });

      return initial;
    });


  /*
  |--------------------------------------------------------------------------
  | ACCOUNTS
  |--------------------------------------------------------------------------
  |
  | These are the profiles shown in AccountChooserScreen.
  |
  */

  const [accounts, setAccounts] =
    React.useState([
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
    ]);


  /*
  |--------------------------------------------------------------------------
  | ADD DRAMA
  |--------------------------------------------------------------------------
  */

  const handleAddDrama =
    React.useCallback((drama) => {

      console.log(
        'handleAddDrama CALLED:',
        drama
      );

      if (
        !drama ||
        typeof drama !== 'object'
      ) {
        console.error(
          'Invalid drama:',
          drama
        );

        return false;
      }

      const dramaId =
        drama.id ||
        `custom-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;

      const dramaToAdd = {
        ...drama,
        id: dramaId,
      };

      setAddedDramas((current) => {

        const newTitle =
          String(
            dramaToAdd.title || ''
          )
            .trim()
            .toLowerCase();

        const duplicate =
          current.some((item) => {

            const existingTitle =
              String(
                item?.title || ''
              )
                .trim()
                .toLowerCase();

            return (
              item?.id === dramaId ||
              (
                newTitle &&
                existingTitle === newTitle
              )
            );
          });

        if (duplicate) {
          console.log(
            'Drama already exists:',
            dramaToAdd.title
          );

          return current;
        }

        console.log(
          'ADDING TO TRACKER:',
          dramaToAdd
        );

        return [
          ...current,
          dramaToAdd,
        ];
      });


      setTrackerState((current) => {

        if (
          Object.prototype.hasOwnProperty.call(
            current,
            dramaId
          )
        ) {
          return current;
        }

        return {
          ...current,

          [dramaId]: {
            status: 'Plan to Watch',
            watchedEpisodes: 0,
            rating: 0,
            notes: '',
          },
        };
      });


      setSelectedDrama(null);
      setPage('tracker');

      return true;

    }, []);


  /*
  |--------------------------------------------------------------------------
  | REMOVE DRAMA
  |--------------------------------------------------------------------------
  */

  const handleRemoveDrama =
    React.useCallback((dramaId) => {

      if (!dramaId) {
        return;
      }

      setAddedDramas((current) =>
        current.filter(
          (drama) =>
            drama?.id !== dramaId
        )
      );

      setTrackerState((current) => {

        const next = {
          ...current,
        };

        delete next[dramaId];

        return next;
      });

      setFavoriteIds((current) =>
        current.filter(
          (id) =>
            id !== dramaId
        )
      );

    }, []);


  /*
  |--------------------------------------------------------------------------
  | FAVORITE
  |--------------------------------------------------------------------------
  */

  const toggleFavorite =
    React.useCallback((drama) => {

      if (!drama?.id) {
        return;
      }

      setFavoriteIds((current) => {

        if (
          current.includes(drama.id)
        ) {
          return current.filter(
            (id) =>
              id !== drama.id
          );
        }

        return [
          ...current,
          drama.id,
        ];

      });

    }, []);


  /*
  |--------------------------------------------------------------------------
  | UPDATE TRACKER
  |--------------------------------------------------------------------------
  */

  const updateDramaTracker =
    React.useCallback(
      (dramaId, updates) => {

        if (!dramaId) {
          return;
        }

        setTrackerState((current) => {

          const existing =
            current[dramaId] || {
              status: 'Plan to Watch',
              watchedEpisodes: 0,
              rating: 0,
              notes: '',
            };

          return {
            ...current,

            [dramaId]: {
              ...existing,
              ...(updates || {}),
            },
          };

        });

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | OPEN DRAMA
  |--------------------------------------------------------------------------
  */

  const openDrama =
    React.useCallback((drama) => {

      if (!drama) {
        return;
      }

      setSelectedDrama(drama);

    }, []);


  /*
  |--------------------------------------------------------------------------
  | CLOSE DRAMA
  |--------------------------------------------------------------------------
  */

  const closeDrama =
    React.useCallback(() => {

      setSelectedDrama(null);

    }, []);


  /*
  |--------------------------------------------------------------------------
  | NORMAL NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleNavigation =
    React.useCallback((id) => {

      if (!id) {
        return;
      }

      setSelectedDrama(null);
      setPage(id);

    }, []);


  /*
  |--------------------------------------------------------------------------
  | SIGN OUT
  |--------------------------------------------------------------------------
  */

  const handleSignOut =
    React.useCallback(() => {

      console.log(
        'App: User signed out'
      );

      setSelectedDrama(null);
      setPage('accountChooser');

    }, []);


  /*
  |--------------------------------------------------------------------------
  | ACCOUNT SELECTED
  |--------------------------------------------------------------------------
  */

  const handleAccountSelected =
    React.useCallback((account) => {

      console.log(
        'App: Account selected:',
        account
      );

      setSelectedDrama(null);

      setPage('home');

    }, []);


  /*
  |--------------------------------------------------------------------------
  | ADD PROFILE
  |--------------------------------------------------------------------------
  |
  | This is the function that was missing.
  |
  | AccountChooserScreen calls this after the user
  | creates a new profile.
  |
  */

  const handleAddProfile =
    React.useCallback((profile) => {

      if (
        !profile ||
        typeof profile !== 'object'
      ) {
        console.error(
          'App: Invalid profile received:',
          profile
        );

        return;
      }

      const name =
        String(
          profile.name || ''
        ).trim();

      if (!name) {
        return;
      }

      const profileId =
        profile.id ||
        `profile-${Date.now()}`;

      const newProfile = {
        id: profileId,

        name,

        color:
          profile.color ||
          '#3A315A',

        initials:
          profile.initials ||
          name
            .split(/\s+/)
            .map((part) =>
              part.charAt(0)
            )
            .join('')
            .slice(0, 2)
            .toUpperCase(),
      };

      console.log(
        'App: Adding new profile:',
        newProfile
      );

      setAccounts((current) => {

        const duplicate =
          current.some(
            (account) =>
              String(
                account?.name || ''
              )
                .trim()
                .toLowerCase() ===
              name.toLowerCase()
          );

        if (duplicate) {
          console.log(
            'App: Profile already exists:',
            name
          );

          return current;
        }

        return [
          ...current,
          newProfile,
        ];
      });

    }, []);


  /*
  |--------------------------------------------------------------------------
  | RENDER PAGE
  |--------------------------------------------------------------------------
  */

  const renderPage = () => {

    /*
     * DRAMA DETAIL
     */

    if (selectedDrama) {

      return (
        <DramaDetailScreen

          drama={
            selectedDrama
          }

          onBack={
            closeDrama
          }

          isFavorite={
            favoriteIds.includes(
              selectedDrama.id
            )
          }

          onToggleFavorite={() =>
            toggleFavorite(
              selectedDrama
            )
          }

          trackerData={
            trackerState[
              selectedDrama.id
            ] || {
              status: 'Plan to Watch',
              watchedEpisodes: 0,
              rating: 0,
              notes: '',
            }
          }

          onUpdateTracker={(updates) =>
            updateDramaTracker(
              selectedDrama.id,
              updates
            )
          }

          onAddDrama={
            handleAddDrama
          }

          onRemoveDrama={
            handleRemoveDrama
          }

          isAdded={
            addedDramas.some(
              (drama) =>
                drama?.id ===
                selectedDrama.id
            )
          }

        />
      );
    }


    /*
     * NORMAL PAGES
     */

    switch (page) {

      /*
       * HOME
       */

      case 'home':

        return (
          <HomeScreen
            onOpenDrama={
              openDrama
            }
            onNavigate={
              handleNavigation
            }
          />
        );


      /*
       * DISCOVER
       */

      case 'discover':

        return (
          <DiscoverScreen
            onOpenDrama={
              openDrama
            }
          />
        );


      /*
       * TRACKER
       */

      case 'tracker':

        return (
          <TrackerScreen

            onOpenDrama={
              openDrama
            }

            addedDramas={
              addedDramas
            }

            favoriteIds={
              favoriteIds
            }

            trackerState={
              trackerState
            }

            onUpdateTracker={
              updateDramaTracker
            }

            onRemoveDrama={
              handleRemoveDrama
            }

            onNavigate={
              handleNavigation
            }

          />
        );


      /*
       * PROFILE
       */

      case 'profile':

        return (
          <ProfileScreen

            onNavigate={
              handleNavigation
            }

            onSignOut={
              handleSignOut
            }

          />
        );


      /*
       * STATS
       */

      case 'stats':

        return (
          <StatsScreen

            addedDramas={
              addedDramas
            }

            trackerState={
              trackerState
            }

            favoriteIds={
              favoriteIds
            }

            onNavigate={
              handleNavigation
            }

          />
        );


      /*
       * SETTINGS
       */

      case 'settings':

        return (
          <SettingsScreen

            onNavigate={
              handleNavigation
            }

          />
        );


      /*
       * ADD DRAMA
       */

      case 'add-drama':

        return (
          <AddDramaScreen

            addedDramas={
              addedDramas
            }

            onAddDrama={
              handleAddDrama
            }

            onBack={() => {

              setSelectedDrama(null);
              setPage('tracker');

            }}

          />
        );


      /*
       * ACCOUNT CHOOSER
       */

      case 'accountChooser':

        return (
          <AccountChooserScreen

            accounts={
              accounts
            }

            onSelectAccount={
              handleAccountSelected
            }

            onAddProfile={
              handleAddProfile
            }

          />
        );


      /*
       * FALLBACK
       */

      default:

        return (
          <HomeScreen

            onOpenDrama={
              openDrama
            }

            onNavigate={
              handleNavigation
            }

          />
        );
    }
  };


  /*
  |--------------------------------------------------------------------------
  | BOTTOM NAVIGATION
  |--------------------------------------------------------------------------
  */

  const showBottomNav =
    !selectedDrama &&
    page !== 'add-drama' &&
    page !== 'accountChooser';


  const activePage =
    selectedDrama
      ? null
      : page;


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <AppErrorBoundary>

      <SafeAreaProvider>

        <View style={styles.root}>

          <StatusBar
            style="light"
            backgroundColor={
              colors.bg
            }
          />

          <View style={styles.mobileFrame}>

            <View style={styles.main}>
              {renderPage()}
            </View>

            {showBottomNav && (

              <MobileNav

                active={
                  activePage
                }

                onNavigate={
                  handleNavigation
                }

              />

            )}

          </View>

        </View>

      </SafeAreaProvider>

    </AppErrorBoundary>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({

  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
    alignItems: 'center',
  },

  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth:
      Platform.OS === 'web'
        ? 430
        : undefined,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },

  main: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    backgroundColor: colors.bg,
  },

  errorScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#07070E',
    padding: 24,
    justifyContent: 'center',
  },

  errorTitle: {
    color: '#E8213F',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },

  errorText: {
    color: '#F0EEE8',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },

  errorHint: {
    color: '#8D8B98',
    fontSize: 12,
    lineHeight: 18,
  },

});