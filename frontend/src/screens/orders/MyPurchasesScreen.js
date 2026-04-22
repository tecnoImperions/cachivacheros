import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Image,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const COLORS = {
    navy:     '#1D3557',
    accent:   '#E63946',
    teal:     '#A8DADC',
    tealDark: '#457B9D',
    cream:    '#F1FAEE',
    white:    '#FFFFFF',
    border:   '#E8EEF4',
    muted:    '#8899AA',
    green:    '#2ECC71',
    greenBg:  '#E8F8F0',
    orange:   '#F4A261',
    orangeBg: '#FFF3E0',
    redBg:    '#FDECEA',
};

const getStatus = (status) => {
    switch (status) {
        case 'confirmed': return { label: 'Confirmada', color: COLORS.green,  bg: COLORS.greenBg,  emoji: '✅' };
        case 'cancelled': return { label: 'Cancelada',  color: COLORS.accent, bg: COLORS.redBg,    emoji: '❌' };
        case 'pending':   return { label: 'Pendiente',  color: COLORS.orange, bg: COLORS.orangeBg, emoji: '⏳' };
        default:          return { label: status,        color: COLORS.muted,  bg: '#F5F5F5',       emoji: '⚪' };
    }
};

export default function MyPurchasesScreen({ navigation }) {
    const [orders,     setOrders]     = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => { fetchOrders(); }, [])
    );

    const fetchOrders = async () => {
        try {
            const response = await api.get('/my-purchases');
            setOrders(response.data);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const totalSpent = orders
        .filter(o => o.status === 'confirmed')
        .reduce((acc, o) => acc + parseFloat(o.amount), 0);

    const renderItem = ({ item }) => {
        const status = getStatus(item.status);
        return (
            <View style={styles.card}>
                {item.listing?.image_url ? (
                    <Image source={{ uri: item.listing.image_url }} style={styles.cardImage} />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                )}

                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.listing?.title}
                    </Text>
                    <Text style={styles.cardPrice}>
                        Bs. {parseFloat(item.amount).toFixed(2)}
                    </Text>

                    {item.seller?.name && (
                        <View style={styles.sellerRow}>
                            <View style={styles.sellerAvatar}>
                                <Text style={styles.sellerAvatarText}>
                                    {item.seller.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.sellerName}>{item.seller.name}</Text>
                        </View>
                    )}

                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.emoji}  {status.label}
                        </Text>
                    </View>

                    {item.status === 'pending' && (
                        <TouchableOpacity
                            style={styles.chatBtn}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('chat', {
                                listingId:  item.listing_id,
                                receiverId: item.seller_id,
                                title:      item.listing?.title,
                            })}
                        >
                            <Text style={styles.chatBtnText}>💬  Coordinar con vendedor</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mis compras</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                    <Text style={styles.loadingText}>Cargando compras…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Mis compras</Text>
                    <Text style={styles.headerSub}>
                        {orders.length} compra{orders.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                {orders.length > 0 && (
                    <View style={styles.totalBadge}>
                        <Text style={styles.totalLabel}>Total gastado</Text>
                        <Text style={styles.totalAmount}>Bs. {totalSpent.toFixed(2)}</Text>
                    </View>
                )}
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchOrders(); }}
                        colors={[COLORS.navy]}
                        tintColor={COLORS.navy}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 60 }}>🛒</Text>
                        <Text style={styles.emptyTitle}>Sin compras aún</Text>
                        <Text style={styles.emptySub}>
                            Explora los productos disponibles y realiza tu primera compra
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: COLORS.cream },
    centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: COLORS.muted, fontSize: 14 },

    header: {
        backgroundColor:   COLORS.navy,
        paddingHorizontal: 20,
        paddingVertical:   18,
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
    },
    headerTitle: {
        color:         COLORS.white,
        fontSize:      22,
        fontWeight:    '800',
        letterSpacing: -0.3,
    },
    headerSub: {
        color:      COLORS.teal,
        fontSize:   13,
        marginTop:  2,
        fontWeight: '500',
    },
    totalBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius:    12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems:      'flex-end',
        borderWidth:     1,
        borderColor:     'rgba(168,218,220,0.3)',
    },
    totalLabel: {
        color:         COLORS.teal,
        fontSize:      10,
        fontWeight:    '600',
        letterSpacing: 0.5,
    },
    totalAmount: {
        color:      COLORS.white,
        fontSize:   16,
        fontWeight: '900',
    },

    list: { padding: 16, paddingBottom: 110, gap: 12 },

    card: {
        backgroundColor: COLORS.white,
        borderRadius:    16,
        overflow:        'hidden',
        flexDirection:   'row',
        borderWidth:     1,
        borderColor:     COLORS.border,
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 2 },
        shadowOpacity:   0.06,
        shadowRadius:    8,
        elevation:       3,
    },
    cardImage:            { width: 115, height: 155, resizeMode: 'cover' },
    cardImagePlaceholder: {
        width:           115,
        height:          155,
        backgroundColor: '#EEF4F8',
        justifyContent:  'center',
        alignItems:      'center',
    },
    cardBody:  { flex: 1, padding: 14, gap: 6 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy, lineHeight: 20 },
    cardPrice: { fontSize: 18, fontWeight: '900', color: COLORS.accent },

    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sellerAvatar: {
        width:           22,
        height:          22,
        borderRadius:    11,
        backgroundColor: COLORS.teal,
        justifyContent:  'center',
        alignItems:      'center',
    },
    sellerAvatarText: { fontSize: 11, fontWeight: '700', color: COLORS.navy },
    sellerName:       { fontSize: 12, color: COLORS.muted, fontWeight: '500' },

    badge: {
        alignSelf:         'flex-start',
        paddingHorizontal: 10,
        paddingVertical:   4,
        borderRadius:      20,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },

    chatBtn: {
        backgroundColor:   COLORS.navy,
        borderRadius:      10,
        paddingVertical:   9,
        paddingHorizontal: 12,
        alignItems:        'center',
        marginTop:         4,
    },
    chatBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },

    empty:      { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.navy },
    emptySub:   { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
});