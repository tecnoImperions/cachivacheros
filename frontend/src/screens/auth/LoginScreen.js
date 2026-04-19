import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    primary:    '#1D3557',
    secondary:  '#457B9D',
    accent:     '#E63946',
    light:      '#F1FAEE',
    celeste:    '#A8DADC',
};

export default function LoginScreen({ navigation }) {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            Alert.alert('Error', 'Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                {/* Logo / Título */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🏪</Text>
                    <Text style={styles.title}>Cachivacheros</Text>
                    <Text style={styles.subtitle}>Compra y vende en tu comunidad</Text>
                </View>

                {/* Formulario */}
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Correo electrónico"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnPrimaryText}>Iniciar sesión</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.btnSecondaryText}>
                            ¿No tienes cuenta? <Text style={{ color: COLORS.accent }}>Regístrate</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:            1,
        backgroundColor: '#F1FAEE',
    },
    inner: {
        flex:           1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    header: {
        alignItems:   'center',
        marginBottom: 40,
    },
    logo: {
        fontSize:     64,
        marginBottom: 12,
    },
    title: {
        fontSize:   28,
        fontWeight: '700',
        color:      '#1D3557',
    },
    subtitle: {
        fontSize:   14,
        color:      '#457B9D',
        marginTop:  6,
    },
    form: {
        gap: 14,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth:     1,
        borderColor:     '#A8DADC',
        borderRadius:    10,
        paddingHorizontal: 16,
        paddingVertical:   12,
        fontSize:        15,
        color:           '#1D3557',
    },
    btnPrimary: {
        backgroundColor: '#1D3557',
        borderRadius:    10,
        paddingVertical: 14,
        alignItems:      'center',
        marginTop:       6,
    },
    btnPrimaryText: {
        color:      '#fff',
        fontSize:   16,
        fontWeight: '600',
    },
    btnSecondary: {
        alignItems: 'center',
        marginTop:  8,
    },
    btnSecondaryText: {
        color:    '#457B9D',
        fontSize: 14,
    },
});