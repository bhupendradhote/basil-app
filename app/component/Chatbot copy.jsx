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
    Image,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const Chatbot = () => {
    const insets = useSafeAreaInsets();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const flatRef = useRef(null);

    const quickQuestions = [
        "What is marketing analysis?",
        "How do I use the Position!",
    ];

    const sendMessage = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const userMsg = { id: String(Date.now()), text: trimmed, sender: 'user' };
        setMessages((p) => [...p, userMsg]);
        setText('');

        setTimeout(() => {
            const botMsg = { id: String(Date.now() + 1), text: `I understand you're asking about "${trimmed}". As a trading assistant, I can help you with market analysis, trading strategies, and platform guidance.`, sender: 'bot' };
            setMessages((p) => [...p, botMsg]);
        }, 1000);
    };

    const handleQuickQuestion = (question) => {
        const userMsg = { id: String(Date.now()), text: question, sender: 'user' };
        setMessages((p) => [...p, userMsg]);
        setText('');

        setTimeout(() => {
            const botMsg = {
                id: String(Date.now() + 1),
                text: question.includes("marketing analysis")
                    ? "Marketing analysis involves examining market trends, consumer behavior, and competitive landscape to make informed trading decisions. It helps identify opportunities and risks in the market."
                    : "The Position feature helps you manage your trade positions, track profit/loss, and set stop-loss/take-profit levels. You can access it from the main trading dashboard.",
                sender: 'bot'
            };
            setMessages((p) => [...p, botMsg]);
        }, 1000);
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
                                    <Image
                                        source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }}
                                        style={styles.profileImage}
                                    />
                                    <View style={styles.statusIndicator} />
                                </View>
                                <View style={styles.headerText}>
                                    <Text style={styles.headerTitle}>Trading Assistant</Text>
                                    <View style={styles.statusContainer}>
                                        <View style={styles.onlineDot} />
                                        <Text style={styles.statusText}>Online - Ready to help</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Quick Questions Section */}
                        <View style={styles.quickQuestionsSection}>
                            <Text style={styles.sectionTitle}>Quick Question:</Text>
                            <ScrollView horizontal contentContainerStyle={styles.questionsContainer} showsHorizontalScrollIndicator={false}>
                                {quickQuestions.map((question, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.questionChip}
                                        onPress={() => handleQuickQuestion(question)}
                                    >
                                        <Text style={styles.questionText}>{question}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Chat Messages */}
                        <FlatList
                            ref={flatRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={[
                                    styles.messageContainer,
                                    item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer
                                ]}>
                                    {item.sender === 'bot' && (
                                        <Image
                                            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }}
                                            style={styles.botAvatar}
                                        />
                                    )}
                                    <View style={[
                                        styles.messageBubble,
                                        item.sender === 'user' ? styles.userBubble : styles.botBubble
                                    ]}>
                                        <Text style={[
                                            styles.messageText,
                                            item.sender === 'user' ? styles.userMessageText : styles.botMessageText
                                        ]}>
                                            {item.text}
                                        </Text>
                                    </View>
                                    {item.sender === 'user' && (
                                        <View style={styles.userAvatar}>
                                            <Text style={styles.userAvatarText}>You</Text>
                                        </View>
                                    )}
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

            {/* FAB Button with exact styling from your code */}
            <TouchableOpacity
                style={[styles.aiButton, {
                    position: 'absolute',
                    bottom: Math.max(20, (insets.bottom || 0) + 12),
                    right: 20
                }]}
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
    // AI Button Styles (exact from your code)
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ffffffff',
        borderRadius: 16,
    },
    aiIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiButtonTitle: {
        marginLeft: 8,
        fontSize: 14,
        color: '#123530',
        fontWeight: '400',
        textTransform: 'lowercase',
    },

    // Rest of the styles remain the same...
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        // backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 16,
        backgroundColor: '#000',
        minHeight: 700,
    },

    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#392f2fff',
        backgroundColor: '#252525',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileContainer: {
        position: 'relative',
        marginRight: 12,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#E8E8E8',
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
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00C851',
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#9ceb7fff',
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,

    },

    // Quick Questions Section
    quickQuestionsSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#332c2cff',
        backgroundColor: '#000',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    questionsContainer: {
        gap: 8,
    },
    questionChip: {
        backgroundColor: '#252525',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#534d4dff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    questionText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },

    // Welcome Section
    welcomeSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    welcomeMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    checkbox: {
        marginRight: 12,
        marginTop: 2,
    },
    welcomeText: {
        fontSize: 14,
        color: '#1A1A1A',
        flex: 1,
        lineHeight: 20,
    },

    // Messages
    messagesContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 8,
        gap: 8,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    botMessageContainer: {
        justifyContent: 'flex-start',
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0066CC',
        borderRadius:50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    messageBubble: {
        maxWidth: '70%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: '#252525',
        borderBottomRightRadius: 6,
    },
    botBubble: {
        backgroundColor: '#252525',
        borderBottomLeftRadius: 6,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'gray'
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    botMessageText: {
        color: '#fff',
    },

    // Input Area
    inputContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#252525',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        backgroundColor:'#000'
    },
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default Chatbot;