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
    Image,
    Alert,
    Modal,
    Dimensions,
    Linking,
    Vibration,
    Pressable,
    BackHandler,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const { width: SW, height: SH } = Dimensions.get('window');

const DEFAULT_QUICK = [
    '¿Sigue disponible? 🤔',
    '¿Acepta ofertas? 💰',
    '¿Dónde nos encontramos? 📍',
    '¿Tiene garantía? ✅',
    '¿Cuál es su estado? 🔍',
    '¿Acepta transferencia? 🏦',
    '¿Tiene factura? 🧾',
    'Me interesa, ¿cuándo coordinamos? 📅',
];

export default function ChatScreen({ route, navigation }) {
    const { listingId, receiverId, title, autoMessage } = route.params;
    const { user } = useAuth();

    const [messages,     setMessages]     = useState([]);
    const [text,         setText]         = useState('');
    const [loading,      setLoading]      = useState(true);
    const [sending,      setSending]      = useState(false);
    const [imageViewer,  setImageViewer]  = useState(null);
    const [showImgOpts,  setShowImgOpts]  = useState(false);
    const [showQuick,    setShowQuick]    = useState(false);
    const [editingMsg,   setEditingMsg]   = useState(null);
    const [selectedMsg,  setSelectedMsg]  = useState(null);
    const [showChatOpts, setShowChatOpts] = useState(false);
    const [autoSent,     setAutoSent]     = useState(false);
    const [myQuickMsgs,  setMyQuickMsgs]  = useState([]);
    const [showAddQuick, setShowAddQuick] = useState(false);
    const [newQuickMsg,  setNewQuickMsg]  = useState('');
    const [dates,        setDates]        = useState({});

    const flatListRef = useRef(null);
    const inputRef    = useRef(null);

    useEffect(() => {
        const onBack = () => {
            if (imageViewer)   { setImageViewer(null);    return true; }
            if (showImgOpts)   { setShowImgOpts(false);   return true; }
            if (selectedMsg)   { setSelectedMsg(null);    return true; }
            if (showChatOpts)  { setShowChatOpts(false);  return true; }
            if (showAddQuick)  { setShowAddQuick(false);  return true; }
            if (showQuick)     { setShowQuick(false);     return true; }
            if (editingMsg)    { cancelEdit();             return true; }
            return false;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
        return () => sub.remove();
    }, [imageViewer, showImgOpts, selectedMsg, showChatOpts, showAddQuick, showQuick, editingMsg]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!loading && autoMessage && !autoSent && messages.length === 0) {
            setAutoSent(true);
            doSend(autoMessage);
        }
    }, [loading]);

    useEffect(() => {
        const d = {};
        messages.forEach((msg, i) => {
            const prev = messages[i - 1];
            d[msg.id] = !prev || fmtDate(prev.created_at) !== fmtDate(msg.created_at);
        });
        setDates(d);
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/${listingId}`);
            setMessages(res.data);
        } catch (e) {
            console.log('fetchMessages error:', e);
        } finally {
            setLoading(false);
        }
    };

    const doSend = async (body) => {
        setSending(true);
        try {
            const res = await api.post('/messages', {
                listing_id:  listingId,
                receiver_id: receiverId,
                body,
            });
            setMessages(prev => [...prev, res.data]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (e) {
            console.log('doSend error:', e);
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async () => {
        const body = text.trim();
        if (!body) return;
        setText('');
        if (editingMsg) {
            try {
                const res = await api.put(`/messages/${editingMsg.id}`, { body });
                setMessages(prev => prev.map(m => m.id === editingMsg.id ? res.data : m));
                cancelEdit();
            } catch (e) {
                Alert.alert('Error', 'No se pudo editar el mensaje.');
                setText(body);
            }
            return;
        }
        doSend(body);
    };

    const sendQuick = (msg) => {
        setShowQuick(false);
        doSend(msg);
    };

    const cancelEdit = () => {
        setEditingMsg(null);
        setText('');
    };

    const startEdit = (msg) => {
        setSelectedMsg(null);
        setEditingMsg(msg);
        setText(msg.body);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const deleteMessage = async (msg) => {
        setSelectedMsg(null);
        Alert.alert(
            'Eliminar mensaje',
            '¿Estás seguro de que quieres eliminar este mensaje?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/messages/${msg.id}`);
                            setMessages(prev => prev.map(m =>
                                m.id === msg.id
                                    ? { ...m, deleted: true, body: 'Este mensaje fue eliminado' }
                                    : m
                            ));
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo eliminar el mensaje.');
                        }
                    },
                },
            ]
        );
    };

    const replyTo = (msg) => {
        setSelectedMsg(null);
        setText(`↩ "${msg.body.slice(0, 40)}"\n`);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const pickAndSend = async (fromCamera) => {
        setShowImgOpts(false);
        const fn = fromCamera
            ? ImagePicker.requestCameraPermissionsAsync
            : ImagePicker.requestMediaLibraryPermissionsAsync;
        const { status } = await fn();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso para enviar imágenes.');
            return;
        }
        const result = fromCamera
            ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
        if (result.canceled) return;
        uploadImage(result.assets[0].uri);
    };

    const uploadImage = async (uri) => {
        setSending(true);
        try {
            const fd = new FormData();
            fd.append('file',          { uri, type: 'image/jpeg', name: 'chat.jpg' });
            fd.append('upload_preset', 'cachivacheros');
            fd.append('cloud_name',    'duwvw6q2c');
            const up   = await fetch('https://api.cloudinary.com/v1_1/duwvw6q2c/image/upload', { method: 'POST', body: fd });
            const data = await up.json();
            const res  = await api.post('/messages', {
                listing_id:  listingId,
                receiver_id: receiverId,
                body:        `__IMG__${data.secure_url}`,
                type:        'image',
            });
            setMessages(prev => [...prev, res.data]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (e) {
            Alert.alert('Error', 'No se pudo enviar la imagen. Intenta de nuevo.');
        } finally {
            setSending(false);
        }
    };

    const addMyQuick = () => {
        if (!newQuickMsg.trim()) return;
        setMyQuickMsgs(prev => [...prev, newQuickMsg.trim()]);
        setNewQuickMsg('');
        setShowAddQuick(false);
    };

    const isImg  = (b) => typeof b === 'string' && b.startsWith('__IMG__');
    const getImg = (b) => typeof b === 'string' ? b.replace('__IMG__', '') : '';

    const fmtTime = (d) =>
        new Date(d).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    const fmtDate = (d) => {
        const date = new Date(d), now = new Date(), diff = now.getTime() - date.getTime();
        if (diff < 86400000)  return 'Hoy';
        if (diff < 172800000) return 'Ayer';
        return date.toLocaleDateString('es-BO');
    };

    // ─────────────────────────────────────────────────────────────
    // FIX PRINCIPAL: Los ticks de lectura se renderizan en un
    // <Text> separado FUERA del texto del tiempo, nunca anidados.
    // Así evitamos que `false` (booleano) aparezca como hijo de
    // RCTView y rompa el árbol de componentes.
    // ─────────────────────────────────────────────────────────────
    const renderBubbleText = (item, isMe) => {
        // Calculamos el string de ticks aquí, en JS puro, sin JSX condicional anidado
        const tickStr = isMe ? (item.read ? ' ✓✓' : ' ✓') : '';
        const tickColor = item.read ? '#A8DADC' : 'rgba(255,255,255,0.35)';

        return (
            <View>
                <Text style={[styles.bubbleTxt, isMe && styles.bubbleTxtMe]}>
                    {item.body}
                </Text>
                <View style={styles.msgMeta}>
                    {item.edited === true && (
                        <Text style={[styles.editedLbl, isMe && { color: 'rgba(168,218,220,0.5)' }]}>
                            editado
                        </Text>
                    )}
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                        {fmtTime(item.created_at)}
                        {/* FIX: Ticks en su propio Text, solo cuando isMe es true */}
                        {isMe === true && (
                            <Text style={{ color: tickColor }}>
                                {tickStr}
                            </Text>
                        )}
                    </Text>
                </View>
            </View>
        );
    };

    const renderBubbleImage = (item, isMe) => {
        const tickStr = isMe ? (item.read ? ' ✓✓' : ' ✓') : '';
        return (
            <TouchableOpacity
                onPress={() => setImageViewer(getImg(item.body))}
                accessibilityLabel="Ver imagen a pantalla completa"
                accessibilityRole="button"
            >
                <Image
                    source={{ uri: getImg(item.body) }}
                    style={styles.chatImg}
                    resizeMode="cover"
                />
                <Text style={styles.bubbleTimeImg}>
                    {fmtTime(item.created_at)}{tickStr}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderDeletedBubble = () => (
        <View style={styles.deletedRow}>
            <Ionicons name="ban-outline" size={13} color="#bbb" />
            <Text style={styles.deletedTxt}>Mensaje eliminado</Text>
        </View>
    );

    const renderMessage = ({ item }) => {
        const isMe        = item.sender_id === user?.id;
        const isDeleted   = item.deleted === true;
        const isImage     = isImg(item.body) && !isDeleted;
        const isSelected  = selectedMsg?.id === item.id;
        const showDateSep = dates[item.id] === true;

        return (
            <View>
                {showDateSep && (
                    <View style={styles.dateSep}>
                        <View style={styles.dateLine} />
                        <Text style={styles.dateText}>{fmtDate(item.created_at)}</Text>
                        <View style={styles.dateLine} />
                    </View>
                )}
                <Pressable
                    onLongPress={() => {
                        if (isDeleted) return;
                        Vibration.vibrate(40);
                        setSelectedMsg(item);
                    }}
                    onPress={() => {
                        if (selectedMsg) setSelectedMsg(null);
                        if (showQuick)   setShowQuick(false);
                    }}
                    style={[
                        styles.msgRow,
                        isMe && styles.msgRowMe,
                        isSelected && styles.msgRowSelected,
                    ]}
                    accessibilityLabel={
                        isDeleted ? 'Mensaje eliminado'
                        : isImage  ? 'Imagen enviada'
                        : item.body
                    }
                >
                    {!isMe && (
                        <View style={styles.avatarSmall}>
                            <Ionicons name="person" size={14} color="#1D3557" />
                        </View>
                    )}

                    <View style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleThem,
                        isImage   && styles.bubbleImg,
                        isDeleted && styles.bubbleDeleted,
                        isSelected && styles.bubbleSelected,
                    ]}>
                        {isDeleted
                            ? renderDeletedBubble()
                            : isImage
                                ? renderBubbleImage(item, isMe)
                                : renderBubbleText(item, isMe)
                        }
                    </View>
                </Pressable>
            </View>
        );
    };

    const allQuick = [...DEFAULT_QUICK, ...myQuickMsgs];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

            {/* ══ HEADER ══ */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="Volver"
                    accessibilityRole="button"
                >
                    <Ionicons name="arrow-back" size={24} color="#A8DADC" />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatar}>
                        <Ionicons name="person" size={20} color="#A8DADC" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Chat'}</Text>
                        <Text style={styles.headerSub}>Coordina tu compra en Bs.</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.menuBtn}
                    accessibilityLabel="Más opciones"
                    accessibilityRole="button"
                    onPress={() => setShowChatOpts(true)}
                >
                    <Ionicons name="ellipsis-vertical" size={22} color="#A8DADC" />
                </TouchableOpacity>
            </View>

            {/* ══ BANNER PRODUCTO ══ */}
            <View style={styles.productBanner}>
                <View style={styles.productBannerIcon}>
                    <Ionicons name="pricetag-outline" size={13} color="#A8DADC" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.productBannerTxt} numberOfLines={1}>{title}</Text>
                    <Text style={styles.productBannerSub}>Coordina precio, lugar y forma de pago</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#1D3557" />
                        <Text style={styles.loadingTxt}>Cargando mensajes…</Text>
                    </View>
                ) : (
                    <Pressable
                        style={{ flex: 1 }}
                        onPress={() => {
                            if (showQuick)   setShowQuick(false);
                            if (selectedMsg) setSelectedMsg(null);
                        }}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderMessage}
                            contentContainerStyle={styles.msgList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                            onScrollBeginDrag={() => { if (showQuick) setShowQuick(false); }}
                            ListEmptyComponent={
                                <View style={styles.emptyChat}>
                                    <View style={styles.emptyIcon}>
                                        <Ionicons name="chatbubbles-outline" size={48} color="#A8DADC" />
                                    </View>
                                    <Text style={styles.emptyChatTitle}>¡Inicia la conversación!</Text>
                                    <Text style={styles.emptyChatSub}>
                                        Usa los mensajes rápidos o escribe tu propio mensaje abajo
                                    </Text>
                                </View>
                            }
                        />
                    </Pressable>
                )}

                {/* ── Banner editar ── */}
                {editingMsg !== null && (
                    <View style={styles.editBanner}>
                        <Ionicons name="create-outline" size={16} color="#F4A261" />
                        <Text style={styles.editBannerTxt}>Editando mensaje</Text>
                        <TouchableOpacity
                            onPress={cancelEdit}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel="Cancelar edición"
                            accessibilityRole="button"
                        >
                            <Ionicons name="close-circle" size={22} color="#E63946" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Panel mensajes rápidos ── */}
                {showQuick === true && (
                    <View style={styles.quickPanel}>
                        <View style={styles.quickPanelHeader}>
                            <View style={styles.quickPanelTitleRow}>
                                <Ionicons name="flash" size={14} color="#1D3557" />
                                <Text style={styles.quickPanelTitle}>Mensajes rápidos</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowAddQuick(true)}
                                accessibilityLabel="Crear mensaje rápido"
                                accessibilityRole="button"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.addQuickBtn}>+ Crear</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={allQuick}
                            keyExtractor={(_, i) => i.toString()}
                            style={{ maxHeight: 200 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={styles.quickItem}
                                    onPress={() => sendQuick(item)}
                                    accessibilityLabel={item}
                                    accessibilityRole="button"
                                    onLongPress={() => {
                                        if (index >= DEFAULT_QUICK.length) {
                                            Alert.alert(
                                                'Eliminar mensaje rápido',
                                                '¿Quieres eliminar este mensaje personalizado?',
                                                [
                                                    { text: 'Cancelar', style: 'cancel' },
                                                    {
                                                        text: 'Eliminar',
                                                        style: 'destructive',
                                                        onPress: () =>
                                                            setMyQuickMsgs(prev =>
                                                                prev.filter((_, i2) => i2 !== index - DEFAULT_QUICK.length)
                                                            ),
                                                    },
                                                ]
                                            );
                                        }
                                    }}
                                >
                                    <Text style={styles.quickItemTxt}>{item}</Text>
                                    {index >= DEFAULT_QUICK.length && (
                                        <Text style={styles.quickItemHint}>Mantén pulsado para eliminar</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* ══ BARRA DE ENTRADA ══ */}
                <View style={styles.inputBar}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setShowImgOpts(true)}
                        accessibilityLabel="Enviar imagen"
                        accessibilityRole="button"
                    >
                        <Ionicons name="camera-outline" size={22} color="#A8DADC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconBtn, showQuick && styles.iconBtnActive]}
                        onPress={() => setShowQuick(v => !v)}
                        accessibilityLabel="Mensajes rápidos"
                        accessibilityRole="button"
                    >
                        <Ionicons name="flash" size={22} color={showQuick ? '#fff' : '#A8DADC'} />
                    </TouchableOpacity>

                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder={editingMsg ? 'Editando mensaje…' : 'Escribe un mensaje…'}
                        placeholderTextColor="#A8DADC"
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={1000}
                        accessibilityLabel="Campo de texto para el mensaje"
                        onFocus={() => { if (showQuick) setShowQuick(false); }}
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
                        onPress={sendMessage}
                        disabled={!text.trim() || sending}
                        accessibilityLabel={editingMsg ? 'Confirmar edición' : 'Enviar mensaje'}
                        accessibilityRole="button"
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name={editingMsg ? 'checkmark' : 'send'} size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>


            {/* ══ MODAL IMAGEN ══ */}
            <Modal
                visible={showImgOpts}
                transparent
                animationType="slide"
                onRequestClose={() => setShowImgOpts(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowImgOpts(false)}>
                    <View style={styles.optOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.chatOptsCard}>
                                <View style={styles.sheetHandle} />
                                <Text style={styles.chatOptsTitle}>Enviar imagen</Text>

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => pickAndSend(true)}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#E8F4F5' }]}>
                                        <Ionicons name="camera-outline" size={22} color="#1D3557" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={styles.chatOptTxt}>Tomar foto</Text>
                                        <Text style={styles.chatOptSub}>Usa la cámara del dispositivo</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => pickAndSend(false)}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#EDE7F6' }]}>
                                        <Ionicons name="images-outline" size={22} color="#7B1FA2" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={styles.chatOptTxt}>Elegir de galería</Text>
                                        <Text style={styles.chatOptSub}>Selecciona una foto guardada</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatOptCancel}
                                    onPress={() => setShowImgOpts(false)}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.chatOptCancelTxt}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


            {/* ══ MODAL OPCIONES DEL CHAT (⋮) ══ */}
            <Modal
                visible={showChatOpts}
                transparent
                animationType="slide"
                onRequestClose={() => setShowChatOpts(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowChatOpts(false)}>
                    <View style={styles.optOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.chatOptsCard}>
                                <View style={styles.sheetHandle} />
                                <Text style={styles.chatOptsTitle}>Opciones del chat</Text>

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => {
                                        setShowChatOpts(false);
                                        Alert.alert('Perfil', 'Aquí iría el perfil del vendedor.');
                                    }}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#E8F4F5' }]}>
                                        <Ionicons name="person-outline" size={20} color="#457B9D" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={styles.chatOptTxt}>Ver perfil del vendedor</Text>
                                        <Text style={styles.chatOptSub}>Revisa sus publicaciones y reseñas</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => {
                                        setShowChatOpts(false);
                                        Alert.alert('Marcar como vendido', '¿Confirmás que este artículo ya fue vendido?', [
                                            { text: 'Cancelar', style: 'cancel' },
                                            { text: 'Confirmar', onPress: () => Alert.alert('¡Listo!', 'Artículo marcado como vendido.') },
                                        ]);
                                    }}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#E8F5E9' }]}>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={styles.chatOptTxt}>Marcar como vendido</Text>
                                        <Text style={styles.chatOptSub}>Cierra esta negociación</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => {
                                        setShowChatOpts(false);
                                        Alert.alert('Compartir', 'Función de compartir próximamente.');
                                    }}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#EDE7F6' }]}>
                                        <Ionicons name="share-social-outline" size={20} color="#7B1FA2" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={styles.chatOptTxt}>Compartir publicación</Text>
                                        <Text style={styles.chatOptSub}>Envía el enlace a un amigo</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <View style={styles.chatOptDivider} />

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => {
                                        setShowChatOpts(false);
                                        Alert.alert('Reportar', 'Selecciona el motivo del reporte', [
                                            { text: 'Spam o publicidad',     onPress: () => Alert.alert('Reportado', 'Gracias, revisaremos el caso.') },
                                            { text: 'Contenido inapropiado', onPress: () => Alert.alert('Reportado', 'Gracias, revisaremos el caso.') },
                                            { text: 'Intento de estafa',     onPress: () => Alert.alert('Reportado', 'Gracias, revisaremos el caso.') },
                                            { text: 'Cancelar', style: 'cancel' },
                                        ]);
                                    }}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#FFF3E0' }]}>
                                        <Ionicons name="warning-outline" size={20} color="#F4A261" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={styles.chatOptTxt}>Reportar conversación</Text>
                                        <Text style={styles.chatOptSub}>Spam, estafa o contenido inapropiado</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatOptItem}
                                    onPress={() => {
                                        setShowChatOpts(false);
                                        Alert.alert('Bloquear usuario', '¿Estás seguro? No podrán enviarte mensajes.', [
                                            { text: 'Cancelar', style: 'cancel' },
                                            { text: 'Bloquear', style: 'destructive', onPress: () => Alert.alert('Bloqueado', 'El usuario fue bloqueado.') },
                                        ]);
                                    }}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.chatOptIcon, { backgroundColor: '#FFEBEE' }]}>
                                        <Ionicons name="ban-outline" size={20} color="#E63946" />
                                    </View>
                                    <View style={styles.chatOptInfo}>
                                        <Text style={[styles.chatOptTxt, { color: '#E63946' }]}>Bloquear usuario</Text>
                                        <Text style={styles.chatOptSub}>Ya no podrá contactarte</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatOptCancel}
                                    onPress={() => setShowChatOpts(false)}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.chatOptCancelTxt}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


            {/* ══ MODAL OPCIONES DE MENSAJE (long press) ══ */}
            <Modal
                visible={selectedMsg !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedMsg(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedMsg(null)}>
                    <View style={styles.optOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.optCard}>
                                <View style={styles.sheetHandle} />

                                <View style={styles.optPreview}>
                                    <Ionicons
                                        name={selectedMsg?.body?.startsWith('__IMG__') ? 'image-outline' : 'chatbubble-outline'}
                                        size={14}
                                        color="#aaa"
                                    />
                                    <Text style={styles.optPreviewTxt} numberOfLines={2}>
                                        {selectedMsg?.body?.startsWith('__IMG__') ? 'Imagen' : selectedMsg?.body}
                                    </Text>
                                </View>

                                {selectedMsg?.sender_id === user?.id && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.optItem}
                                            onPress={() => startEdit(selectedMsg)}
                                            accessibilityRole="button"
                                        >
                                            <Ionicons name="create-outline" size={22} color="#1D3557" />
                                            <Text style={styles.optTxt}>Editar mensaje</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.optItem}
                                            onPress={() => deleteMessage(selectedMsg)}
                                            accessibilityRole="button"
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#E63946" />
                                            <Text style={[styles.optTxt, { color: '#E63946' }]}>Eliminar mensaje</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {selectedMsg?.sender_id !== user?.id && (
                                    <TouchableOpacity
                                        style={styles.optItem}
                                        onPress={() => replyTo(selectedMsg)}
                                        accessibilityRole="button"
                                    >
                                        <Ionicons name="return-down-back-outline" size={22} color="#1D3557" />
                                        <Text style={styles.optTxt}>Responder</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.optItem}
                                    onPress={() => {
                                        setSelectedMsg(null);
                                        Alert.alert('Reporte enviado', 'Gracias por tu reporte.');
                                    }}
                                    accessibilityRole="button"
                                >
                                    <Ionicons name="warning-outline" size={22} color="#F4A261" />
                                    <Text style={styles.optTxt}>Reportar mensaje</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.optCancel}
                                    onPress={() => setSelectedMsg(null)}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.optCancelTxt}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


            {/* ══ MODAL AGREGAR MENSAJE RÁPIDO ══ */}
            <Modal
                visible={showAddQuick}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddQuick(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowAddQuick(false)}>
                    <View style={styles.optOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalCard}>
                                <View style={styles.sheetHandle} />
                                <Text style={styles.modalTitle}>Nuevo mensaje rápido</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Escribe tu mensaje personalizado…"
                                    placeholderTextColor="#aaa"
                                    value={newQuickMsg}
                                    onChangeText={setNewQuickMsg}
                                    autoFocus
                                    multiline
                                    maxLength={200}
                                    accessibilityLabel="Nuevo mensaje rápido personalizado"
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancel}
                                        onPress={() => setShowAddQuick(false)}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.modalCancelTxt}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalConfirm}
                                        onPress={addMyQuick}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.modalConfirmTxt}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


            {/* ══ VISOR IMAGEN FULLSCREEN ══ */}
            <Modal
                visible={imageViewer !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setImageViewer(null)}
            >
                <TouchableWithoutFeedback onPress={() => setImageViewer(null)}>
                    <View style={styles.imgViewerBg}>
                        <TouchableWithoutFeedback>
                            <View>
                                {imageViewer !== null && (
                                    <Image
                                        source={{ uri: imageViewer }}
                                        style={styles.imgViewerImg}
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>

                        <TouchableOpacity
                            style={styles.imgViewerClose}
                            onPress={() => setImageViewer(null)}
                            accessibilityLabel="Cerrar imagen"
                            accessibilityRole="button"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>

                        {imageViewer !== null && (
                            <View style={styles.imgViewerActions}>
                                <TouchableOpacity
                                    style={styles.imgViewerBtn}
                                    onPress={() => Linking.openURL(imageViewer)}
                                    accessibilityLabel="Abrir imagen en el navegador"
                                    accessibilityRole="button"
                                >
                                    <Ionicons name="open-outline" size={16} color="#fff" />
                                    <Text style={styles.imgViewerBtnTxt}>Abrir en navegador</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:              { flex: 1, backgroundColor: '#F1FAEE' },
    centered:               { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingTxt:             { fontSize: 15, color: '#888' },

    header:                 {
        backgroundColor:    '#1D3557',
        paddingHorizontal:  12,
        paddingVertical:    10,
        flexDirection:      'row',
        alignItems:         'center',
        gap:                10,
    },
    backBtn:                { padding: 6 },
    headerInfo:             { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar:           {
        width:              42,
        height:             42,
        borderRadius:       21,
        backgroundColor:    'rgba(255,255,255,0.15)',
        justifyContent:     'center',
        alignItems:         'center',
    },
    headerTitle:            { color: '#fff', fontSize: 16, fontWeight: '700' },
    headerSub:              { color: '#A8DADC', fontSize: 12 },
    menuBtn:                { padding: 8 },

    productBanner:          {
        backgroundColor:    '#1D3557',
        paddingHorizontal:  14,
        paddingVertical:    8,
        borderBottomWidth:  1,
        borderBottomColor:  'rgba(255,255,255,0.1)',
        flexDirection:      'row',
        alignItems:         'center',
        gap:                8,
    },
    productBannerIcon:      { justifyContent: 'center', alignItems: 'center' },
    productBannerTxt:       { color: '#fff', fontSize: 13, fontWeight: '600' },
    productBannerSub:       { color: '#A8DADC', fontSize: 11, marginTop: 1 },

    msgList:                { padding: 12, flexGrow: 1 },

    emptyChat:              {
        flex:               1,
        alignItems:         'center',
        justifyContent:     'center',
        paddingTop:         60,
        paddingHorizontal:  40,
        gap:                12,
    },
    emptyIcon:              {
        width:              80,
        height:             80,
        borderRadius:       40,
        backgroundColor:    'rgba(168,218,220,0.2)',
        justifyContent:     'center',
        alignItems:         'center',
        marginBottom:       4,
    },
    emptyChatTitle:         { fontSize: 19, fontWeight: '700', color: '#1D3557' },
    emptyChatSub:           { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },

    dateSep:                { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
    dateLine:               { flex: 1, height: 1, backgroundColor: '#ddd' },
    dateText:               {
        fontSize:           13,
        color:              '#666',
        backgroundColor:    '#e4ede4',
        paddingHorizontal:  12,
        paddingVertical:    4,
        borderRadius:       12,
    },

    msgRow:                 {
        flexDirection:      'row',
        marginBottom:       6,
        alignItems:         'flex-end',
        gap:                6,
        paddingHorizontal:  2,
    },
    msgRowMe:               { justifyContent: 'flex-end' },
    msgRowSelected:         { backgroundColor: 'rgba(29,53,87,0.07)', borderRadius: 10 },
    avatarSmall:            {
        width:              30,
        height:             30,
        borderRadius:       15,
        backgroundColor:    '#A8DADC',
        justifyContent:     'center',
        alignItems:         'center',
    },
    bubble:                 { maxWidth: '78%', padding: 10, borderRadius: 18 },
    bubbleMe:               { backgroundColor: '#1D3557', borderBottomRightRadius: 4 },
    bubbleThem:             { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#eee' },
    bubbleImg:              { padding: 4 },
    bubbleDeleted:          { backgroundColor: '#f5f5f5', borderColor: '#ddd' },
    bubbleSelected:         { opacity: 0.82 },
    deletedRow:             { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deletedTxt:             { fontSize: 13, color: '#bbb', fontStyle: 'italic' },
    bubbleTxt:              { fontSize: 16, color: '#1D3557', lineHeight: 22 },
    bubbleTxtMe:            { color: '#fff' },
    msgMeta:                { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3 },
    editedLbl:              { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
    bubbleTime:             { fontSize: 11, color: '#aaa' },
    bubbleTimeMe:           { color: 'rgba(168,218,220,0.7)' },
    bubbleTimeImg:          { color: '#A8DADC', marginTop: 4, textAlign: 'right', fontSize: 11 },
    chatImg:                { width: 200, height: 200, borderRadius: 12 },

    editBanner:             {
        flexDirection:      'row',
        alignItems:         'center',
        gap:                8,
        backgroundColor:    '#FFF9E6',
        paddingHorizontal:  16,
        paddingVertical:    10,
        borderTopWidth:     1,
        borderTopColor:     '#F4A261',
    },
    editBannerTxt:          { flex: 1, fontSize: 13, color: '#F4A261', fontWeight: '600' },

    quickPanel:             { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', maxHeight: 260 },
    quickPanelHeader:       {
        flexDirection:      'row',
        justifyContent:     'space-between',
        alignItems:         'center',
        paddingHorizontal:  16,
        paddingVertical:    12,
        borderBottomWidth:  1,
        borderBottomColor:  '#eee',
    },
    quickPanelTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    quickPanelTitle:        { fontSize: 14, fontWeight: '700', color: '#1D3557' },
    addQuickBtn:            { fontSize: 14, color: '#E63946', fontWeight: '700' },
    quickItem:              { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    quickItemTxt:           { fontSize: 15, color: '#1D3557' },
    quickItemHint:          { fontSize: 11, color: '#bbb', marginTop: 2 },

    inputBar:               {
        flexDirection:      'row',
        padding:            10,
        gap:                8,
        backgroundColor:    '#1D3557',
        alignItems:         'flex-end',
        borderTopWidth:     1,
        borderTopColor:     '#2a4a6e',
    },
    iconBtn:                {
        width:              44,
        height:             44,
        borderRadius:       22,
        backgroundColor:    'rgba(168,218,220,0.15)',
        justifyContent:     'center',
        alignItems:         'center',
        borderWidth:        1.5,
        borderColor:        '#A8DADC',
    },
    iconBtnActive:          { backgroundColor: '#E63946', borderColor: '#E63946' },
    input:                  {
        flex:               1,
        backgroundColor:    '#2a4a6e',
        borderRadius:       24,
        paddingHorizontal:  16,
        paddingVertical:    12,
        fontSize:           16,
        color:              '#fff',
        maxHeight:          120,
        borderWidth:        1,
        borderColor:        '#A8DADC',
    },
    sendBtn:                {
        width:              44,
        height:             44,
        borderRadius:       22,
        backgroundColor:    '#E63946',
        justifyContent:     'center',
        alignItems:         'center',
    },
    sendBtnOff:             { backgroundColor: 'rgba(168,218,220,0.25)' },

    sheetHandle:            {
        width:              40,
        height:             4,
        backgroundColor:    '#ddd',
        borderRadius:       2,
        alignSelf:          'center',
        marginBottom:       14,
    },

    optOverlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },

    chatOptsCard:           {
        backgroundColor:    '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop:         16,
        paddingBottom:      24,
    },
    chatOptsTitle:          {
        fontSize:           17,
        fontWeight:         '700',
        color:              '#1D3557',
        paddingHorizontal:  22,
        marginBottom:       8,
    },
    chatOptItem:            {
        flexDirection:      'row',
        alignItems:         'center',
        paddingHorizontal:  20,
        paddingVertical:    14,
        gap:                14,
    },
    chatOptIcon:            {
        width:              42,
        height:             42,
        borderRadius:       21,
        justifyContent:     'center',
        alignItems:         'center',
        flexShrink:         0,
    },
    chatOptInfo:            { flex: 1 },
    chatOptTxt:             { fontSize: 15, fontWeight: '600', color: '#1D3557' },
    chatOptSub:             { fontSize: 12, color: '#aaa', marginTop: 1 },
    chatOptDivider:         { height: 1, backgroundColor: '#f0f0f0', marginVertical: 6, marginHorizontal: 20 },
    chatOptCancel:          {
        marginHorizontal:   16,
        marginTop:          10,
        backgroundColor:    '#f5f5f5',
        borderRadius:       14,
        paddingVertical:    15,
        alignItems:         'center',
    },
    chatOptCancelTxt:       { fontSize: 16, fontWeight: '700', color: '#888' },

    optCard:                {
        backgroundColor:    '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop:         16,
        paddingBottom:      16,
    },
    optPreview:             {
        flexDirection:      'row',
        alignItems:         'center',
        gap:                8,
        paddingHorizontal:  20,
        paddingVertical:    12,
        marginHorizontal:   16,
        marginBottom:       8,
        backgroundColor:    '#F1FAEE',
        borderRadius:       12,
    },
    optPreviewTxt:          { flex: 1, fontSize: 13, color: '#888', fontStyle: 'italic' },
    optItem:                {
        flexDirection:      'row',
        alignItems:         'center',
        paddingHorizontal:  22,
        paddingVertical:    16,
        borderBottomWidth:  1,
        borderBottomColor:  '#f5f5f5',
        gap:                14,
        minHeight:          56,
    },
    optTxt:                 { fontSize: 16, color: '#1D3557' },
    optCancel:              {
        marginHorizontal:   16,
        marginTop:          8,
        backgroundColor:    '#f5f5f5',
        borderRadius:       14,
        paddingVertical:    15,
        alignItems:         'center',
    },
    optCancelTxt:           { fontSize: 16, fontWeight: '700', color: '#888' },

    modalCard:              {
        backgroundColor:    '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop:         16,
        paddingHorizontal:  24,
        paddingBottom:      32,
        gap:                16,
    },
    modalTitle:             { fontSize: 18, fontWeight: '700', color: '#1D3557' },
    modalInput:             {
        backgroundColor:    '#F1FAEE',
        borderRadius:       12,
        padding:            14,
        fontSize:           16,
        color:              '#1D3557',
        borderWidth:        1.5,
        borderColor:        '#A8DADC',
        minHeight:          80,
        textAlignVertical:  'top',
    },
    modalActions:           { flexDirection: 'row', gap: 12 },
    modalCancel:            {
        flex:               1,
        borderWidth:        1,
        borderColor:        '#ccc',
        borderRadius:       12,
        paddingVertical:    15,
        alignItems:         'center',
    },
    modalCancelTxt:         { color: '#888', fontSize: 16, fontWeight: '600' },
    modalConfirm:           {
        flex:               1,
        backgroundColor:    '#1D3557',
        borderRadius:       12,
        paddingVertical:    15,
        alignItems:         'center',
    },
    modalConfirmTxt:        { color: '#fff', fontSize: 16, fontWeight: '700' },

    imgViewerBg:            {
        flex:               1,
        backgroundColor:    'rgba(0,0,0,0.95)',
        justifyContent:     'center',
        alignItems:         'center',
    },
    imgViewerClose:         {
        position:           'absolute',
        top:                52,
        right:              20,
        zIndex:             10,
        padding:            12,
        backgroundColor:    'rgba(255,255,255,0.12)',
        borderRadius:       25,
    },
    imgViewerImg:           { width: SW, height: SH * 0.75 },
    imgViewerActions:       { position: 'absolute', bottom: 60, flexDirection: 'row', gap: 12 },
    imgViewerBtn:           {
        flexDirection:      'row',
        alignItems:         'center',
        gap:                6,
        backgroundColor:    'rgba(255,255,255,0.15)',
        paddingHorizontal:  20,
        paddingVertical:    12,
        borderRadius:       25,
        borderWidth:        1,
        borderColor:        'rgba(255,255,255,0.3)',
    },
    imgViewerBtnTxt:        { color: '#fff', fontSize: 15, fontWeight: '600' },
});