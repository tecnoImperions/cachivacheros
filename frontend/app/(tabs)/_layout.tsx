import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown:             false,
                tabBarActiveTintColor:   '#E63946',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor:  '#eee',
                    paddingBottom:   20,
                    paddingTop:      6,
                    height:          75,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title:        'Inicio',
                    tabBarIcon:   ({ color }) => <Text style={{ fontSize: 20, color }}>🏪</Text>,
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title:        'Publicar',
                    tabBarIcon:   ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>,
                }}
            />
            <Tabs.Screen
                name="conversations"
                options={{
                    title:        'Chats',
                    tabBarIcon:   ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>,
                }}
            />
            <Tabs.Screen
                name="purchases"
                options={{
                    title:        'Mis Compras',
                    tabBarIcon:   ({ color }) => <Text style={{ fontSize: 20, color }}>🛍️</Text>,
                }}
            />
            <Tabs.Screen
                name="mylistings"
                options={{
                    title:        'Mis Ventas',
                    tabBarIcon:   ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text>,
                }}
            />
        </Tabs>
    );
}