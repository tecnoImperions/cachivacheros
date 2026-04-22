import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    Share,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen({ route, navigation }) {
    const { listing: initialListing } = route.params;
    const { user }                    = useAuth();

    const [listing,   setListing]   = useState(initialListing);
    const [loading,   setLoading]   = useState(false);
    const [deleting,  setDeleting]  = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const imgFlatRef                = useRef(null);

    const isOwner = user?.id === listing.user_id;
    const isSold  = listing.status === 'sold';

    const images = [
        listing.image_url,
        ...(Array.isArray(listing.images) ? listing.images : []),
    ].filter(Boolean);

    // ── Compartir ────────────────────────────────────────────────
    const handleShare = async () => {
        try {
            await Share.share({
                message: `¡Mira este producto en Cachivacheros!\n\n📦 ${listing.title}\n💰 Bs. ${parseFloat(listing.price).toFixed(2)}\n\n${listing.description?.slice(0, 120)}...`,
                title:   listing.title,
            });
        } catch (_) {}
    };

    // ── Comprar ──────────────────────────────────────────────────
    const handleBuy = async () => {
        setLoading(true);
        try {
            await api.post('/orders', { listing_id: listing.id });
            setShowModal(false);
            navigation.navigate('chat', {
                listingId:   listing.id,
                receiverId:  listing.user_id,
                title:       listing.title,
                autoMessage: `¡Hola! Acabo de reservar "${listing.title}" por Bs. ${parseFloat(listing.price).toFixed(2)}. ¿Cómo coordinamos la entrega? 📦`,
            });
        } catch {
            Alert.alert('Error', 'No se pudo realizar la compra. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // ── Chatear ──────────────────────────────────────────────────
    const handleChat = () => {
        navigation.navigate('chat', {
            listingId:   listing.id,
            receiverId:  listing.user_id,
            title:       listing.title,
            autoMessage: null,
        });
    };

    // ── Eliminar ─────────────────────────────────────────────────
    const handleDelete = () => {
        Alert.alert(
            '¿Eliminar publicación?',
            'Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await api.delete(`/listings/${listing.id}`);
                            Alert.alert('¡Listo!', 'Tu publicación fue eliminada.', [
                                { text: 'OK', onPress: () => navigation.goBack() },
                            ]);
                        } catch {
                            Alert.alert('Error', 'No se pudo eliminar. Intenta nuevamente.');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    // ── Marcar vendido ───────────────────────────────────────────
    const handleMarkSold = () => {
        Alert.alert(
            '¿Marcar como vendido?',
            'El producto dejará de aparecer como disponible.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar', style: 'default',
                    onPress: async () => {
                        try {
                            await api.patch(`/listings/${listing.id}`, { status: 'sold' });
                            setListing(prev => ({ ...prev, status: 'sold' }));
                        } catch {
                            Alert.alert('Error', 'No se pudo actualizar. Intenta nuevamente.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

            {/* ── Header ─────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.headerBtnText}>← Volver</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>Detalle</Text>

                {/* Chip de compartir — limpio con texto */}
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Text style={styles.shareBtnIcon}>⬆</Text>
                    <Text style={styles.shareBtnText}>Compartir</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ── Galería ───────────────────────────────── */}
                <View style={styles.galleryContainer}>
                    {images.length > 0 ? (
                        <>
                            <FlatList
                                ref={imgFlatRef}
                                data={images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, i) => i.toString()}
                                onMomentumScrollEnd={(e) => {
                                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                    setActiveImg(idx);
                                }}
                                renderItem={({ item }) => (
                                    <Image source={{ uri: item }} style={styles.galleryImage} />
                                )}
                            />
                            {images.length > 1 && (
                                <View style={styles.dotsRow}>
                                    {images.map((_, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.dot, i === activeImg && styles.dotActive]}
                                            onPress={() => {
                                                imgFlatRef.current?.scrollToIndex({ index: i, animated: true });
                                                setActiveImg(i);
                                            }}
                                        />
                                    ))}
                                </View>
                            )}
                            <View style={styles.imgCounter}>
                                <Text style={styles.imgCounterText}>{activeImg + 1}/{images.length}</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={{ fontSize: 80 }}>📦</Text>
                        </View>
                    )}

                    {isSold && (
                        <View style={styles.soldOverlay}>
                            <Text style={styles.soldOverlayText}>VENDIDO</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>

                    {/* Badges */}
                    <View style={styles.badgesRow}>
                        {listing.category && (
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>📁 {listing.category}</Text>
                            </View>
                        )}
                        {listing.condition && (
                            <View style={styles.conditionBadge}>
                                <Text style={styles.conditionBadgeText}>
                                    {listing.condition === 'new'      ? '✨ Nuevo'
                                   : listing.condition === 'like_new' ? '⭐ Como nuevo'
                                   : listing.condition === 'good'     ? '👍 Buen estado'
                                   : '🔧 Regular'}
                                </Text>
                            </View>
                        )}
                        {listing.location && (
                            <View style={styles.locationBadge}>
                                <Text style={styles.locationBadgeText}>📍 {listing.location}</Text>
                            </View>
                        )}
                    </View>

                    {/* Título y precio */}
                    <Text style={styles.title}>{listing.title}</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, isSold && styles.priceStrike]}>
                            Bs. {parseFloat(listing.price).toFixed(2)}
                        </Text>
                        {!isSold ? (
                            <View style={styles.availableBadge}>
                                <View style={styles.availableDot} />
                                <Text style={styles.availableText}>Disponible</Text>
                            </View>
                        ) : (
                            <View style={styles.soldBadge}>
                                <Text style={styles.soldBadgeText}>❌ Vendido</Text>
                            </View>
                        )}
                    </View>

                    {listing.delivery && (
                        <View style={styles.deliveryBadge}>
                            <Text style={styles.deliveryText}>
                                🚚 Delivery disponible
                                {listing.delivery_cost > 0
                                    ? ` · Bs. ${parseFloat(listing.delivery_cost).toFixed(2)}`
                                    : ' · Gratis'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Descripción */}
                    <Text style={styles.sectionTitle}>📝 Descripción</Text>
                    <Text style={styles.description}>{listing.description}</Text>

                    <View style={styles.divider} />

                    {/* Vendedor */}
                    <Text style={styles.sectionTitle}>👤 Vendedor</Text>
                    <View style={styles.sellerCard}>
                        <View style={styles.sellerAvatar}>
                            <Text style={{ fontSize: 28 }}>👤</Text>
                        </View>
                        <View style={styles.sellerInfo}>
                            <Text style={styles.sellerName}>{listing.user?.name}</Text>
                            <Text style={styles.sellerSub}>Miembro de Cachivacheros</Text>
                        </View>
                        {!isOwner && (
                            <TouchableOpacity style={styles.sellerChatBtn} onPress={handleChat}>
                                <Text style={styles.sellerChatTxt}>💬</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── Panel del dueño ──────────────────────── */}
                    {isOwner && (
                        <>
                            <View style={styles.divider} />

                            <View style={styles.ownerPanel}>

                                {/* Cabecera */}
                                <View style={styles.ownerPanelHeader}>
                                    <Text style={styles.ownerPanelIcon}>⚙️</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.ownerPanelTitle}>Gestionar publicación</Text>
                                        <Text style={styles.ownerPanelSub}>
                                            {isSold
                                                ? 'Marcada como vendida'
                                                : 'Activa · visible para compradores'}
                                        </Text>
                                    </View>
                                    <View style={[styles.ownerStatusPill, isSold && styles.ownerStatusPillSold]}>
                                        <View style={[styles.ownerStatusDot, isSold && styles.ownerStatusDotSold]} />
                                        <Text style={[styles.ownerStatusTxt, isSold && styles.ownerStatusTxtSold]}>
                                            {isSold ? 'Vendido' : 'Activo'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.ownerPanelDivider} />

                                {/* Fila: Editar + Marcar vendido */}
                                <View style={styles.ownerRow}>
                                    <TouchableOpacity
                                        style={styles.ownerBtnEdit}
                                        onPress={() => navigation.navigate('EditListing', { listing })}
                                    >
                                        <Text style={styles.ownerBtnIcon}>✏️</Text>
                                        <Text style={styles.ownerBtnEditTxt}>Editar</Text>
                                    </TouchableOpacity>

                                    {!isSold ? (
                                        <TouchableOpacity
                                            style={styles.ownerBtnSold}
                                            onPress={handleMarkSold}
                                        >
                                            <Text style={styles.ownerBtnIcon}>✅</Text>
                                            <Text style={styles.ownerBtnSoldTxt}>Marcar vendido</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.ownerBtnDisabled}>
                                            <Text style={styles.ownerBtnDisabledTxt}>✅ Ya vendido</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Eliminar — fila completa, separada */}
                                <TouchableOpacity
                                    style={styles.ownerBtnDelete}
                                    onPress={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <ActivityIndicator color="#E63946" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.ownerBtnIcon}>🗑️</Text>
                                            <Text style={styles.ownerBtnDeleteTxt}>Eliminar publicación</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                            </View>
                        </>
                    )}

                    {/* Cómo funciona */}
                    {!isOwner && !isSold && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.infoBox}>
                                <Text style={styles.infoTitle}>💡 ¿Cómo funciona?</Text>
                                <Text style={styles.infoItem}>1️⃣  Presiona "Comprar ahora" para reservar</Text>
                                <Text style={styles.infoItem}>2️⃣  Chatea con el vendedor para coordinar</Text>
                                <Text style={styles.infoItem}>3️⃣  Acuerden lugar y forma de pago</Text>
                                <Text style={styles.infoItem}>4️⃣  ¡Disfruta tu compra!</Text>
                            </View>
                        </>
                    )}

                    <View style={{ height: 20 }} />
                </View>
            </ScrollView>

            {/* ── Botones de acción ─────────────────────── */}
            {!isOwner && !isSold && (
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.btnChat} onPress={handleChat}>
                        <Text style={styles.btnChatText}>💬 Chatear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnBuy} onPress={() => setShowModal(true)}>
                        <Text style={styles.btnBuyText}>🛍️ Comprar ahora</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isOwner && (
                <View style={styles.ownerBar}>
                    <View style={styles.ownerBarDot} />
                    <Text style={styles.ownerBarText}>Esta es tu publicación</Text>
                </View>
            )}

            {!isOwner && isSold && (
                <View style={styles.soldBar}>
                    <Text style={styles.soldBarText}>Este producto ya fue vendido</Text>
                </View>
            )}

            {/* ── Modal confirmar compra ─────────────────── */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Confirmar compra</Text>

                        <View style={styles.modalProduct}>
                            {images[0] && (
                                <Image source={{ uri: images[0] }} style={styles.modalImage} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalProductName} numberOfLines={2}>
                                    {listing.title}
                                </Text>
                                <Text style={styles.modalPrice}>
                                    Bs. {parseFloat(listing.price).toFixed(2)}
                                </Text>
                                {listing.delivery && (
                                    <Text style={styles.modalDelivery}>
                                        🚚 {listing.delivery_cost > 0
                                            ? `+ Bs. ${parseFloat(listing.delivery_cost).toFixed(2)} delivery`
                                            : 'Delivery gratis'}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.modalDivider} />

                        <Text style={styles.modalNote}>
                            ⚠️ Al confirmar, el producto quedará reservado para ti. Coordina el pago directamente con el vendedor por el chat.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirm}
                                onPress={handleBuy}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.modalConfirmText}>✅ Confirmar</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:            { flex: 1, backgroundColor: '#F1FAEE' },

    // Header
    header:               { backgroundColor: '#1D3557', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBtn:            { width: 80 },
    headerBtnText:        { color: '#A8DADC', fontSize: 15 },
    headerTitle:          { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },

    // Chip compartir
    shareBtn:             { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ffffff18', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#ffffff25' },
    shareBtnIcon:         { color: '#A8DADC', fontSize: 12, fontWeight: '800' },
    shareBtnText:         { color: '#A8DADC', fontSize: 13, fontWeight: '600' },

    // Galería
    galleryContainer:     { position: 'relative' },
    galleryImage:         { width: SCREEN_WIDTH, height: 300, resizeMode: 'cover' },
    imagePlaceholder:     { width: '100%', height: 280, backgroundColor: '#e8e8e8', justifyContent: 'center', alignItems: 'center' },
    dotsRow:              { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
    dot:                  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ffffff60' },
    dotActive:            { backgroundColor: '#fff', width: 18 },
    imgCounter:           { position: 'absolute', top: 12, right: 12, backgroundColor: '#00000060', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    imgCounterText:       { color: '#fff', fontSize: 12, fontWeight: '600' },
    soldOverlay:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000055', justifyContent: 'center', alignItems: 'center' },
    soldOverlayText:      { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 4, transform: [{ rotate: '-15deg' }], borderWidth: 4, borderColor: '#fff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4 },

    // Contenido
    content:              { padding: 18, gap: 12 },
    badgesRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryBadge:        { backgroundColor: '#E8F4FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    categoryBadgeText:    { color: '#457B9D', fontSize: 12, fontWeight: '600' },
    conditionBadge:       { backgroundColor: '#E8F8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    conditionBadgeText:   { color: '#2ecc71', fontSize: 12, fontWeight: '600' },
    locationBadge:        { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    locationBadgeText:    { color: '#F4A261', fontSize: 12, fontWeight: '600' },
    title:                { fontSize: 22, fontWeight: '700', color: '#1D3557' },
    priceRow:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price:                { fontSize: 28, fontWeight: '800', color: '#E63946' },
    priceStrike:          { textDecorationLine: 'line-through', color: '#aaa' },
    availableBadge:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    availableDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71' },
    availableText:        { color: '#2ecc71', fontSize: 13, fontWeight: '600' },
    soldBadge:            { backgroundColor: '#fdecea', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    soldBadgeText:        { color: '#E63946', fontSize: 13, fontWeight: '600' },
    deliveryBadge:        { backgroundColor: '#EEF6FF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#A8DADC' },
    deliveryText:         { color: '#457B9D', fontSize: 13, fontWeight: '600' },
    divider:              { height: 1, backgroundColor: '#eee' },
    sectionTitle:         { fontSize: 15, fontWeight: '700', color: '#1D3557' },
    description:          { fontSize: 15, color: '#444', lineHeight: 24 },

    // Vendedor
    sellerCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 12 },
    sellerAvatar:         { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1FAEE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#A8DADC' },
    sellerInfo:           { flex: 1 },
    sellerName:           { fontSize: 16, fontWeight: '700', color: '#1D3557' },
    sellerSub:            { fontSize: 12, color: '#888', marginTop: 2 },
    sellerChatBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1FAEE', borderWidth: 1, borderColor: '#A8DADC', justifyContent: 'center', alignItems: 'center' },
    sellerChatTxt:        { fontSize: 18 },

    // ── Panel del dueño ─────────────────────────────────────────
    ownerPanel:           { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },

    ownerPanelHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    ownerPanelIcon:       { fontSize: 22 },
    ownerPanelTitle:      { fontSize: 15, fontWeight: '700', color: '#1D3557' },
    ownerPanelSub:        { fontSize: 12, color: '#888', marginTop: 1 },

    // Pill de estado activo/vendido
    ownerStatusPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FBF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#A3D9B1' },
    ownerStatusPillSold:  { backgroundColor: '#FFF0F0', borderColor: '#FBBCBC' },
    ownerStatusDot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#2ecc71' },
    ownerStatusDotSold:   { backgroundColor: '#E63946' },
    ownerStatusTxt:       { fontSize: 12, fontWeight: '700', color: '#1a7a3a' },
    ownerStatusTxtSold:   { color: '#E63946' },

    ownerPanelDivider:    { height: 1, backgroundColor: '#F0F4F8' },

    // Fila de botones Editar + Marcar vendido
    ownerRow:             { flexDirection: 'row', padding: 12, gap: 10 },

    ownerBtnIcon:         { fontSize: 16 },

    ownerBtnEdit:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0F6FF', borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: '#C5DCEF' },
    ownerBtnEditTxt:      { color: '#1D3557', fontSize: 13, fontWeight: '700' },

    ownerBtnSold:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FBF4', borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: '#A3D9B1' },
    ownerBtnSoldTxt:      { color: '#1a7a3a', fontSize: 13, fontWeight: '700' },

    ownerBtnDisabled:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: '#e0e0e0' },
    ownerBtnDisabledTxt:  { color: '#aaa', fontSize: 13, fontWeight: '600' },

    // Botón eliminar — ancho completo
    ownerBtnDelete:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 12, marginBottom: 12, backgroundColor: '#FFF5F5', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#FBBCBC' },
    ownerBtnDeleteTxt:    { color: '#E63946', fontSize: 14, fontWeight: '700' },

    // Info box
    infoBox:              { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F4A261', gap: 8 },
    infoTitle:            { fontSize: 14, fontWeight: '700', color: '#1D3557', marginBottom: 4 },
    infoItem:             { fontSize: 13, color: '#555', lineHeight: 20 },

    // Barra de acciones
    actions:              { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    btnChat:              { flex: 1, borderWidth: 2, borderColor: '#1D3557', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    btnChatText:          { color: '#1D3557', fontSize: 15, fontWeight: '700' },
    btnBuy:               { flex: 2, backgroundColor: '#E63946', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    btnBuyText:           { color: '#fff', fontSize: 15, fontWeight: '700' },

    ownerBar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D3557', padding: 16 },
    ownerBarDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71' },
    ownerBarText:         { color: '#A8DADC', fontSize: 14, fontWeight: '600' },

    soldBar:              { backgroundColor: '#888', padding: 16, alignItems: 'center' },
    soldBarText:          { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Modal
    modalOverlay:         { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
    modalCard:            { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, paddingBottom: 36 },
    modalHandle:          { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 6 },
    modalTitle:           { fontSize: 20, fontWeight: '700', color: '#1D3557', textAlign: 'center' },
    modalProduct:         { flexDirection: 'row', gap: 12, alignItems: 'center' },
    modalImage:           { width: 70, height: 70, borderRadius: 10, resizeMode: 'cover' },
    modalProductName:     { fontSize: 15, fontWeight: '600', color: '#1D3557' },
    modalPrice:           { fontSize: 20, fontWeight: '800', color: '#E63946', marginTop: 4 },
    modalDelivery:        { fontSize: 12, color: '#457B9D', marginTop: 4 },
    modalDivider:         { height: 1, backgroundColor: '#eee' },
    modalNote:            { fontSize: 13, color: '#666', lineHeight: 20, backgroundColor: '#FFF9E6', padding: 12, borderRadius: 10 },
    modalActions:         { flexDirection: 'row', gap: 12 },
    modalCancel:          { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    modalCancelText:      { color: '#888', fontSize: 15, fontWeight: '600' },
    modalConfirm:         { flex: 2, backgroundColor: '#E63946', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    modalConfirmText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});