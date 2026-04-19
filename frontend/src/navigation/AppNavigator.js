import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Screens Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Screens App
import ListingsScreen from '../screens/listings/ListingsScreen';
import ListingDetailScreen from '../screens/listings/ListingDetailScreen';
import CreateListingScreen from '../screens/listings/CreateListingScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import MyListingsScreen from '../screens/listings/MyListingsScreen';
import MyPurchasesScreen from '../screens/orders/MyPurchasesScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const COLORS = {
    primary: '#1D3557',
    accent:  '#E63946',
};

// Tabs principales
const MainTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown:         false,
            tabBarActiveTintColor:   COLORS.accent,
            tabBarInactiveTintColor: '#888',
            tabBarStyle: {
                backgroundColor: '#fff',
                borderTopColor:  '#eee',
                paddingBottom:   6,
                height:          60,
            },
        }}
    >
        <Tab.Screen
            name="Inicio"
            component={ListingsScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏪</Text> }}
        />
        <Tab.Screen
            name="Publicar"
            component={CreateListingScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text> }}
        />
        <Tab.Screen
            name="Chats"
            component={ConversationsScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text> }}
        />
        <Tab.Screen
            name="Mis Compras"
            component={MyPurchasesScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛍️</Text> }}
        />
        <Tab.Screen
            name="Mis Ventas"
            component={MyListingsScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text> }}
        />
    </Tab.Navigator>
);

// Navegador principal
const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main"          component={MainTabs} />
                        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
                        <Stack.Screen name="Chat"          component={ChatScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login"    component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;