import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

export default function DefaultProfileAvatar({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect width="512" height="512" fill="#f59ac6" />
      <Circle cx="256" cy="207" r="103" fill="#ff0069" />
      <Path d="M40 512c12-116 95-194 216-194s204 78 216 194H40Z" fill="#ff0069" />
    </Svg>
  );
}
