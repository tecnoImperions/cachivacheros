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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function MyListingsScreen({ navigation }) {
    const [listings,   setListings]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchMyListings();
        }, [])
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
            '¿Estás seguro que deseas eliminarla?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/listings/${id}`);
                            setListings(prev => prev.filter(l => l.id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#2ecc71';
            case 'sold':   return '#E63946';
            case 'paused': return '#F4A261';
            default:       return '#888';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Activa';
            case 'sold':   return 'Vendida';
            case 'paused': return 'Pausada';
            default:       return status;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 30 }}>📦</Text>
                </View>
            )}
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardPrice}>
                    ${parseFloat(item.price).toFixed(2)}
                </Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
            >
                <Text style={{ fontSize: 18 }}>🗑️</Text>
            </TouchableOpacity>
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
                <Text style={styles.headerTitle}>📦 Mis publicaciones</Text>
            </View>

            <FlatList
                data={listings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchMyListings(); }}
                        colors={['#1D3557']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={{ fontSize: 48 }}>📭</Text>
                        <Text style={styles.emptyText}>No tienes publicaciones aún</Text>
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
        alignItems:      'center',
    },
    image: {
        width:      90,
        height:     90,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width:          90,
        height:         90,
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
    statusRow: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           6,
        marginTop:     4,
    },
    statusDot: {
        width:        8,
        height:       8,
        borderRadius: 4,
    },
    statusText: {
        fontSize:   12,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 16,
    },
    emptyText: {
        fontSize:  16,
        color:     '#888',
        marginTop: 12,
    },
});