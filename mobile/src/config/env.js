import { Platform } from 'react-native';

// For Android emulator: 10.0.2.2 points to host machine
// For iOS simulator / Web: localhost
// For physical devices: Replace with your local LAN IP (e.g. 192.168.1.X)
export const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});
