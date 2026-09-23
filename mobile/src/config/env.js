import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the API base URL.
 * - On Web: http://localhost:8000/api/v1
 * - On Physical Device / Expo Go: Auto-detects host machine's Wi-Fi IP from Expo's Metro bundler connection
 * - Fallbacks: Configured LAN IP (192.168.254.108) or emulator loopback
 */
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }

  // Auto-detect host IP from Expo Metro bundler connection (works automatically for physical iOS & Android devices)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
  const hostIp = hostUri.split(':')[0];

  if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
    return `http://${hostIp}:8000/api/v1`;
  }

  // Default fallback for physical device on your LAN
  const LAN_IP = '192.168.254.108';

  return Platform.select({
    android: `http://${LAN_IP}:8000/api/v1`,
    ios: `http://${LAN_IP}:8000/api/v1`,
    default: `http://${LAN_IP}:8000/api/v1`,
  });
};

export const DEFAULT_API_BASE_URL = getApiBaseUrl();

