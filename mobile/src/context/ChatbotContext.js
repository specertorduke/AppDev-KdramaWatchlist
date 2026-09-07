import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatbotService } from '../services/api';

const INITIAL_MESSAGE = {
  id: 'init-greeting',
  sender: 'ai',
  text: "Annyeong! I'm your SarangTV K-Drama AI assistant. Ask me for recommendations, plot vibes, or what to watch next based on your watchlist!",
  timestamp: Date.now(),
};

export const QUICK_PROMPTS = [
  'Recommend a short bingeable thriller',
  'Something heartwarming like Hometown Cha-Cha-Cha',
  'Top romance dramas with great chemistry',
  'Historical sageuk dramas worth watching',
];

const ChatbotContext = createContext(null);

export const ChatbotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('sarangtv_mobile_chat_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
  };

  const saveChatHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem('sarangtv_mobile_chat_history', JSON.stringify(newMessages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  };

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = async (text) => {
    const trimmed = (text || '').trim();
    if (trimmed.length < 2 || trimmed.length > 500 || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    setLoading(true);
    setLastFailedMessage(null);

    try {
      const response = await chatbotService.sendMessage(trimmed);
      const reply = response.data?.reply || response.data || 'I enjoyed reading that! Do you have another K-Drama question?';

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: typeof reply === 'string' ? reply : String(reply),
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedWithUser, aiMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    } catch (err) {
      let errorText = "Sorry, I couldn't connect to the AI assistant right now. Please check back shortly.";
      let isAuthError = false;

      if (err.response) {
        const { status, data } = err.response;
        if (status === 401) {
          errorText = 'Your session has expired. Please log in again to chat with the AI assistant.';
          isAuthError = true;
        } else if (status === 422) {
          errorText = data?.message || data?.errors?.message?.[0] || 'Please enter a message between 2 and 500 characters.';
        } else if (status === 429) {
          errorText = "You're asking too quickly. Please wait a moment.";
        } else if (data?.message) {
          errorText = data.message;
        }
      }

      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: errorText,
        isError: true,
        isAuthError,
        originalPrompt: trimmed,
        timestamp: Date.now(),
      };

      const finalWithErr = [...updatedWithUser, errorMessage];
      setMessages(finalWithErr);
      setLastFailedMessage(trimmed);
      await saveChatHistory(finalWithErr);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    const reset = [INITIAL_MESSAGE];
    setMessages(reset);
    setLastFailedMessage(null);
    await saveChatHistory(reset);
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        messages,
        loading,
        lastFailedMessage,
        sendMessage,
        clearHistory,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
