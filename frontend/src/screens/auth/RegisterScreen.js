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
    ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    primary:   '#1D3557',
    secondary: '#457B9D',
    accent:    '#E63946',
    light:     '#F1FAEE',
    celeste:   '#A8DADC',
};

export default function RegisterScreen({ navigation }) {
    const [name,     setName]     = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
            navigation.navigate('listings');
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear la cuenta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.inner}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🏪</Text>
                    <Text style={styles.title}>Crear cuenta</Text>
                    <Text style={styles.subtitle}>Únete a Cachivacheros</Text>
                </View>

                {/* Formulario */}
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre completo"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
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
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnPrimaryText}>Registrarme</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.btnSecondaryText}>
                            ¿Ya tienes cuenta? <Text style={{ color: COLORS.accent }}>Inicia sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:            1,
        backgroundColor: '#F1FAEE',
    },
    inner: {
        flexGrow:          1,
        justifyContent:    'center',
        paddingHorizontal: 28,
        paddingVertical:   40,
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
        fontSize:  14,
        color:     '#457B9D',
        marginTop: 6,
    },
    form: {
        gap: 14,
    },
    input: {
        backgroundColor:   '#fff',
        borderWidth:       1,
        borderColor:       '#A8DADC',
        borderRadius:      10,
        paddingHorizontal: 16,
        paddingVertical:   12,
        fontSize:          15,
        color:             '#1D3557',
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