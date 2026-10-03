import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';

/**
 * Pick an image from device gallery, crop to square, and compress.
 *
 * Compression specs:
 * - Square crop 1:1
 * - Resized to max 320x320 px (crisp for mobile avatars up to 100px @ 3x density)
 * - Compressed to JPEG at quality 0.7
 * - Returns both clean local uri and lightweight base64 Data URL (~25KB)
 *
 * @returns {Promise<{ uri: string, base64: string } | null>}
 */
export async function pickAndCompressAvatar() {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera roll access is needed to select a custom profile picture.'
        );
        return null;
      }
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return null;
    }

    const rawUri = pickerResult.assets[0].uri;

    // Compress & downscale using ImageManipulator
    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 320, height: 320 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    const base64Data = `data:image/jpeg;base64,${manipulated.base64}`;

    return {
      uri: manipulated.uri,
      base64: base64Data,
    };
  } catch (error) {
    console.error('Error picking and compressing avatar:', error);
    Alert.alert('Error', 'Unable to process profile image. Please try another image.');
    return null;
  }
}

/**
 * Take a photo with device camera, crop to square, and compress.
 *
 * @returns {Promise<{ uri: string, base64: string } | null>}
 */
export async function takeAndCompressAvatar() {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take a profile picture.'
        );
        return null;
      }
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return null;
    }

    const rawUri = pickerResult.assets[0].uri;

    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 320, height: 320 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    const base64Data = `data:image/jpeg;base64,${manipulated.base64}`;

    return {
      uri: manipulated.uri,
      base64: base64Data,
    };
  } catch (error) {
    console.error('Error taking and compressing avatar:', error);
    Alert.alert('Error', 'Unable to capture profile image.');
    return null;
  }
}
