import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Image,
    RefreshControl,
    ScrollView,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const { width: SW } = Dimensions.get('window');
const CARD_W        = (SW - 48) / 2;
const TAB_H         = Platform.OS === 'android' ? 70 : 85;

const CATEGORIES = [
    { label: 'Todo',        icon: '🛍️' },
    { label: 'Electrónica', icon: '📱' },
    { label: 'Ropa',        icon: '👕' },
    { label: 'Hogar',       icon: '🏠' },
    { label: 'Juguetes',    icon: '🧸' },
    { label: 'Deportes',    icon: '⚽' },
    { label: 'Libros',      icon: '📚' },
    { label: 'Autos',       icon: '🚗' },
    { label: 'Otros',       icon: '📦' },
];

const CONDITION_LABEL = {
    new:      '✨ Nuevo',
    like_new: '⭐ Como nuevo',
    good:     '👍 Buen estado',
    fair:     '🔧 Regular',
};

export default function ListingsScreen({ navigation }) {
    const [listings,     setListings]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);
    const [search,       setSearch]       = useState('');
    const [category,     setCategory]     = useState('Todo');
    const [unreadTotal,  setUnreadTotal]  = useState(0); // total mensajes sin leer

    useFocusEffect(
        useCallback(() => {
            fetchListings();
            fetchUnreadCount();
        }, [])
    );

    const fetchListings = async () => {
        try {
            const response = await api.get('/listings');
            setListings(response.data.data);
        } catch (error) {
            console.log('Error listings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Trae las conversaciones y suma todos los unread_count
    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/conversations');
            const total = (response.data || []).reduce(
                (sum, conv) => sum + (conv.unread_count || 0),
                0
            );
            setUnreadTotal(total);
        } catch (error) {
            console.log('Error unread:', error);
        }
    };

    const filtered = listings.filter(l => {
        const matchSearch   = l.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = category === 'Todo' || l.category === category;
        return matchSearch && matchCategory;
    });

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listing: item })}
            activeOpacity={0.88}
        >
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 40 }}>📦</Text>
                </View>
            )}

            <View style={styles.badgesRow}>
                {item.featured && (
                    <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeTxt}>⭐ Destacado</Text>
                    </View>
                )}
                {item.urgent && (
                    <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeTxt}>🔥 Urgente</Text>
                    </View>
                )}
            </View>

            {item.category && (
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
            )}

            {item.delivery && (
                <View style={styles.deliveryBadge}>
                    <Text style={styles.deliveryBadgeTxt}>🚚</Text>
                </View>
            )}

            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                {item.condition && (
                    <Text style={styles.cardCondition}>
                        {CONDITION_LABEL[item.condition] || ''}
                    </Text>
                )}

                <Text style={styles.cardPrice}>
                    Bs. {parseFloat(item.price).toFixed(2)}
                </Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardUser} numberOfLines={1}>
                        👤 {item.user?.name}
                    </Text>
                    <View style={styles.statusDot} />
                </View>

                {item.location && (
                    <Text style={styles.cardLocation} numberOfLines={1}>
                        📍 {item.location}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>🏪 Cachivacheros</Text>
                        <Text style={styles.headerSub}>Encuentra lo que necesitas</Text>
                    </View>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1D3557" />
                    <Text style={{ color: '#457B9D', marginTop: 12, fontSize: 14 }}>Cargando productos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🏪 Cachivacheros</Text>
                    <Text style={styles.headerSub}>Santa Cruz · Bolivia</Text>
                </View>

                <View style={styles.headerActions}>
                    {/* Campana de notificaciones */}
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => navigation.navigate('conversations')}
                        accessibilityLabel={`Chats${unreadTotal > 0 ? `, ${unreadTotal} mensajes sin leer` : ''}`}
                        accessibilityRole="button"
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#A8DADC" />
                        {unreadTotal > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeTxt}>
                                    {unreadTotal > 99 ? '99+' : unreadTotal}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Perfil */}
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => navigation.navigate('profile')}
                    >
                        <Text style={{ fontSize: 22 }}>👤</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Buscador */}
            <View style={styles.searchWrap}>
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar productos en Santa Cruz..."
                        placeholderTextColor="#aaa"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text style={{ color: '#aaa', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categorías */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.label}
                        style={[styles.catBtn, category === cat.label && styles.catBtnActive]}
                        onPress={() => setCategory(cat.label)}
                    >
                        <Text style={styles.catIcon}>{cat.icon}</Text>
                        <Text style={[styles.catLabel, category === cat.label && styles.catLabelActive]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Contador */}
            <View style={styles.resultsRow}>
                <Text style={styles.resultsText}>
                    {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
                    {category !== 'Todo' ? ` en ${category}` : ''}
                </Text>
                {search.length > 0 && (
                    <Text style={styles.searchingFor}>"{search}"</Text>
                )}
            </View>

            {/* Lista de productos */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={[
                    styles.list,
                    { paddingBottom: TAB_H + 20 },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchListings();
                            fetchUnreadCount();
                        }}
                        colors={['#1D3557']}
                        tintColor="#1D3557"
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 60 }}>🏜️</Text>
                        <Text style={styles.emptyTitle}>Sin resultados</Text>
                        <Text style={styles.emptyText}>
                            {search
                                ? `No encontramos "${search}"`
                                : category !== 'Todo'
                                ? `No hay productos en "${category}"`
                                : 'Aún no hay publicaciones'}
                        </Text>
                        {category !== 'Todo' && (
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => setCategory('Todo')}
                            >
                                <Text style={styles.emptyBtnTxt}>Ver todos los productos</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:         { flex: 1, backgroundColor: '#F1FAEE' },
    centered:          { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ── Header
    header:            {
        backgroundColor:   '#1D3557',
        paddingHorizontal: 20,
        paddingVertical:   14,
        flexDirection:     'row',
        justifyContent:    'space-between',
        alignItems:        'center',
    },
    headerTitle:       { color: '#fff', fontSize: 22, fontWeight: '800' },
    headerSub:         { color: '#A8DADC', fontSize: 12, marginTop: 2 },
    headerActions:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerBtn:         {
        width:           40,
        height:          40,
        borderRadius:    20,
        backgroundColor: '#ffffff18',
        justifyContent:  'center',
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     '#ffffff25',
    },

    // ── Badge de notificaciones (campana)
    notifBadge:        {
        position:          'absolute',
        top:               -4,
        right:             -4,
        backgroundColor:   '#E63946',
        borderRadius:      10,
        minWidth:          18,
        height:            18,
        justifyContent:    'center',
        alignItems:        'center',
        paddingHorizontal: 4,
        borderWidth:       1.5,
        borderColor:       '#1D3557',
    },
    notifBadgeTxt:     { color: '#fff', fontSize: 10, fontWeight: '700' },

    // ── Búsqueda
    searchWrap:        { backgroundColor: '#1D3557', paddingHorizontal: 16, paddingBottom: 14 },
    searchContainer:   {
        flexDirection:     'row',
        alignItems:        'center',
        backgroundColor:   '#fff',
        borderRadius:      12,
        paddingHorizontal: 14,
        paddingVertical:   10,
        gap:               8,
    },
    searchIcon:        { fontSize: 15 },
    searchInput:       { flex: 1, fontSize: 14, color: '#1D3557' },

    // ── Categorías
    categoriesScroll:  { maxHeight: 72, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    categoriesContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
    catBtn:            {
        alignItems:        'center',
        paddingHorizontal: 12,
        paddingVertical:   6,
        borderRadius:      20,
        backgroundColor:   '#F1FAEE',
        borderWidth:       1,
        borderColor:       '#A8DADC',
        minWidth:          64,
    },
    catBtnActive:      { backgroundColor: '#1D3557', borderColor: '#1D3557' },
    catIcon:           { fontSize: 17 },
    catLabel:          { fontSize: 10, color: '#457B9D', marginTop: 1, fontWeight: '600' },
    catLabelActive:    { color: '#fff' },

    // ── Contador de resultados
    resultsRow:        {
        flexDirection:     'row',
        justifyContent:    'space-between',
        alignItems:        'center',
        paddingHorizontal: 16,
        paddingVertical:   8,
        backgroundColor:   '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultsText:       { fontSize: 12, color: '#888', fontWeight: '500' },
    searchingFor:      { fontSize: 12, color: '#E63946', fontWeight: '600' },

    // ── Tarjetas
    list:              { paddingHorizontal: 12, paddingTop: 12 },
    row:               { justifyContent: 'space-between', marginBottom: 12 },
    card:              {
        backgroundColor: '#fff',
        borderRadius:    14,
        width:           CARD_W,
        overflow:        'hidden',
        borderWidth:     1,
        borderColor:     '#eee',
        elevation:       2,
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 1 },
        shadowOpacity:   0.06,
        shadowRadius:    4,
    },
    image:             { width: '100%', height: CARD_W * 0.85, resizeMode: 'cover' },
    imagePlaceholder:  {
        width:           '100%',
        height:          CARD_W * 0.85,
        backgroundColor: '#F1FAEE',
        justifyContent:  'center',
        alignItems:      'center',
    },
    badgesRow:         { position: 'absolute', top: 8, left: 8, gap: 4 },
    featuredBadge:     { backgroundColor: '#F4A261', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    featuredBadgeTxt:  { color: '#fff', fontSize: 9, fontWeight: '700' },
    urgentBadge:       { backgroundColor: '#E63946', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    urgentBadgeTxt:    { color: '#fff', fontSize: 9, fontWeight: '700' },
    categoryBadge:     {
        position:          'absolute',
        top:               8,
        right:             8,
        backgroundColor:   '#1D355799',
        paddingHorizontal: 7,
        paddingVertical:   3,
        borderRadius:      8,
    },
    categoryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
    deliveryBadge:     {
        position:        'absolute',
        bottom:          CARD_W * 0.85 - 26,
        right:           8,
        backgroundColor: '#2ecc71',
        width:           22,
        height:          22,
        borderRadius:    11,
        justifyContent:  'center',
        alignItems:      'center',
    },
    deliveryBadgeTxt:  { fontSize: 11 },
    cardBody:          { padding: 10, gap: 3 },
    cardTitle:         { fontSize: 13, fontWeight: '700', color: '#1D3557', lineHeight: 18 },
    cardCondition:     { fontSize: 10, color: '#888' },
    cardPrice:         { fontSize: 16, fontWeight: '800', color: '#E63946' },
    cardFooter:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardUser:          { fontSize: 11, color: '#aaa', flex: 1 },
    statusDot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#2ecc71' },
    cardLocation:      { fontSize: 10, color: '#888' },

    // ── Estado vacío
    empty:             { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
    emptyTitle:        { fontSize: 20, fontWeight: '700', color: '#1D3557' },
    emptyText:         { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
    emptyBtn:          { backgroundColor: '#1D3557', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
    emptyBtnTxt:       { color: '#fff', fontSize: 14, fontWeight: '600' },
});