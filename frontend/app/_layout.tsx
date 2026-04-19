import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light" backgroundColor="#1D3557" />
            <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
    );
}