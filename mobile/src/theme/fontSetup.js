import { StyleSheet, Platform } from 'react-native';

export const FONT_MAP = {
  '100': 'Poppins_100Thin',
  '200': 'Poppins_200ExtraLight',
  '300': 'Poppins_300Light',
  '400': 'Poppins_400Regular',
  'normal': 'Poppins_400Regular',
  '500': 'Poppins_500Medium',
  '600': 'Poppins_600SemiBold',
  '700': 'Poppins_700Bold',
  'bold': 'Poppins_700Bold',
  '800': 'Poppins_800ExtraBold',
  '900': 'Poppins_900Black',
};

const TEXT_KEYS = new Set([
  'fontSize',
  'color',
  'lineHeight',
  'textAlign',
  'letterSpacing',
  'textTransform',
  'textDecorationLine',
  'fontStyle',
  'includeFontPadding',
  'textAlignVertical',
]);

function applyPoppins(styleObj) {
  if (!styleObj || typeof styleObj !== 'object') return styleObj;

  // Don't overwrite if a custom fontFamily is already defined (e.g., icons)
  if (styleObj.fontFamily) return styleObj;

  // Check if it's a text/input style
  const isTextStyle =
    styleObj.fontWeight != null ||
    Object.keys(styleObj).some((k) => TEXT_KEYS.has(k));

  if (!isTextStyle) return styleObj;

  const rawWeight = styleObj.fontWeight ? String(styleObj.fontWeight) : '400';
  const matchedFont = FONT_MAP[rawWeight] || 'Poppins_400Regular';

  const updated = {
    ...styleObj,
    fontFamily: matchedFont,
  };

  // On Android, keeping explicit fontWeight alongside a specific custom font weight
  // can cause font lookup failures and fallback to Roboto
  if (Platform.OS === 'android') {
    delete updated.fontWeight;
  }

  return updated;
}

// Enhance StyleSheet.create globally
const originalCreate = StyleSheet.create;
StyleSheet.create = function (styles) {
  if (!styles || typeof styles !== 'object') {
    return originalCreate.call(StyleSheet, styles);
  }

  const modified = {};
  for (const key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      modified[key] = applyPoppins(styles[key]);
    }
  }

  return originalCreate.call(StyleSheet, modified);
};

export default { FONT_MAP, applyPoppins };
