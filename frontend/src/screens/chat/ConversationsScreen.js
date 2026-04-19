import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function ConversationsScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [])
    );

    const fetchConversations = async () => {
        try {
            const response = await api.get('/conversations');
            setConversations(response.data);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chat', {
                listingId:  item.listing_id,
                receiverId: item.sender_id,
                title:      item.listing?.title,
            })}
        >
            <View style={styles.avatar}>
                <Text style={{ fontSize: 24 }}>💬</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                    {item.listing?.title || 'Publicación'}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.body}
                </Text>
                <Text style={styles.time}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            {!item.read && item.receiver_id && (
                <View style={styles.unreadDot} />
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1D3557" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>💬 Mis conversaciones</Text>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchConversations(); }}
                        colors={['#1D3557']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={{ fontSize: 48 }}>💭</Text>
                        <Text style={styles.emptyText}>No tienes conversaciones aún</Text>
                    </View>
                }
            />
        </View>
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
        paddingTop:     60,
    },
    header: {
        backgroundColor:   '#1D3557',
        paddingTop:        52,
        paddingBottom:     16,
        paddingHorizontal: 20,
    },
    headerTitle: {
        color:      '#fff',
        fontSize:   20,
        fontWeight: '700',
    },
    list: {
        padding: 16,
        gap:     10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius:    12,
        flexDirection:   'row',
        padding:         14,
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     '#eee',
        gap:             12,
    },
    avatar: {
        width:           48,
        height:          48,
        borderRadius:    24,
        backgroundColor: '#F1FAEE',
        justifyContent:  'center',
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     '#A8DADC',
    },
    cardBody: {
        flex: 1,
        gap:  3,
    },
    listingTitle: {
        fontSize:   14,
        fontWeight: '700',
        color:      '#1D3557',
    },
    lastMessage: {
        fontSize: 13,
        color:    '#888',
    },
    time: {
        fontSize: 11,
        color:    '#aaa',
    },
    unreadDot: {
        width:           10,
        height:          10,
        borderRadius:    5,
        backgroundColor: '#E63946',
    },
    emptyText: {
        fontSize:  16,
        color:     '#888',
        marginTop: 12,
    },
});