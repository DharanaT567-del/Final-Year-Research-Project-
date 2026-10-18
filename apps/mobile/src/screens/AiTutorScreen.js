import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import axiosClient from '../api/axiosClient';

const SUGGESTED_PROMPTS = [
  'Tell me about Ninda Nena Rathriye',
  'What is Dadra taal?',
  'Explain the meaning of Maha Wessaka',
  'What instruments are used in Sinhala classical music?',
];

export default function AiTutorScreen({ navigation, route }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'tutor',
      text: "Ayubowan! 🙏 I'm your Naada AI Tutor, specialized in Sinhala classical music, ragas, taals, and lyric interpretation.\n\nAsk me about any song, rhythmic cycle, or instrument!",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  useEffect(() => {
    if (route?.params?.initialQuery) {
      handleSend(route.params.initialQuery);
    }
  }, [route?.params?.initialQuery]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Corrected API endpoint route to /api/v1/tutor/chat
      const response = await axiosClient.post('/api/v1/tutor/chat', { 
        message: text 
      });

      const replyText = response.data?.reply || response.data?.response || 'No response received from tutor.';

      const tutorMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: replyText,
        timestamp: response.data?.timestamp || Date.now(),
      };

      setMessages((prev) => [...prev, tutorMessage]);
    } catch (error) {
      let errorMsg;
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = 'Your session has expired or is unauthorized. Please log out and sign in again.';
      } else {
        errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          (error.message === 'Network Error'
            ? 'Cannot connect to the API Gateway. Ensure your backend server is running on port 8080.'
            : 'Unable to get an answer from AI Tutor right now. Please try again.');
      }

      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        text: `⚠️ ${errorMsg}`,
        isError: true,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === 'user';
    const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowTutor,
        ]}
      >
        {!isUser && (
          <View style={styles.tutorAvatar}>
            <Text style={styles.avatarIcon}>🤖</Text>
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleTutor,
            item.isError && styles.bubbleError,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
            {item.text}
          </Text>
          <Text style={[styles.timestampText, isUser && styles.timestampUser]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Naada AI Tutor</Text>
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.headerSubtitle}>Sinhala Classical Music Educator</Text>
        </View>

        <View style={styles.headerRightBadge}>
          <Text style={styles.badgeText}>AI</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingBubble}>
                <View style={styles.tutorAvatar}>
                  <Text style={styles.avatarIcon}>🤖</Text>
                </View>
                <View style={styles.typingContainer}>
                  <ActivityIndicator size="small" color="#00e5ff" />
                  <Text style={styles.typingText}>Naada Tutor is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggested Quick Prompt Chips */}
        {messages.length <= 2 && (
          <View style={styles.promptChipsContainer}>
            <Text style={styles.promptChipsHeading}>Try asking:</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={SUGGESTED_PROMPTS}
              keyExtractor={(item, index) => `prompt-${index}`}
              contentContainerStyle={styles.promptChipsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.promptChip}
                  onPress={() => handleSend(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promptChipText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBarContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about songs, ragas, taals..."
            placeholderTextColor="#777"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={600}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flexContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161618',
    borderBottomWidth: 1,
    borderBottomColor: '#26262a',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  backIcon: {
    color: '#00e5ff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00e5ff',
    marginLeft: 8,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 1,
  },
  headerRightBadge: {
    backgroundColor: '#2b1b36',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4d2861',
  },
  badgeText: {
    color: '#c074ff',
    fontSize: 11,
    fontWeight: '700',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowTutor: {
    justifyContent: 'flex-start',
  },
  tutorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f1f23',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#383842',
  },
  avatarIcon: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#3b1c54',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#592980',
  },
  bubbleTutor: {
    backgroundColor: '#1c1c20',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2d2d35',
  },
  bubbleError: {
    backgroundColor: '#2f1519',
    borderColor: '#602028',
  },
  messageText: {
    color: '#ececed',
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextUser: {
    color: '#ffffff',
  },
  timestampText: {
    fontSize: 10,
    color: '#777',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timestampUser: {
    color: '#b08fd6',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c20',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2d2d35',
  },
  typingText: {
    color: '#999',
    fontSize: 13,
    marginLeft: 8,
  },
  promptChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  promptChipsHeading: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  promptChipsList: {
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#1c1b26',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a274c',
    marginRight: 8,
  },
  promptChipText: {
    color: '#c074ff',
    fontSize: 12,
    fontWeight: '500',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#161618',
    borderTopWidth: 1,
    borderTopColor: '#26262a',
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#202026',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#303038',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00e5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#282830',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
});