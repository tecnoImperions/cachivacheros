import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1FAEE' }}>
                <ActivityIndicator size="large" color="#1D3557" />
            </View>
        );
    }

    return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}