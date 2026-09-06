import React, { useState } from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';


export default function Hoverable({
  children,
  style,
  hoverStyle,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <View
      style={[
        style,
        hovered && hoverStyle,
        styles.container,
      ]}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    transitionProperty: 'background-color, border-color, transform, opacity',
    transitionDuration: '160ms',
    transitionTimingFunction: 'ease-out',
  },
});