import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ChatScreen({ route, navigation }) {
    const { listingId, receiverId, title } = route.params;
    const { user }                         = useAuth();
    const [messages, setMessages]          = useState([]);
    const [text,     setText]             = useState('');
    const [loading,  setLoading]          = useState(true);
    const [sending,  setSending]          = useState(false);
    const flatListRef                      = useRef(null);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/messages/${listingId}`);
            setMessages(response.data);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            const response = await api.post('/messages', {
                listing_id:  listingId,
                receiver_id: receiverId,
                body:        text.trim(),
            });
            setMessages(prev => [...prev, response.data]);
            setText('');
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.log('Error enviando mensaje:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                        {item.body}
                    </Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                        {new Date(item.created_at).toLocaleTimeString([], {
                            hour:   '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1D3557" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {title || 'Chat'}
                    </Text>
                    <Text style={styles.headerSubtitle}>Conversación</Text>
                </View>
            </View>

            {/* Mensajes */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={{ fontSize: 40 }}>👋</Text>
                        <Text style={styles.emptyText}>
                            Sé el primero en escribir
                        </Text>
                    </View>
                }
            />

            {/* Input */}
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe un mensaje..."
                    placeholderTextColor="#888"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!text.trim() || sending}
                >
                    {sending
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.sendBtnText}>➤</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:            1,
        backgroundColor: '#F1FAEE',
    },
    centered: {
        flex:           1,
        justifyContent: 'center',
        alignItems:     'center',
        paddingTop:     40,
    },
    header: {
        backgroundColor:   '#1D3557',
        paddingTop:        52,
        paddingBottom:     14,
        paddingHorizontal: 20,
        flexDirection:     'row',
        alignItems:        'center',
        gap:               14,
    },
    backBtn: {
        color:    '#A8DADC',
        fontSize: 24,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        color:      '#fff',
        fontSize:   16,
        fontWeight: '700',
    },
    headerSubtitle: {
        color:    '#A8DADC',
        fontSize: 12,
    },
    messagesList: {
        padding:     16,
        gap:         8,
        flexGrow:    1,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom:  8,
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth:     '75%',
        padding:      12,
        borderRadius: 16,
        gap:          4,
    },
    bubbleMe: {
        backgroundColor:      '#1D3557',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor:     '#fff',
        borderBottomLeftRadius: 4,
        borderWidth:         1,
        borderColor:         '#eee',
    },
    bubbleText: {
        fontSize: 15,
        color:    '#1D3557',
    },
    bubbleTextMe: {
        color: '#fff',
    },
    bubbleTime: {
        fontSize:  10,
        color:     '#888',
        alignSelf: 'flex-end',
    },
    bubbleTimeMe: {
        color: '#A8DADC',
    },
    inputRow: {
        flexDirection:     'row',
        padding:           12,
        gap:               10,
        backgroundColor:   '#fff',
        borderTopWidth:    1,
        borderTopColor:    '#eee',
        alignItems:        'flex-end',
    },
    input: {
        flex:              1,
        backgroundColor:   '#F1FAEE',
        borderRadius:      20,
        paddingHorizontal: 16,
        paddingVertical:   10,
        fontSize:          15,
        color:             '#1D3557',
        borderWidth:       1,
        borderColor:       '#A8DADC',
        maxHeight:         120,
    },
    sendBtn: {
        width:           44,
        height:          44,
        borderRadius:    22,
        backgroundColor: '#E63946',
        justifyContent:  'center',
        alignItems:      'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#ccc',
    },
    sendBtnText: {
        color:    '#fff',
        fontSize: 18,
    },
    emptyText: {
        fontSize:  14,
        color:     '#888',
        marginTop: 10,
    },
});