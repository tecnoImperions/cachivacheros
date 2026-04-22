import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const POLL_INTERVAL = 10000; // 10 segundos

export default function ConversationsScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);

    const fetchConversations = async (silent = false) => {
        try {
            const response = await api.get('/conversations');
            setConversations(response.data);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            if (!silent) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    // Recarga al entrar a la pantalla
    useFocusEffect(
        useCallback(() => {
            fetchConversations();

            // Polling automático mientras la pantalla está activa
            const interval = setInterval(() => {
                fetchConversations(true); // silent: no toca el loading spinner
            }, POLL_INTERVAL);

            return () => clearInterval(interval); // limpieza al salir
        }, [])
    );

    const formatTime = (d) => {
        if (!d) return '';
        const date = new Date(d), now = new Date(), diff = now - date;
        if (diff < 86400000)  return new Date(d).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
        return date.toLocaleDateString('es-BO');
    };

    const getPreview = (msg) => {
        if (!msg)                             return 'Sin mensajes aún';
        if (msg.deleted)                      return 'Mensaje eliminado';
        if (msg.body?.startsWith('__IMG__'))  return 'Imagen';
        return msg.body?.slice(0, 55) || '';
    };

    const getPreviewIcon = (msg) => {
        if (!msg)                            return null;
        if (msg.deleted)                     return 'ban-outline';
        if (msg.body?.startsWith('__IMG__')) return 'image-outline';
        return null;
    };

    const getInitials = (str) =>
        str
            ?.split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?';

    const renderItem = ({ item }) => {
        const last    = item.last_message;
        const unread  = item.unread_count || 0;
        const listing = item.listing;
        const previewIcon = getPreviewIcon(last);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() =>
                    navigation.navigate('chat', {
                        listingId:  last?.listing_id,
                        receiverId: last?.sender_id,
                        title:      listing?.title,
                    })
                }
                activeOpacity={0.82}
                accessibilityLabel={`Conversación sobre ${listing?.title || 'publicación'}. ${unread > 0 ? `${unread} mensajes sin leer.` : ''}`}
                accessibilityRole="button"
            >
                <View style={[styles.avatar, unread > 0 && styles.avatarUnread]}>
                    <Text style={[styles.avatarInitials, unread > 0 && styles.avatarInitialsUnread]}>
                        {getInitials(listing?.title)}
                    </Text>
                </View>

                <View style={styles.info}>
                    <View style={styles.infoTop}>
                        <Text style={[styles.listingTitle, unread > 0 && styles.listingTitleUnread]} numberOfLines={1}>
                            {listing?.title || 'Publicación'}
                        </Text>
                        <Text style={styles.time}>
                            {formatTime(last?.created_at)}
                        </Text>
                    </View>

                    <View style={styles.infoBottom}>
                        <View style={styles.previewRow}>
                            {previewIcon && (
                                <Ionicons
                                    name={previewIcon}
                                    size={13}
                                    color={unread > 0 ? '#1D3557' : '#aaa'}
                                    style={{ marginTop: 1 }}
                                />
                            )}
                            <Text
                                style={[styles.preview, unread > 0 && styles.previewUnread]}
                                numberOfLines={1}
                            >
                                {getPreview(last)}
                            </Text>
                        </View>

                        {unread > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {unread > 99 ? '99+' : unread}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chats</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1D3557" />
                    <Text style={styles.loadingTxt}>Cargando conversaciones…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Chats</Text>
                    <Text style={styles.headerSub}>
                        {conversations.length}{' '}
                        {conversations.length === 1 ? 'conversación' : 'conversaciones'}
                    </Text>
                </View>
                <View style={styles.headerIcon}>
                    <Ionicons name="chatbubbles" size={22} color="#A8DADC" />
                </View>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(_, i) => i.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchConversations(); }}
                        colors={['#1D3557']}
                        tintColor="#1D3557"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrapper}>
                            <Ionicons name="chatbubbles-outline" size={52} color="#A8DADC" />
                        </View>
                        <Text style={styles.emptyTitle}>Sin conversaciones</Text>
                        <Text style={styles.emptySub}>
                            Cuando chatees con un vendedor o comprador, la conversación aparecerá aquí
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#F1FAEE' },
    centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingTxt:   { fontSize: 15, color: '#888' },

    header:       {
        backgroundColor:   '#1D3557',
        paddingHorizontal: 20,
        paddingVertical:   16,
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
    },
    headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '700' },
    headerSub:    { color: '#A8DADC', fontSize: 13, marginTop: 2 },
    headerIcon:   {
        width:           44,
        height:          44,
        borderRadius:    22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent:  'center',
        alignItems:      'center',
    },

    list:         { flexGrow: 1, backgroundColor: '#fff' },
    separator:    { height: 1, backgroundColor: '#f2f2f2', marginLeft: 80 },

    card:         {
        flexDirection:     'row',
        alignItems:        'center',
        backgroundColor:   '#fff',
        paddingHorizontal: 16,
        paddingVertical:   14,
        gap:               12,
        minHeight:         72,
    },

    avatar:       {
        width:           52,
        height:          52,
        borderRadius:    26,
        backgroundColor: '#E8F4F5',
        justifyContent:  'center',
        alignItems:      'center',
        borderWidth:     1.5,
        borderColor:     '#A8DADC',
        flexShrink:      0,
    },
    avatarUnread: {
        backgroundColor: '#1D3557',
        borderColor:     '#1D3557',
    },
    avatarInitials: {
        fontSize:   15,
        fontWeight: '700',
        color:      '#457B9D',
    },
    avatarInitialsUnread: {
        color: '#A8DADC',
    },

    info:         { flex: 1, minWidth: 0 },
    infoTop:      {
        flexDirection:  'row',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   4,
    },
    listingTitle: {
        fontSize:    15,
        fontWeight:  '600',
        color:       '#888',
        flex:        1,
        marginRight: 6,
    },
    listingTitleUnread: {
        color:      '#1D3557',
        fontWeight: '700',
    },
    time:         { fontSize: 12, color: '#bbb', flexShrink: 0 },

    infoBottom:   {
        flexDirection:  'row',
        justifyContent: 'space-between',
        alignItems:     'center',
        gap:            6,
    },
    previewRow:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
    preview:      { fontSize: 14, color: '#aaa', flex: 1 },
    previewUnread:{ color: '#1D3557', fontWeight: '600' },

    unreadBadge:  {
        backgroundColor:   '#E63946',
        borderRadius:      14,
        minWidth:          24,
        height:            24,
        justifyContent:    'center',
        alignItems:        'center',
        paddingHorizontal: 7,
        flexShrink:        0,
    },
    unreadText:   { color: '#fff', fontSize: 12, fontWeight: '700' },

    empty:        {
        flex:              1,
        alignItems:        'center',
        paddingTop:        100,
        paddingHorizontal: 40,
        gap:               14,
    },
    emptyIconWrapper: {
        width:           90,
        height:          90,
        borderRadius:    45,
        backgroundColor: 'rgba(168,218,220,0.15)',
        justifyContent:  'center',
        alignItems:      'center',
        marginBottom:    4,
    },
    emptyTitle:   { fontSize: 20, fontWeight: '700', color: '#1D3557', textAlign: 'center' },
    emptySub:     { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 23 },
});