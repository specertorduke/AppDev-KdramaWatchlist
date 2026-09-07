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
import { Ionicons } from '@expo/vector-icons';
import { Keyboard } from 'react-native';
import { useChatbot, QUICK_PROMPTS } from '../context/ChatbotContext';
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
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
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
                  <Text style={styles.titleText}>SarangTV </Text>
                  <Text style={styles.titleAccent}>AI</Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Online · K-Drama Expert</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerControls}>
              <Pressable
                style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
                onPress={clearHistory}
                accessibilityRole="button"
                accessibilityLabel="Reset conversation"
              >
                <Ionicons name="refresh-outline" size={17} color={colors.text} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
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
                      isUser ? styles.bubbleUser : styles.bubbleAi,
                      msg.isError && styles.bubbleError,
                    ]}
                  >
                    {isUser || msg.isError ? (
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser ? styles.bubbleTextUser : styles.bubbleTextAi,
                          msg.isError && styles.bubbleTextError,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    ) : (
                      renderFormattedAiText(
                        msg.text,
                        [styles.bubbleText, styles.bubbleTextAi],
                        styles.bubbleTextBold
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
                <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                  <ActivityIndicator size="small" color="#F5A9C4" />
                  <Text style={styles.typingText}>Finding recommendations...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompts Chips (Shown when 1 or few messages) */}
          {messages.length <= 2 && !loading && (
            <View style={styles.quickPromptsContainer}>
              <Text style={styles.quickPromptsLabel}>TRY ASKING:</Text>
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
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => handleSend(prompt)}
                  >
                    <Text style={styles.chipText}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about K-Dramas, tropes, recs..."
                placeholderTextColor="#6D6B78"
                value={input}
                onChangeText={setInput}
                maxLength={500}
                multiline={false}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              {input.length > 400 && (
                <Text style={styles.charCount}>{input.length}/500</Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                isInputValid ? styles.sendBtnActive : styles.sendBtnDisabled,
                pressed && isInputValid && styles.btnPressed,
              ]}
              onPress={() => handleSend()}
              disabled={!isInputValid || loading}
            >
              <Ionicons
                name="send"
                size={16}
                color={isInputValid ? '#07070E' : '#5A5866'}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ChatbotFloatingTrigger() {
  const { toggleChat, isOpen } = useChatbot();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.floatingTrigger,
        isOpen && styles.floatingTriggerActive,
        pressed && styles.floatingTriggerPressed,
      ]}
      onPress={toggleChat}
      accessibilityRole="button"
      accessibilityLabel="Open SarangTV K-Drama AI Chatbot"
    >
      <View style={styles.triggerInner}>
        <Ionicons
          name={isOpen ? 'close' : 'sparkles'}
          size={22}
          color={isOpen ? '#07070E' : '#F5A9C4'}
        />
        {!isOpen && <View style={styles.triggerBadge} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    height: '82%',
    backgroundColor: '#0F0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#262338',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#141324',
    borderBottomWidth: 1,
    borderBottomColor: '#25223A',
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
    backgroundColor: 'rgba(245, 169, 196, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 169, 196, 0.3)',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  titleAccent: {
    color: '#F5A9C4',
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
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.95 }],
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 14,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '85%',
  },
  msgRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  msgRowAi: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 169, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiAvatarImg: {
    width: 20,
    height: 20,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#F5A9C4',
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#19172A',
    borderWidth: 1,
    borderColor: '#2D2945',
    borderBottomLeftRadius: 4,
  },
  bubbleError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextUser: {
    color: '#07070E',
    fontWeight: '600',
  },
  bubbleTextAi: {
    color: '#F0EEE8',
    fontWeight: '400',
  },
  bubbleTextBold: {
    color: '#F5A9C4',
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
    backgroundColor: '#181628',
    borderWidth: 1,
    borderColor: 'rgba(245, 169, 196, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipPressed: {
    backgroundColor: '#26223D',
  },
  chipText: {
    color: '#E8E5EE',
    fontSize: 11,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#131222',
    borderTopWidth: 1,
    borderTopColor: '#242137',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1A2E',
    borderWidth: 1,
    borderColor: '#302C48',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
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
    backgroundColor: '#F5A9C4',
    shadowColor: '#F5A9C4',
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
    right: 18,
    bottom: 90, // Sits comfortably above bottom tab bar (height 76)
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#161426',
    borderWidth: 2,
    borderColor: '#F5A9C4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  floatingTriggerActive: {
    backgroundColor: '#F5A9C4',
    borderColor: '#F5A9C4',
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
  triggerBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F5A9C4',
  },
});
