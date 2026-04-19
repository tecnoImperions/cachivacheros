import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function MyPurchasesScreen() {
    const [orders,     setOrders]     = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':  return '#2ecc71';
            case 'cancelled':  return '#E63946';
            case 'pending':    return '#F4A261';
            default:           return '#888';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return '✅ Confirmada';
            case 'cancelled': return '❌ Cancelada';
            case 'pending':   return '⏳ Pendiente';
            default:          return status;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.listing?.image_url ? (
                <Image
                    source={{ uri: item.listing.image_url }}
                    style={styles.image}
                />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 30 }}>📦</Text>
                </View>
            )}
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.listing?.title}
                </Text>
                <Text style={styles.cardPrice}>
                    ${parseFloat(item.amount).toFixed(2)}
                </Text>
                <Text style={styles.cardSeller}>
                    👤 Vendedor: {item.seller?.name}
                </Text>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) + '20' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: getStatusColor(item.status) }
                    ]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>
        </View>
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
                <Text style={styles.headerTitle}>🛍️ Mis compras</Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchOrders(); }}
                        colors={['#1D3557']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={{ fontSize: 48 }}>🛒</Text>
                        <Text style={styles.emptyText}>No has realizado compras aún</Text>
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
        gap:     12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius:    12,
        flexDirection:   'row',
        overflow:        'hidden',
        borderWidth:     1,
        borderColor:     '#eee',
    },
    image: {
        width:      100,
        height:     100,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width:          100,
        height:         100,
        backgroundColor:'#F1FAEE',
        justifyContent: 'center',
        alignItems:     'center',
    },
    cardBody: {
        flex:    1,
        padding: 12,
        gap:     4,
    },
    cardTitle: {
        fontSize:   14,
        fontWeight: '600',
        color:      '#1D3557',
    },
    cardPrice: {
        fontSize:   16,
        fontWeight: '700',
        color:      '#E63946',
    },
    cardSeller: {
        fontSize: 12,
        color:    '#888',
    },
    statusBadge: {
        alignSelf:       'flex-start',
        paddingHorizontal: 10,
        paddingVertical:   4,
        borderRadius:    20,
        marginTop:       4,
    },
    statusText: {
        fontSize:   12,
        fontWeight: '600',
    },
    emptyText: {
        fontSize:  16,
        color:     '#888',
        marginTop: 12,
    },
});