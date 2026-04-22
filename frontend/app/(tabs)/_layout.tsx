import { Tabs, useRouter } from 'expo-router';
import { Text, View, Platform, TouchableOpacity } from 'react-native';

function PlusBtn() {
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() => router.push('/(tabs)/create')}
            style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#E63946',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Platform.OS === 'android' ? 10 : 20, // 🔥 CORREGIDO
                elevation: 8,
                shadowColor: '#E63946',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
            }}
        >
            <Text style={{ color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '300' }}>
                +
            </Text>
        </TouchableOpacity>
    );
}

const TAB_H = Platform.OS === 'android' ? 70 : 85;

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#E63946',
                tabBarInactiveTintColor: '#A8DADC',

                tabBarStyle: {
                    backgroundColor: '#1D3557',
                    borderTopWidth: 0,
                    height: TAB_H,
                    paddingBottom: Platform.OS === 'android' ? 12 : 24,
                    paddingTop: 8,
                    elevation: 16,

                    // ❌ ELIMINADO position absolute (esto rompía todo)
                },

                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 2,
                },
            }}
        >
            {/* INICIO */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center', marginTop: 2 }}>
                            <Text style={{ fontSize: 21 }}>🏠</Text>
                            {focused && (
                                <View style={{
                                    width: 18,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: '#E63946',
                                    marginTop: 3,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />

            {/* CHATS */}
            <Tabs.Screen
                name="conversations"
                options={{
                    title: 'Chats',
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center', marginTop: 2 }}>
                            <Text style={{ fontSize: 21 }}>💬</Text>
                            {focused && (
                                <View style={{
                                    width: 18,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: '#E63946',
                                    marginTop: 3,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />

            {/* BOTÓN CENTRAL */}
            <Tabs.Screen
                name="create"
                options={{
                    title: '',
                    tabBarIcon: () => <PlusBtn />,
                    tabBarLabel: () => null,
                }}
            />

            {/* COMPRAS */}
            <Tabs.Screen
                name="purchases"
                options={{
                    title: 'Compras',
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center', marginTop: 2 }}>
                            <Text style={{ fontSize: 21 }}>🛍️</Text>
                            {focused && (
                                <View style={{
                                    width: 18,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: '#E63946',
                                    marginTop: 3,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />

            {/* MIS VENTAS */}
            <Tabs.Screen
                name="mylistings"
                options={{
                    title: 'Mis ventas',
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center', marginTop: 2 }}>
                            <Text style={{ fontSize: 21 }}>📦</Text>
                            {focused && (
                                <View style={{
                                    width: 18,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: '#E63946',
                                    marginTop: 3,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}