import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '../utils/passwordRequirements';

export default function PasswordRequirementsList({
  password = '',
  currentPassword = null,
  isChangePassword = false,
}) {
  const pwd = password || '';
  const strength = getPasswordStrength(pwd);

  const getSegmentColor = (segIndex) => {
    if (segIndex > strength.score) {
      return '#36272D';
    }
    switch (strength.key) {
      case 'weak':
        return '#FF7691';
      case 'fair':
        return '#F59E0B';
      case 'good':
        return '#EB5B78';
      case 'strong':
        return '#10B981';
      default:
        return '#36272D';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength.key) {
      case 'weak':
        return '#FF7691';
      case 'fair':
        return '#F59E0B';
      case 'good':
        return '#EB5B78';
      case 'strong':
        return '#10B981';
      default:
        return '#8D8B98';
    }
  };

  const leftColumnRequirements = PASSWORD_REQUIREMENTS.filter((_, idx) => idx % 2 === 0);
  const rightColumnRequirements = PASSWORD_REQUIREMENTS.filter((_, idx) => idx % 2 === 1);

  const renderRequirementItem = (req) => {
    const isMet = req.test(pwd);
    return (
      <View key={req.id} style={styles.reqItem}>
        <Ionicons
          name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
          size={14}
          color={isMet ? '#10B981' : '#8D8B98'}
          style={styles.reqIcon}
        />
        <Text style={[styles.reqLabel, isMet && styles.reqLabelMet]}>
          {req.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container} accessibilityRole="region" accessibilityLabel="Password requirements">
      {/* 4-Segment Strength Meter */}
      <View style={styles.strengthContainer}>
        <View style={styles.strengthSegments}>
          {[1, 2, 3, 4].map((seg) => (
            <View
              key={seg}
              style={[
                styles.strengthSegment,
                { backgroundColor: getSegmentColor(seg) },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.strengthLabel, { color: getStrengthTextColor() }]} accessibilityLiveRegion="polite">
          {strength.label}
        </Text>
      </View>

      {/* Compact 2-Column Checklist (no box, no border) */}
      <View style={styles.checklistContainer}>
        <View style={styles.checklistColumn}>
          {leftColumnRequirements.map(renderRequirementItem)}
        </View>
        <View style={styles.checklistColumn}>
          {rightColumnRequirements.map(renderRequirementItem)}
        </View>
      </View>

      {/* Different from current password (for profile/settings modal) */}
      {isChangePassword && currentPassword !== null && (
        <View style={[styles.reqItem, styles.differentReqItem]}>
          {(() => {
            const isDiffMet = pwd.length > 0 && currentPassword.length > 0 && pwd !== currentPassword;
            return (
              <>
                <Ionicons
                  name={isDiffMet ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={isDiffMet ? '#10B981' : '#8D8B98'}
                  style={styles.reqIcon}
                />
                <Text style={[styles.reqLabel, isDiffMet && styles.reqLabelMet]}>
                  Different from current password
                </Text>
              </>
            );
          })()}
        </View>
      )}

      {/* Breach Check Indicator */}
      <View style={styles.breachNotice}>
        <Ionicons name="shield-checkmark-outline" size={13} color="#8D8B98" />
        <Text style={styles.breachNoticeText}>Checked against known data breaches</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 6,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  strengthSegments: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 999,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
  checklistContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  checklistColumn: {
    flex: 1,
    gap: 8,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reqIcon: {
    flexShrink: 0,
  },
  reqLabel: {
    fontSize: 12,
    color: '#8D8B98',
    lineHeight: 16,
  },
  reqLabelMet: {
    color: '#10B981',
    fontWeight: '500',
  },
  differentReqItem: {
    marginTop: 8,
  },
  breachNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  breachNoticeText: {
    fontSize: 11.5,
    color: '#8D8B98',
    lineHeight: 16,
  },
});
