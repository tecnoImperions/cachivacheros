import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import api from '../../services/api';

export default function ListingsScreen({ navigation }) {
    const [listings,    setListings]    = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [search,      setSearch]      = useState('');

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const response = await api.get('/listings');
            setListings(response.data.data);
        } catch (error) {
            console.log('Error cargando publicaciones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchListings();
    };

    const filtered = listings.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.category?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listing: item })}
        >
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 40 }}>📦</Text>
                </View>
            )}
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.category && (
                    <Text style={styles.cardCategory}>{item.category}</Text>
                )}
                <Text style={styles.cardPrice}>
                    ${parseFloat(item.price).toFixed(2)}
                </Text>
                <Text style={styles.cardUser}>
                    👤 {item.user?.name}
                </Text>
            </View>
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🏪 Cachivacheros</Text>
            </View>

            {/* Buscador */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Buscar publicaciones..."
                    placeholderTextColor="#888"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Lista */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1D3557']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={{ fontSize: 48 }}>🏜️</Text>
                        <Text style={styles.emptyText}>No hay publicaciones aún</Text>
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
        backgroundColor: '#1D3557',
        paddingTop:      52,
        paddingBottom:   16,
        paddingHorizontal: 20,
    },
    headerTitle: {
        color:      '#fff',
        fontSize:   22,
        fontWeight: '700',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical:   12,
        backgroundColor:   '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInput: {
        backgroundColor:   '#F1FAEE',
        borderRadius:      10,
        paddingHorizontal: 14,
        paddingVertical:   10,
        fontSize:          14,
        color:             '#1D3557',
        borderWidth:       1,
        borderColor:       '#A8DADC',
    },
    list: {
        padding: 12,
    },
    row: {
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius:    12,
        marginBottom:    14,
        width:           '48%',
        overflow:        'hidden',
        borderWidth:     1,
        borderColor:     '#eee',
    },
    image: {
        width:  '100%',
        height: 140,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width:          '100%',
        height:         140,
        backgroundColor:'#F1FAEE',
        justifyContent: 'center',
        alignItems:     'center',
    },
    cardBody: {
        padding: 10,
    },
    cardTitle: {
        fontSize:   13,
        fontWeight: '600',
        color:      '#1D3557',
        marginBottom: 4,
    },
    cardCategory: {
        fontSize:      11,
        color:         '#457B9D',
        marginBottom:  4,
        textTransform: 'capitalize',
    },
    cardPrice: {
        fontSize:   15,
        fontWeight: '700',
        color:      '#E63946',
        marginBottom: 4,
    },
    cardUser: {
        fontSize: 11,
        color:    '#888',
    },
});