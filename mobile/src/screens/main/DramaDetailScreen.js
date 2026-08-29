import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { discoverService, trackerService } from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'plan_to_watch', label: 'Plan to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

export default function DramaDetailScreen({ route, navigation }) {
  const tmdbId = route.params?.tmdbId;
  const [drama, setDrama] = useState(null);
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Edit State Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formStatus, setFormStatus] = useState('plan_to_watch');
  const [formEpisode, setFormEpisode] = useState('0');
  const [formRating, setFormRating] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  const fetchDramaDetails = async () => {
    try {
      const dramaRes = await discoverService.getDramaDetail(tmdbId);
      setDrama(dramaRes.data.data);

      // Check tracker status
      try {
        const trackerRes = await trackerService.getDramaProgress(tmdbId);
        if (trackerRes.data && trackerRes.data.data) {
          const t = trackerRes.data.data;
          setTracker(t);
          setFormStatus(t.status || 'plan_to_watch');
          setFormEpisode(String(t.current_episode || 0));
          setFormRating(String(t.rating || 0));
          setFormNotes(t.review_notes || '');
        }
      } catch (e) {
        // Not in tracker yet
        setTracker(null);
      }
    } catch (err) {
      console.warn('Failed to load drama details:', err);
      Alert.alert('Error', 'Unable to fetch drama details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDramaDetails();
  }, [tmdbId]);

  const handleSaveTracker = async () => {
    setUpdating(true);
    const payload = {
      tmdb_id: tmdbId,
      status: formStatus,
      current_episode: parseInt(formEpisode, 10) || 0,
      rating: parseInt(formRating, 10) || 0,
      review_notes: formNotes,
    };

    try {
      if (tracker) {
        const res = await trackerService.updateProgress(tmdbId, payload);
        setTracker(res.data.data);
      } else {
        const res = await trackerService.addDrama(payload);
        setTracker(res.data.data);
      }
      setEditModalVisible(false);
      Alert.alert('Success', 'Watchlist updated!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not update watchlist.';
      Alert.alert('Notice', msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.redBright} />
      </View>
    );
  }

  if (!drama) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>Drama not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Backdrop / Poster Banner */}
        <View style={styles.backdropWrap}>
          <Image
            source={{
              uri:
                drama.backdrop_url ||
                drama.poster_url ||
                'https://via.placeholder.com/600x400',
            }}
            style={styles.backdrop}
            resizeMode="cover"
          />
          <View style={styles.backdropOverlay} />

          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* Drama Info Container */}
        <View style={styles.detailContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{drama.title}</Text>
              {drama.original_title ? (
                <Text style={styles.koreanTitle}>{drama.original_title}</Text>
              ) : null}
              <Text style={styles.metaRow}>
                {drama.release_year ? `${drama.release_year} · ` : ''}
                {Array.isArray(drama.genres) ? drama.genres.join(', ') : ''}
                {drama.number_of_episodes ? ` · ${drama.number_of_episodes} eps` : ''}
              </Text>
            </View>

            {drama.rating ? (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={16} color={colors.gold} />
                <Text style={styles.ratingText}>
                  {Number(drama.rating).toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Watch Status Card / Action */}
          <View style={styles.trackerBox}>
            <View>
              <Text style={styles.trackerBoxLabel}>My Watch Status</Text>
              <Text style={styles.trackerBoxValue}>
                {tracker
                  ? `${String(tracker.status).replace(/_/g, ' ').toUpperCase()} (Ep ${tracker.current_episode}/${drama.number_of_episodes || tracker.total_episodes || '?'})`
                  : 'Not in watchlist'}
              </Text>
            </View>
            <Pressable
              style={styles.trackerEditBtn}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.trackerEditBtnText}>
                {tracker ? 'Update' : '+ Add'}
              </Text>
            </Pressable>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Synopsis</Text>
            <Text style={styles.overviewText}>
              {drama.overview || 'No synopsis available.'}
            </Text>
          </View>

          {/* Review / Notes if in tracker */}
          {tracker?.review_notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>My Notes</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{tracker.review_notes}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Edit Tracker Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {tracker ? 'Update Watch Status' : 'Add to Watchlist'}
            </Text>

            {/* Status Select Buttons */}
            <Text style={styles.fieldLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.statusPill,
                    formStatus === opt.value && styles.statusPillActive,
                  ]}
                  onPress={() => setFormStatus(opt.value)}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      formStatus === opt.value && styles.statusPillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Current Episode Input */}
            <Text style={styles.fieldLabel}>
              Current Episode (Max: {drama.number_of_episodes || '?'})
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={formEpisode}
              onChangeText={setFormEpisode}
            />

            {/* Rating (1-10) */}
            <Text style={styles.fieldLabel}>Rating (1-10)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={formRating}
              onChangeText={setFormRating}
            />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Personal Review / Notes</Text>
            <TextInput
              style={[styles.modalInput, styles.notesInput]}
              multiline
              placeholder="What are your thoughts on this drama?"
              placeholderTextColor={colors.muted}
              value={formNotes}
              onChangeText={setFormNotes}
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveTracker}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.muted,
    fontSize: 15,
  },
  backdropWrap: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,7,14,0.45)',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(7,7,14,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    padding: 16,
    marginTop: -20,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 26,
  },
  koreanTitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  metaRow: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.gold,
  },
  trackerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.panel,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 20,
  },
  trackerBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
  },
  trackerBoxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.redBright,
    marginTop: 2,
  },
  trackerEditBtn: {
    backgroundColor: colors.redBright,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackerEditBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#D1D5DB',
  },
  notesBox: {
    backgroundColor: colors.panel,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  notesText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
    marginTop: 10,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusPillActive: {
    backgroundColor: colors.redBright,
    borderColor: colors.redBright,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  statusPillTextActive: {
    color: colors.white,
  },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.redBright,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
