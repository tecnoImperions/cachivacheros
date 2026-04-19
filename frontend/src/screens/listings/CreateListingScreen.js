import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const CATEGORIES = [
    'Electrónica', 'Ropa', 'Hogar', 'Juguetes',
    'Deportes', 'Libros', 'Autos', 'Otros',
];

export default function CreateListingScreen({ navigation }) {
    const [title,       setTitle]       = useState('');
    const [description, setDescription] = useState('');
    const [price,       setPrice]       = useState('');
    const [category,    setCategory]    = useState('');
    const [image,       setImage]       = useState(null);
    const [loading,     setLoading]     = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const uploadToCloudinary = async (imageAsset) => {
        const formData = new FormData();
        formData.append('file', {
            uri:  imageAsset.uri,
            type: 'image/jpeg',
            name: 'listing.jpg',
        });
        formData.append('upload_preset', 'cachivacheros');
        formData.append('cloud_name',    'duwvw6q2c');

        const response = await fetch(
            'https://api.cloudinary.com/v1_1/duwvw6q2c/image/upload',
            { method: 'POST', body: formData }
        );
        const data = await response.json();
        return {
            url:       data.secure_url,
            public_id: data.public_id,
        };
    };

    const handleSubmit = async () => {
        if (!title || !description || !price) {
            Alert.alert('Error', 'Título, descripción y precio son obligatorios');
            return;
        }
        setLoading(true);
        try {
            let image_url            = null;
            let cloudinary_public_id = null;

            if (image) {
                const uploaded       = await uploadToCloudinary(image);
                image_url            = uploaded.url;
                cloudinary_public_id = uploaded.public_id;
            }

            await api.post('/listings', {
                title,
                description,
                price:    parseFloat(price),
                category,
                image_url,
                cloudinary_public_id,
            });

            Alert.alert('¡Éxito!', 'Publicación creada correctamente');
            setTitle('');
            setDescription('');
            setPrice('');
            setCategory('');
            setImage(null);

        } catch (error) {
            Alert.alert('Error', 'No se pudo crear la publicación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>➕ Nueva publicación</Text>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                {/* Imagen */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={{ fontSize: 40 }}>📷</Text>
                            <Text style={styles.imageText}>Toca para agregar foto</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Campos */}
                <TextInput
                    style={styles.input}
                    placeholder="Título del producto"
                    placeholderTextColor="#888"
                    value={title}
                    onChangeText={setTitle}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descripción"
                    placeholderTextColor="#888"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Precio (ej: 25.00)"
                    placeholderTextColor="#888"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                />

                {/* Categorías */}
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.categories}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryBtn,
                                category === cat && styles.categoryBtnActive,
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                category === cat && styles.categoryTextActive,
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Botón publicar */}
                <TouchableOpacity
                    style={styles.btnSubmit}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.btnSubmitText}>Publicar ahora</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:            1,
        backgroundColor: '#F1FAEE',
    },
    header: {
        backgroundColor:   '#1D3557',
        paddingTop:        52,
        paddingBottom:     16,
        paddingHorizontal: 20,
    },
    headerTitle: {
        color:      '#fff',
        fontSize:   20,
        fontWeight: '700',
    },
    form: {
        padding: 20,
        gap:     14,
    },
    imagePicker: {
        borderRadius:    12,
        overflow:        'hidden',
        marginBottom:    6,
    },
    imagePreview: {
        width:      '100%',
        height:     220,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width:          '100%',
        height:         220,
        backgroundColor:'#e8f4f8',
        justifyContent: 'center',
        alignItems:     'center',
        borderRadius:   12,
        borderWidth:    2,
        borderColor:    '#A8DADC',
        borderStyle:    'dashed',
    },
    imageText: {
        color:     '#457B9D',
        marginTop: 8,
        fontSize:  14,
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
    textArea: {
        height:     110,
        textAlignVertical: 'top',
    },
    label: {
        fontSize:   14,
        fontWeight: '600',
        color:      '#1D3557',
        marginBottom: -6,
    },
    categories: {
        flexDirection: 'row',
        flexWrap:      'wrap',
        gap:           8,
    },
    categoryBtn: {
        paddingHorizontal: 14,
        paddingVertical:   8,
        borderRadius:      20,
        borderWidth:       1,
        borderColor:       '#A8DADC',
        backgroundColor:   '#fff',
    },
    categoryBtnActive: {
        backgroundColor: '#1D3557',
        borderColor:     '#1D3557',
    },
    categoryText: {
        fontSize: 13,
        color:    '#457B9D',
    },
    categoryTextActive: {
        color: '#fff',
    },
    btnSubmit: {
        backgroundColor: '#E63946',
        borderRadius:    12,
        paddingVertical: 16,
        alignItems:      'center',
        marginTop:       10,
    },
    btnSubmitText: {
        color:      '#fff',
        fontSize:   16,
        fontWeight: '700',
    },
});