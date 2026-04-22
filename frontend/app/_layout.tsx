import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export default function RootLayout() {

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setButtonStyleAsync('light');
        }
    }, []);

    return (
        <SafeAreaProvider>
            <AuthProvider>

                {/* 🔥 ESTA ES LA CLAVE */}
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['bottom']}>

                    <StatusBar style="light" backgroundColor="#000000" />

                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#1D3557' }
                        }}
                    />

                </SafeAreaView>

            </AuthProvider>
        </SafeAreaProvider>
    );
}