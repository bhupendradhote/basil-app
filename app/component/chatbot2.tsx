import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// 🔹 Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyByjWTM9PbSnLto09d2fvemmflZ-lvx-T4";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const Chatbot = () => {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const flatRef = useRef(null);

  const quickQuestions = [
    "What is marketing analysis?",
    "How do I use the Position feature?",
  ];

  // ✅ Unique message ID
  const uniqueId = () => String(Date.now() + Math.random());

  const addMessage = (text, sender) => {
    const newMsg = { id: uniqueId(), text, sender };
    setMessages((prev) => [...prev, newMsg]);
  };

  // ✅ Function to communicate with Gemini
  const fetchGeminiResponse = async (prompt) => {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Please provide a short, specific answer (under 50 words) for the following question:\n\n${prompt}`,
                },
              ],
            },
          ],
        }),
      });

      const data = await res.json();
      console.log('Gemini raw response:', JSON.stringify(data, null, 2));

      const candidate = data?.candidates?.[0];
      const reply = candidate?.content?.parts?.[0]?.text || 'No response from Gemini';
      return reply.trim();
    } catch (err) {
      console.error(err);
      return 'Error connecting to Gemini API';
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMessage(trimmed, 'user');
    setText('');
    addMessage('Thinking...', 'bot');

    const botReply = await fetchGeminiResponse(trimmed);
    setMessages((prev) => [
      ...prev.slice(0, prev.length - 1),
      { id: uniqueId(), text: botReply, sender: 'bot' },
    ]);
  };

  const handleQuickQuestion = async (question) => {
    addMessage(question, 'user');
    addMessage('Thinking...', 'bot');

    const botReply = await fetchGeminiResponse(question);
    setMessages((prev) => [
      ...prev.slice(0, prev.length - 1),
      { id: uniqueId(), text: botReply, sender: 'bot' },
    ]);
  };

  useEffect(() => {
    if (flatRef.current && messages.length > 0) {
      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <>
      {/* Chat Modal */}
      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.modalContainer, { paddingBottom: insets.bottom }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.profileContainer}>
                  <MaterialIcons name="smart-toy" size={30} color="#123530" />
                  <View style={styles.statusIndicator} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Trading Assistant</Text>
                  <Text style={styles.statusText}>Online - Ready to help</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Quick Questions */}
            <View style={styles.quickQuestionsSection}>
              <Text style={styles.sectionTitle}>Quick Questions:</Text>
              <ScrollView
                horizontal
                contentContainerStyle={styles.questionsContainer}
                showsHorizontalScrollIndicator={false}
              >
                {quickQuestions.map((q) => (
                  <TouchableOpacity
                    key={uniqueId()}
                    style={styles.questionChip}
                    onPress={() => handleQuickQuestion(q)}
                  >
                    <Text style={styles.questionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Messages */}
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageContainer,
                    item.sender === 'user'
                      ? styles.userMessageContainer
                      : styles.botMessageContainer,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === 'user' ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        item.sender === 'user'
                          ? styles.userMessageText
                          : styles.botMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            />

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Type your question..."
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={[
          styles.aiButton,
          {
            position: 'absolute',
            bottom: Math.max(20, (insets.bottom || 0) + 12),
            right: 20,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <View style={styles.aiInner}>
          <View style={styles.aiIconContainer}>
            <MaterialIcons name="smart-toy" size={30} color="#123530" />
          </View>
          <Text style={styles.aiButtonTitle}>chat with ai</Text>
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  aiButton: {
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  aiInner: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiIconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonTitle: {
    fontSize: 10,
    color: '#123530',
    fontWeight: '400',
    textTransform: 'lowercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    backgroundColor: '#000',
    minHeight: 700,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#392f2f',
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileContainer: {
    position: 'relative',
    marginRight: 12,
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C851',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statusText: { fontSize: 14, color: '#9ceb7f', fontWeight: '500' },
  closeButton: { padding: 4, marginLeft: 8 },
  quickQuestionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#332c2c',
    backgroundColor: '#000',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  questionsContainer: { gap: 8 },
  questionChip: {
    backgroundColor: '#252525',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#534d4d',
  },
  questionText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  messagesContainer: { padding: 20, paddingBottom: 100 },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
    gap: 8,
  },
  userMessageContainer: { justifyContent: 'flex-end' },
  botMessageContainer: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: { backgroundColor: '#252525', borderBottomRightRadius: 6 },
  botBubble: {
    backgroundColor: '#252525',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'gray',
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  userMessageText: { color: '#FFFFFF' },
  botMessageText: { color: '#fff' },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#252525',
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#252525',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#252525',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Chatbot;
