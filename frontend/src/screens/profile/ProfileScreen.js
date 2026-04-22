import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfileScreen({ navigation }) {
    const { user, logout }          = useAuth();
    const [stats,    setStats]      = useState({ listings: 0, sales: 0, purchases: 0 });
    const [loading,  setLoading]    = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const [listings, sales, purchases] = await Promise.all([
                api.get('/my-listings'),
                api.get('/my-sales'),
                api.get('/my-purchases'),
            ]);
            setStats({
                listings:  listings.data.length,
                sales:     sales.data.length,
                purchases: purchases.data.length,
            });
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro que deseas salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text:    'Salir',
                    style:   'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi perfil</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar y nombre */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                    </View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.memberBadge}>
                        <Text style={styles.memberText}>⭐ Miembro de Cachivacheros</Text>
                    </View>
                </View>

                {/* Estadísticas */}
                {loading ? (
                    <ActivityIndicator color="#1D3557" style={{ marginVertical: 20 }} />
                ) : (
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.listings}</Text>
                            <Text style={styles.statLabel}>📦 Publicaciones</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.sales}</Text>
                            <Text style={styles.statLabel}>💰 Ventas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.purchases}</Text>
                            <Text style={styles.statLabel}>🛍️ Compras</Text>
                        </View>
                    </View>
                )}

                {/* Opciones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mi actividad</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('/(tabs)/mylistings')}
                    >
                        <Text style={styles.menuIcon}>📦</Text>
                        <View style={styles.menuInfo}>
                            <Text style={styles.menuLabel}>Mis publicaciones</Text>
                            <Text style={styles.menuSub}>Ver y gestionar lo que vendes</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('/(tabs)/purchases')}
                    >
                        <Text style={styles.menuIcon}>🛍️</Text>
                        <View style={styles.menuInfo}>
                            <Text style={styles.menuLabel}>Mis compras</Text>
                            <Text style={styles.menuSub}>Historial de lo que compraste</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('/(tabs)/conversations')}
                    >
                        <Text style={styles.menuIcon}>💬</Text>
                        <View style={styles.menuInfo}>
                            <Text style={styles.menuLabel}>Mis chats</Text>
                            <Text style={styles.menuSub}>Conversaciones con vendedores</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Información */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información</Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoItem}>🇧🇴 Aplicación para Bolivia</Text>
                        <Text style={styles.infoItem}>💰 Precios en Bolivianos (Bs.)</Text>
                        <Text style={styles.infoItem}>🤝 Compras coordinadas por chat</Text>
                        <Text style={styles.infoItem}>📍 Santa Cruz de la Sierra</Text>
                    </View>
                </View>

                {/* Cerrar sesión */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#F1FAEE' },
    header:        {
        backgroundColor:   '#1D3557',
        paddingHorizontal: 20,
        paddingVertical:   14,
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
    },
    backText:      { color: '#A8DADC', fontSize: 15 },
    headerTitle:   { color: '#fff', fontSize: 18, fontWeight: '700' },
    profileSection:{ alignItems: 'center', paddingVertical: 30, backgroundColor: '#1D3557', gap: 8 },
    avatar:        {
        width:           80,
        height:          80,
        borderRadius:    40,
        backgroundColor: '#E63946',
        justifyContent:  'center',
        alignItems:      'center',
        borderWidth:     3,
        borderColor:     '#fff',
    },
    avatarText:    { color: '#fff', fontSize: 28, fontWeight: '700' },
    userName:      { color: '#fff', fontSize: 22, fontWeight: '700' },
    userEmail:     { color: '#A8DADC', fontSize: 14 },
    memberBadge:   { backgroundColor: '#ffffff20', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    memberText:    { color: '#fff', fontSize: 12, fontWeight: '600' },
    statsRow:      {
        flexDirection:     'row',
        margin:            16,
        gap:               10,
    },
    statCard:      {
        flex:            1,
        backgroundColor: '#fff',
        borderRadius:    12,
        padding:         14,
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     '#eee',
        gap:             4,
    },
    statNumber:    { fontSize: 24, fontWeight: '800', color: '#E63946' },
    statLabel:     { fontSize: 11, color: '#888', textAlign: 'center' },
    section:       { marginHorizontal: 16, marginBottom: 16 },
    sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
    menuItem:      {
        flexDirection:   'row',
        alignItems:      'center',
        backgroundColor: '#fff',
        borderRadius:    12,
        padding:         16,
        marginBottom:    8,
        borderWidth:     1,
        borderColor:     '#eee',
        gap:             12,
    },
    menuIcon:      { fontSize: 24 },
    menuInfo:      { flex: 1 },
    menuLabel:     { fontSize: 15, fontWeight: '600', color: '#1D3557' },
    menuSub:       { fontSize: 12, color: '#888', marginTop: 2 },
    menuArrow:     { fontSize: 22, color: '#ccc' },
    infoBox:       {
        backgroundColor: '#fff',
        borderRadius:    12,
        padding:         16,
        borderWidth:     1,
        borderColor:     '#eee',
        gap:             10,
    },
    infoItem:      { fontSize: 14, color: '#555' },
    logoutBtn:     {
        marginHorizontal: 16,
        backgroundColor:  '#fdecea',
        borderRadius:     12,
        padding:          16,
        alignItems:       'center',
        borderWidth:      1,
        borderColor:      '#E63946',
    },
    logoutText:    { color: '#E63946', fontSize: 16, fontWeight: '700' },
});