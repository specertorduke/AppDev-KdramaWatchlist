import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function SectionHeader({ eyebrow, title, action }) {
  return (
    <View style={styles.row}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  eyebrow: { color: colors.muted, fontSize: 8.5, fontWeight: '800', letterSpacing: 1.8, marginBottom: 5 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  action: { color: '#aaa6b0', fontSize: 9.5 }
});
