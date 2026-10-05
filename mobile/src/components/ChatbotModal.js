import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Keyboard } from 'react-native';
import { useChatbot, QUICK_PROMPTS } from '../context/ChatbotContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme';

// Simple markdown formatter for React Native (bold **text** and bullets)
const renderFormattedAiText = (text, defaultStyle, boldStyle) => {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const cleanedLine = isBullet ? '• ' + line.trim().substring(2) : line;

    // Parse **bold** parts
    const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);

    return (
      <Text key={lineIdx} style={[defaultStyle, isBullet && { paddingLeft: 4, marginVertical: 2 }]}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={partIdx} style={boldStyle}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  });
};

export default function ChatbotModal() {
  const { colors, isDark } = useTheme();
  const {
    isOpen,
    closeChat,
    messages,
    loading,
    sendMessage,
    clearHistory,
  } = useChatbot();

  const [input, setInput] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOpen, messages, loading]);

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;
    Keyboard.dismiss();
    sendMessage(query);
    setInput('');
  };

  const isInputValid = input.trim().length >= 2 && input.trim().length <= 500;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={closeChat}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../assets/sarangtv-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.titleText, { color: colors.pink }]}>
                    Sarang<Text style={[styles.titleTv, { color: colors.pink }]}>TV</Text>{' '}
                  </Text>
                  <Text style={[styles.titleAccent, { color: colors.pink }]}>AI</Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Online · K-Drama Expert</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerControls}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: isDark ? '#1E1B30' : (colors.panel2 || '#EEF1F6') },
                  pressed && styles.btnPressed,
                ]}
                onPress={clearHistory}
                accessibilityRole="button"
                accessibilityLabel="Reset conversation"
              >
                <Ionicons name="refresh-outline" size={17} color={colors.text} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: isDark ? '#1E1B30' : (colors.panel2 || '#EEF1F6') },
                  pressed && styles.btnPressed,
                ]}
                onPress={closeChat}
                accessibilityRole="button"
                accessibilityLabel="Close chat"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    isUser ? styles.msgRowUser : styles.msgRowAi,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.aiAvatar}>
                      <Image
                        source={require('../../assets/sarangtv-logo.png')}
                        style={styles.aiAvatarImg}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? [styles.bubbleUser, { backgroundColor: colors.pink }]
                        : [
                            styles.bubbleAi,
                            {
                              backgroundColor: isDark ? '#19172A' : colors.card,
                              borderColor: colors.border,
                              borderWidth: isDark ? 0 : 1,
                            },
                          ],
                      msg.isError && styles.bubbleError,
                    ]}
                  >
                    {isUser || msg.isError ? (
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser ? styles.bubbleTextUser : [styles.bubbleTextAi, { color: colors.text }],
                          msg.isError && styles.bubbleTextError,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    ) : (
                      renderFormattedAiText(
                        msg.text,
                        [styles.bubbleText, styles.bubbleTextAi, { color: colors.text }],
                        [styles.bubbleTextBold, { color: colors.pink }]
                      )
                    )}

                    {msg.isError && msg.originalPrompt && (
                      <Pressable
                        style={styles.retryBtn}
                        onPress={() => handleSend(msg.originalPrompt)}
                      >
                        <Ionicons name="refresh" size={12} color="#F87171" />
                        <Text style={styles.retryText}>Retry</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Loading typing bubble */}
            {loading && (
              <View style={[styles.msgRow, styles.msgRowAi]}>
                <View style={styles.aiAvatar}>
                  <Image
                    source={require('../../assets/sarangtv-logo.png')}
                    style={styles.aiAvatarImg}
                    resizeMode="contain"
                  />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAi,
                    styles.typingBubble,
                    {
                      backgroundColor: isDark ? '#19172A' : colors.card,
                      borderColor: colors.border,
                      borderWidth: isDark ? 0 : 1,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color={colors.pink} />
                  <Text style={[styles.typingText, { color: colors.muted }]}>Finding recommendations...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompts Chips (Shown when 1 or few messages) */}
          {messages.length <= 2 && !loading && (
            <View style={styles.quickPromptsContainer}>
              <Text style={[styles.quickPromptsLabel, { color: colors.muted }]}>TRY ASKING:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsContent}
              >
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: isDark ? '#1B192E' : colors.card,
                        borderColor: colors.border,
                        borderWidth: isDark ? 0 : 1,
                      },
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => handleSend(prompt)}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg || (isDark ? '#1E1B30' : '#ECEEF4'), borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Ask about K-Dramas, tropes, recs..."
                placeholderTextColor={colors.muted}
                value={input}
                onChangeText={setInput}
                maxLength={500}
                multiline={false}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              {input.length > 400 && (
                <Text style={[styles.charCount, { color: colors.muted }]}>{input.length}/500</Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                isInputValid
                  ? [styles.sendBtnActive, { backgroundColor: colors.pink, shadowColor: colors.pink }]
                  : [styles.sendBtnDisabled, { backgroundColor: isDark ? '#1C1A2E' : (colors.panel2 || '#E0E0E0') }],
                pressed && isInputValid && styles.btnPressed,
              ]}
              onPress={() => handleSend()}
              disabled={!isInputValid || loading}
            >
              <Ionicons
                name="send"
                size={16}
                color={isInputValid ? '#FFFFFF' : colors.muted}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ChatbotFloatingTrigger() {
  const insets = useSafeAreaInsets();
  const { toggleChat, isOpen } = useChatbot();
  const { colors, isDark } = useTheme();
  const bottomOffset = 78 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.floatingTrigger,
        {
          bottom: bottomOffset,
          backgroundColor: isOpen ? colors.pink : (isDark ? '#171624' : '#FFFFFF'),
          borderColor: colors.pink,
        },
        isOpen && [styles.floatingTriggerActive, { backgroundColor: colors.pink }],
        pressed && styles.floatingTriggerPressed,
      ]}
      onPress={toggleChat}
      accessibilityRole="button"
      accessibilityLabel="Open SarangTV K-Drama AI Chatbot"
    >
      <View style={styles.triggerInner}>
        {isOpen ? (
          <Ionicons name="close" size={24} color="#FFFFFF" />
        ) : (
          <View style={styles.triggerIconWrapper}>
            <Feather name="message-square" size={22} color={colors.pink} />
            <Ionicons name="sparkles" size={11} color="#FACC15" style={styles.triggerSparkleBadge} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    height: '82%',
    backgroundColor: '#11101E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#161424',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(235, 91, 120, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: '#ed8ea4',
    fontSize: 15,
    fontWeight: '900',
  },
  titleTv: {
    color: '#eb5b78',
  },
  titleAccent: {
    color: '#eb5b78',
    fontSize: 15,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1E1B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.95 }],
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    flexGrow: 1,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(235, 91, 120, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  aiAvatarImg: {
    width: 20,
    height: 20,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%',
    flexShrink: 1,
  },
  bubbleUser: {
    backgroundColor: '#eb5b78',
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#19172A',
    borderBottomLeftRadius: 4,
    flexShrink: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
    flexWrap: 'wrap',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bubbleTextAi: {
    color: '#F0EEE8',
    fontWeight: '400',
  },
  bubbleTextBold: {
    color: '#eb5b78',
    fontWeight: '700',
  },
  bubbleTextError: {
    color: '#F87171',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: '#A19EA9',
    fontSize: 12,
    fontStyle: 'italic',
  },
  quickPromptsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickPromptsLabel: {
    color: '#716C7B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  quickChipsContent: {
    gap: 8,
  },
  chip: {
    backgroundColor: '#1B192E',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  chipPressed: {
    backgroundColor: '#26223D',
  },
  chipText: {
    color: '#E8E5EE',
    fontSize: 11,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#141324',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  charCount: {
    color: '#8D8B98',
    fontSize: 10,
    marginLeft: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#eb5b78',
    shadowColor: '#eb5b78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#1C1A2E',
  },
  floatingTrigger: {
    position: 'absolute',
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#171624',
    borderWidth: 2,
    borderColor: '#eb5b78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#eb5b78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  floatingTriggerActive: {
    backgroundColor: '#eb5b78',
    borderColor: '#eb5b78',
  },
  floatingTriggerPressed: {
    transform: [{ scale: 0.94 }],
  },
  triggerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  triggerIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  triggerSparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -3,
  },
});
