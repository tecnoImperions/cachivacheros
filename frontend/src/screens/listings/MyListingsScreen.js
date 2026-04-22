import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const COLORS = {
    navy:      '#1D3557',
    accent:    '#E63946',
    teal:      '#A8DADC',
    tealDark:  '#457B9D',
    cream:     '#F1FAEE',
    white:     '#FFFFFF',
    border:    '#E8EEF4',
    muted:     '#8899AA',
    green:     '#2ECC71',
    greenBg:   '#E8F8F0',
    orange:    '#F4A261',
    orangeBg:  '#FFF3E0',
    redBg:     '#FDECEA',
};

const getStatus = (status) => {
    switch (status) {
        case 'active': return { label: 'Activa',  color: COLORS.green,  bg: COLORS.greenBg,  emoji: '🟢' };
        case 'sold':   return { label: 'Vendida', color: COLORS.accent, bg: COLORS.redBg,    emoji: '✅' };
        case 'paused': return { label: 'Pausada', color: COLORS.orange, bg: COLORS.orangeBg, emoji: '⏸' };
        default:       return { label: status,    color: COLORS.muted,  bg: '#F5F5F5',       emoji: '⚪' };
    }
};

export default function MyListingsScreen({ navigation }) {
    const [listings,   setListings]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => { fetchMyListings(); }, [])
    );

    const fetchMyListings = async () => {
        try {
            const response = await api.get('/my-listings');
            setListings(response.data);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Eliminar publicación',
            '¿Estás seguro? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text:    'Eliminar',
                    style:   'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/listings/${id}`);
                            setListings(prev => prev.filter(l => l.id !== id));
                        } catch {
                            Alert.alert('Error', 'No se pudo eliminar la publicación.');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleStatus = async (item) => {
        const newStatus = item.status === 'active' ? 'paused' : 'active';
        try {
            await api.put(`/listings/${item.id}`, { status: newStatus });
            setListings(prev =>
                prev.map(l => l.id === item.id ? { ...l, status: newStatus } : l)
            );
        } catch {
            Alert.alert('Error', 'No se pudo actualizar el estado.');
        }
    };

    const activeCount = listings.filter(l => l.status === 'active').length;
    const soldCount   = listings.filter(l => l.status === 'sold').length;
    const pausedCount = listings.filter(l => l.status === 'paused').length;

    const renderItem = ({ item }) => {
        const status = getStatus(item.status);
        return (
            <View style={styles.card}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                )}

                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.cardPrice}>
                        Bs. {parseFloat(item.price).toFixed(2)}
                    </Text>
                    {item.category && (
                        <Text style={styles.cardCategory}>📁 {item.category}</Text>
                    )}

                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.emoji}  {status.label}
                        </Text>
                    </View>

                    {item.status !== 'sold' && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                activeOpacity={0.75}
                                onPress={() => handleToggleStatus(item)}
                            >
                                <Text style={styles.actionBtnText}>
                                    {item.status === 'active' ? '⏸  Pausar' : '▶  Activar'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnDanger]}
                                activeOpacity={0.75}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>
                                    🗑  Eliminar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mis publicaciones</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.navy} />
                    <Text style={styles.loadingText}>Cargando publicaciones…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis publicaciones</Text>
                <Text style={styles.headerSub}>
                    {listings.length} publicación{listings.length !== 1 ? 'es' : ''}
                </Text>
            </View>

            {listings.length > 0 && (
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryNumber, { color: COLORS.green }]}>{activeCount}</Text>
                        <Text style={styles.summaryLabel}>Activas</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryNumber, { color: COLORS.accent }]}>{soldCount}</Text>
                        <Text style={styles.summaryLabel}>Vendidas</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryNumber, { color: COLORS.orange }]}>{pausedCount}</Text>
                        <Text style={styles.summaryLabel}>Pausadas</Text>
                    </View>
                </View>
            )}

            <FlatList
                data={listings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchMyListings(); }}
                        colors={[COLORS.navy]}
                        tintColor={COLORS.navy}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 60 }}>📭</Text>
                        <Text style={styles.emptyTitle}>Sin publicaciones</Text>
                        <Text style={styles.emptySub}>
                            Toca el botón ➕ para publicar tu primer producto
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: COLORS.cream },
    centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: COLORS.muted, fontSize: 14 },

    header: {
        backgroundColor:   COLORS.navy,
        paddingHorizontal: 20,
        paddingVertical:   18,
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

    summaryRow: {
        flexDirection:   'row',
        marginHorizontal: 16,
        marginTop:       16,
        marginBottom:    4,
        gap:             10,
    },
    summaryCard: {
        flex:            1,
        backgroundColor: COLORS.white,
        borderRadius:    14,
        paddingVertical: 14,
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     COLORS.border,
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 2 },
        shadowOpacity:   0.05,
        shadowRadius:    6,
        elevation:       2,
    },
    summaryNumber: { fontSize: 24, fontWeight: '900' },
    summaryLabel:  { fontSize: 11, color: COLORS.muted, marginTop: 3, fontWeight: '600' },

    list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110, gap: 12 },

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
    cardImage:            { width: 115, height: 160, resizeMode: 'cover' },
    cardImagePlaceholder: {
        width:           115,
        height:          160,
        backgroundColor: '#EEF4F8',
        justifyContent:  'center',
        alignItems:      'center',
    },
    cardBody:     { flex: 1, padding: 14, gap: 6 },
    cardTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.navy, lineHeight: 20 },
    cardPrice:    { fontSize: 18, fontWeight: '900', color: COLORS.accent },
    cardCategory: { fontSize: 12, color: COLORS.tealDark, fontWeight: '500' },

    badge: {
        alignSelf:         'flex-start',
        paddingHorizontal: 10,
        paddingVertical:   4,
        borderRadius:      20,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },

    actions:         { flexDirection: 'row', gap: 8, marginTop: 4 },
    actionBtn: {
        flex:            1,
        backgroundColor: COLORS.cream,
        borderRadius:    10,
        paddingVertical: 8,
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     COLORS.teal,
    },
    actionBtnDanger: { backgroundColor: COLORS.redBg, borderColor: '#FFBDBD' },
    actionBtnText:   { fontSize: 12, fontWeight: '700', color: COLORS.navy },

    empty:      { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.navy },
    emptySub:   { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
});