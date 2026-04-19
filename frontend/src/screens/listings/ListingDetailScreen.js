import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ListingDetailScreen({ route, navigation }) {
    const { listing }       = route.params;
    const { user }          = useAuth();
    const [loading, setLoading] = useState(false);

    const isOwner = user?.id === listing.user_id;

    const handleBuy = async () => {
        Alert.alert(
            'Confirmar compra',
            `¿Deseas comprar "${listing.title}" por $${parseFloat(listing.price).toFixed(2)}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Comprar',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.post('/orders', { listing_id: listing.id });
                            Alert.alert('¡Éxito!', 'Compra realizada correctamente');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo realizar la compra');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleChat = () => {
        navigation.navigate('Chat', {
            listingId:  listing.id,
            receiverId: listing.user_id,
            title:      listing.title,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Volver</Text>
                </TouchableOpacity>
            </View>

            <ScrollView>
                {/* Imagen */}
                {listing.image_url ? (
                    <Image
                        source={{ uri: listing.image_url }}
                        style={styles.image}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={{ fontSize: 80 }}>📦</Text>
                    </View>
                )}

                {/* Contenido */}
                <View style={styles.content}>
                    {listing.category && (
                        <Text style={styles.category}>{listing.category}</Text>
                    )}
                    <Text style={styles.title}>{listing.title}</Text>
                    <Text style={styles.price}>
                        ${parseFloat(listing.price).toFixed(2)}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{listing.description}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Vendedor</Text>
                    <View style={styles.sellerRow}>
                        <Text style={styles.sellerAvatar}>👤</Text>
                        <Text style={styles.sellerName}>{listing.user?.name}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Botones de acción */}
            {!isOwner && listing.status === 'active' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.btnChat}
                        onPress={handleChat}
                    >
                        <Text style={styles.btnChatText}>💬 Chatear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnBuy}
                        onPress={handleBuy}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnBuyText}>🛍️ Comprar</Text>
                        }
                    </TouchableOpacity>
                </View>
            )}

            {listing.status === 'sold' && (
                <View style={styles.soldBanner}>
                    <Text style={styles.soldText}>✅ Este artículo ya fue vendido</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:            1,
        backgroundColor: '#F1FAEE',
    },
    header: {
        backgroundColor:   '#1D3557',
        paddingTop:        52,
        paddingBottom:     14,
        paddingHorizontal: 20,
    },
    backBtn: {
        color:    '#A8DADC',
        fontSize: 16,
    },
    image: {
        width:      '100%',
        height:     280,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width:          '100%',
        height:         280,
        backgroundColor:'#e8e8e8',
        justifyContent: 'center',
        alignItems:     'center',
    },
    content: {
        padding: 20,
    },
    category: {
        fontSize:      12,
        color:         '#457B9D',
        textTransform: 'uppercase',
        fontWeight:    '600',
        marginBottom:  6,
    },
    title: {
        fontSize:     22,
        fontWeight:   '700',
        color:        '#1D3557',
        marginBottom: 8,
    },
    price: {
        fontSize:     26,
        fontWeight:   '800',
        color:        '#E63946',
        marginBottom: 16,
    },
    divider: {
        height:          1,
        backgroundColor: '#eee',
        marginVertical:  16,
    },
    sectionTitle: {
        fontSize:     14,
        fontWeight:   '700',
        color:        '#1D3557',
        marginBottom: 8,
        textTransform:'uppercase',
    },
    description: {
        fontSize:   15,
        color:      '#444',
        lineHeight: 22,
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           10,
    },
    sellerAvatar: {
        fontSize: 32,
    },
    sellerName: {
        fontSize:   16,
        fontWeight: '600',
        color:      '#1D3557',
    },
    actions: {
        flexDirection:     'row',
        padding:           16,
        gap:               12,
        backgroundColor:   '#fff',
        borderTopWidth:    1,
        borderTopColor:    '#eee',
    },
    btnChat: {
        flex:            1,
        borderWidth:     2,
        borderColor:     '#1D3557',
        borderRadius:    10,
        paddingVertical: 14,
        alignItems:      'center',
    },
    btnChatText: {
        color:      '#1D3557',
        fontSize:   15,
        fontWeight: '600',
    },
    btnBuy: {
        flex:            1,
        backgroundColor: '#E63946',
        borderRadius:    10,
        paddingVertical: 14,
        alignItems:      'center',
    },
    btnBuyText: {
        color:      '#fff',
        fontSize:   15,
        fontWeight: '600',
    },
    soldBanner: {
        backgroundColor: '#457B9D',
        padding:         16,
        alignItems:      'center',
    },
    soldText: {
        color:      '#fff',
        fontSize:   15,
        fontWeight: '600',
    },
});