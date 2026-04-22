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
    Switch,
    Modal,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const CATEGORIES = [
    { label: 'Electrónica', icon: '📱' },
    { label: 'Ropa',        icon: '👕' },
    { label: 'Hogar',       icon: '🏠' },
    { label: 'Juguetes',    icon: '🧸' },
    { label: 'Deportes',    icon: '⚽' },
    { label: 'Libros',      icon: '📚' },
    { label: 'Autos',       icon: '🚗' },
    { label: 'Otros',       icon: '📦' },
];

const CONDITIONS = [
    { value: 'new',      label: '✨ Nuevo',         desc: 'Sin uso, en caja original' },
    { value: 'like_new', label: '⭐ Como nuevo',     desc: 'Poco uso, perfecto estado' },
    { value: 'good',     label: '👍 Buen estado',    desc: 'Uso normal, funciona perfectamente' },
    { value: 'fair',     label: '🔧 Estado regular', desc: 'Desgaste visible pero funciona' },
];

const LOCATIONS = [
    'Plan 3000', 'Equipetrol', 'Urbarí', 'Los Lotes',
    'Villa 1ro de Mayo', 'Radial 26', 'Palmasola', 'Centro',
    'Norte', 'Sur', 'Este', 'Oeste',
];

const STEPS = [
    { n: 1, label: '📷 Fotos e info' },
    { n: 2, label: '📁 Categoría' },
    { n: 3, label: '🚚 Entrega' },
];

export default function CreateListingScreen() {
    const [title,        setTitle]        = useState('');
    const [description,  setDescription]  = useState('');
    const [price,        setPrice]        = useState('');
    const [category,     setCategory]     = useState('');
    const [condition,    setCondition]    = useState('good');
    const [delivery,     setDelivery]     = useState(false);
    const [deliveryCost, setDeliveryCost] = useState('');
    const [location,     setLocation]     = useState('');
    const [images,       setImages]       = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [step,         setStep]         = useState(1);
    const [showImgModal, setShowImgModal] = useState(false);
    const [previewImg,   setPreviewImg]   = useState(null);

    const openImageModal = () => {
        if (images.length >= 5) {
            Alert.alert('Máximo 5 fotos', 'Ya tienes el máximo permitido');
            return;
        }
        setShowImgModal(true);
    };

    const pickImage = async () => {
        setShowImgModal(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso requerido'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes:    ['images'],
            allowsEditing: true,
            aspect:        [4, 3],
            quality:       0.8,
        });
        if (!result.canceled) setImages(prev => [...prev, result.assets[0]]);
    };

    const takePhoto = async () => {
        setShowImgModal(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso requerido'); return; }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect:        [4, 3],
            quality:       0.8,
        });
        if (!result.canceled) setImages(prev => [...prev, result.assets[0]]);
    };

    const removeImage = (index) => {
        Alert.alert('Eliminar foto', '¿Eliminar esta foto?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive',
                onPress: () => setImages(prev => prev.filter((_, i) => i !== index)),
            },
        ]);
    };

    const uploadImage = async (imageAsset) => {
        const formData = new FormData();
        formData.append('file', { uri: imageAsset.uri, type: 'image/jpeg', name: 'listing.jpg' });
        formData.append('upload_preset', 'cachivacheros');
        formData.append('cloud_name',    'duwvw6q2c');
        const response = await fetch(
            'https://api.cloudinary.com/v1_1/duwvw6q2c/image/upload',
            { method: 'POST', body: formData }
        );
        const data = await response.json();
        return { url: data.secure_url, public_id: data.public_id };
    };

    const validateStep1 = () => {
        if (!title.trim())       { Alert.alert('Falta el título');          return false; }
        if (!description.trim()) { Alert.alert('Falta la descripción');     return false; }
        if (!price.trim())       { Alert.alert('Falta el precio');          return false; }
        if (isNaN(parseFloat(price))) { Alert.alert('Precio inválido');     return false; }
        if (images.length === 0) { Alert.alert('Agrega al menos una foto'); return false; }
        return true;
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setPrice('');
        setCategory(''); setCondition('good');
        setDelivery(false); setDeliveryCost('');
        setLocation(''); setImages([]);
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!category) { Alert.alert('Selecciona una categoría'); return; }
        setLoading(true);
        try {
            const uploaded    = await Promise.all(images.map(uploadImage));
            const mainImage   = uploaded[0];
            const extraImages = uploaded.slice(1).map(u => u.url);

            await api.post('/listings', {
                title,
                description,
                price:                parseFloat(price),
                category,
                condition,
                delivery,
                delivery_cost:        delivery ? parseFloat(deliveryCost || '0') : null,
                location,
                image_url:            mainImage.url,
                cloudinary_public_id: mainImage.public_id,
                images:               extraImages,
            });

            Alert.alert(
                '¡Publicado! 🎉',
                'Tu producto ya está visible en Cachivacheros',
                [{ text: 'Ver mis publicaciones', onPress: resetForm }]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo publicar. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header con pasos */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>➕ Nueva publicación</Text>
                <View style={styles.stepsRow}>
                    {STEPS.map((s, i) => (
                        <View key={s.n} style={{ flexDirection: 'row', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                            <TouchableOpacity
                                style={[styles.stepCircle, step >= s.n && styles.stepCircleActive]}
                                onPress={() => step > s.n && setStep(s.n)}
                            >
                                {step > s.n
                                    ? <Text style={styles.stepCheck}>✓</Text>
                                    : <Text style={[styles.stepNum, step === s.n && styles.stepNumActive]}>{s.n}</Text>
                                }
                            </TouchableOpacity>
                            {i < STEPS.length - 1 && (
                                <View style={[styles.stepLine, step > s.n && styles.stepLineActive]} />
                            )}
                        </View>
                    ))}
                </View>
                <Text style={styles.stepLabel}>{STEPS[step - 1].label}</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.form}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── PASO 1 ── */}
                    {step === 1 && (
                        <>
                            {/* Fotos */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>📷 Fotos del producto</Text>
                                <Text style={styles.sectionBadge}>{images.length}/5</Text>
                            </View>
                            <Text style={styles.sectionSub}>La primera foto será la portada · Mantén para eliminar</Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 4 }}
                                contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                            >
                                {images.map((img, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.imageThumb}
                                        onPress={() => setPreviewImg(img.uri)}
                                        onLongPress={() => removeImage(i)}
                                    >
                                        <Image source={{ uri: img.uri }} style={styles.imageThumbImg} />
                                        {i === 0 && (
                                            <View style={styles.mainBadge}>
                                                <Text style={styles.mainBadgeTxt}>Portada</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✕</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                                {images.length < 5 && (
                                    <TouchableOpacity style={styles.addImageBtn} onPress={openImageModal}>
                                        <Text style={{ fontSize: 28 }}>📷</Text>
                                        <Text style={styles.addImageTxt}>Agregar foto</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>

                            {/* Título */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>📝 Información</Text>
                            </View>

                            <Text style={styles.label}>Título *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="¿Qué estás vendiendo?"
                                placeholderTextColor="#aaa"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                                returnKeyType="next"
                            />
                            <Text style={styles.charCount}>{title.length}/100</Text>

                            <Text style={styles.label}>Descripción *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe tu producto: marca, modelo, accesorios incluidos, motivo de venta, tiempo de uso..."
                                placeholderTextColor="#aaa"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                maxLength={1000}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>{description.length}/1000</Text>

                            <Text style={styles.label}>Precio en Bolivianos (Bs.) *</Text>
                            <View style={styles.priceRow}>
                                <View style={styles.prePriceBox}>
                                    <Text style={styles.pricePre}>Bs.</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.priceInput]}
                                    placeholder="0.00"
                                    placeholderTextColor="#aaa"
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            {/* Tips */}
                            <View style={styles.tipBox}>
                                <Text style={styles.tipTitle}>💡 Tips para vender más rápido</Text>
                                <Text style={styles.tipItem}>• Usa fotos con buena iluminación</Text>
                                <Text style={styles.tipItem}>• Sé específico en la descripción</Text>
                                <Text style={styles.tipItem}>• Pon un precio justo y negociable</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.nextBtn}
                                onPress={() => validateStep1() && setStep(2)}
                            >
                                <Text style={styles.nextBtnTxt}>Siguiente → Categoría</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── PASO 2 ── */}
                    {step === 2 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>📁 Categoría *</Text>
                            </View>
                            <View style={styles.categoriesGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.label}
                                        style={[styles.catBtn, category === cat.label && styles.catBtnActive]}
                                        onPress={() => setCategory(cat.label)}
                                    >
                                        <Text style={styles.catIcon}>{cat.icon}</Text>
                                        <Text style={[styles.catLabel, category === cat.label && styles.catLabelActive]}>
                                            {cat.label}
                                        </Text>
                                        {category === cat.label && (
                                            <View style={styles.catCheck}>
                                                <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🔍 Estado del producto *</Text>
                            </View>
                            {CONDITIONS.map((c) => (
                                <TouchableOpacity
                                    key={c.value}
                                    style={[styles.conditionBtn, condition === c.value && styles.conditionBtnActive]}
                                    onPress={() => setCondition(c.value)}
                                >
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Text style={styles.conditionLabel}>{c.label}</Text>
                                        <Text style={styles.conditionDesc}>{c.desc}</Text>
                                    </View>
                                    <View style={[styles.conditionRadio, condition === c.value && styles.conditionRadioActive]}>
                                        {condition === c.value && <View style={styles.conditionRadioDot} />}
                                    </View>
                                </TouchableOpacity>
                            ))}

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>📍 Zona en Santa Cruz</Text>
                                <Text style={styles.sectionBadgeGray}>opcional</Text>
                            </View>
                            <View style={styles.locationsGrid}>
                                {LOCATIONS.map((loc) => (
                                    <TouchableOpacity
                                        key={loc}
                                        style={[styles.locBtn, location === loc && styles.locBtnActive]}
                                        onPress={() => setLocation(location === loc ? '' : loc)}
                                    >
                                        <Text style={[styles.locTxt, location === loc && styles.locTxtActive]}>
                                            📍 {loc}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.navRow}>
                                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                    <Text style={styles.backBtnTxt}>← Atrás</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.nextBtn}
                                    onPress={() => {
                                        if (!category) { Alert.alert('Selecciona una categoría'); return; }
                                        setStep(3);
                                    }}
                                >
                                    <Text style={styles.nextBtnTxt}>Siguiente → Entrega</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ── PASO 3 ── */}
                    {step === 3 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🚚 Servicio de delivery</Text>
                            </View>

                            <View style={styles.deliveryToggle}>
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={styles.deliveryToggleTitle}>¿Ofreces entrega a domicilio?</Text>
                                    <Text style={styles.deliveryToggleSub}>
                                        {delivery ? '✅ Sí, llevas el producto al comprador' : 'El comprador recoge el producto'}
                                    </Text>
                                </View>
                                <Switch
                                    value={delivery}
                                    onValueChange={setDelivery}
                                    trackColor={{ false: '#ddd', true: '#A8DADC' }}
                                    thumbColor={delivery ? '#1D3557' : '#f4f3f4'}
                                />
                            </View>

                            {delivery && (
                                <>
                                    <Text style={styles.label}>Costo de delivery (Bs.)</Text>
                                    <View style={styles.priceRow}>
                                        <View style={styles.prePriceBox}>
                                            <Text style={styles.pricePre}>Bs.</Text>
                                        </View>
                                        <TextInput
                                            style={[styles.input, styles.priceInput]}
                                            placeholder="0.00 (escribe 0 si es gratis)"
                                            placeholderTextColor="#aaa"
                                            value={deliveryCost}
                                            onChangeText={setDeliveryCost}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                    <Text style={styles.deliveryHint}>
                                        💡 El costo de delivery gratis atrae más compradores
                                    </Text>
                                </>
                            )}

                            {/* Resumen completo */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>📋 Resumen final</Text>
                            </View>
                            <View style={styles.summary}>
                                <View style={styles.summaryImageRow}>
                                    {images[0] && (
                                        <Image source={{ uri: images[0].uri }} style={styles.summaryImage} />
                                    )}
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <Text style={styles.summaryProductTitle} numberOfLines={2}>{title}</Text>
                                        <Text style={styles.summaryPrice}>Bs. {parseFloat(price || '0').toFixed(2)}</Text>
                                        <Text style={styles.summaryCategory}>{category}</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryDivider} />
                                {[
                                    { k: 'Estado',    v: CONDITIONS.find(c => c.value === condition)?.label },
                                    { k: 'Zona',      v: location || 'No especificada' },
                                    { k: 'Delivery',  v: delivery ? `Sí · Bs. ${parseFloat(deliveryCost || '0').toFixed(2)}` : 'No' },
                                    { k: 'Fotos',     v: `${images.length} foto${images.length !== 1 ? 's' : ''}` },
                                ].map(({ k, v }) => (
                                    <View key={k} style={styles.summaryRow}>
                                        <Text style={styles.summaryKey}>{k}</Text>
                                        <Text style={styles.summaryVal} numberOfLines={1}>{v}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.navRow}>
                                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                                    <Text style={styles.backBtnTxt}>← Atrás</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.publishBtn}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.publishBtnTxt}>🚀 Publicar ahora</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal agregar imagen */}
            <Modal
                visible={showImgModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowImgModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowImgModal(false)}>
                    <Pressable style={styles.modalCard}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>📷 Agregar foto</Text>
                        <Text style={styles.modalSub}>{images.length}/5 fotos · {5 - images.length} disponibles</Text>

                        <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                            <View style={styles.modalOptionIcon}>
                                <Text style={{ fontSize: 28 }}>📷</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalOptionTitle}>Tomar foto ahora</Text>
                                <Text style={styles.modalOptionSub}>Usa la cámara de tu celular</Text>
                            </View>
                            <Text style={{ color: '#A8DADC', fontSize: 22 }}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                            <View style={styles.modalOptionIcon}>
                                <Text style={{ fontSize: 28 }}>🖼️</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalOptionTitle}>Elegir de galería</Text>
                                <Text style={styles.modalOptionSub}>Selecciona una foto existente</Text>
                            </View>
                            <Text style={{ color: '#A8DADC', fontSize: 22 }}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setShowImgModal(false)}
                        >
                            <Text style={styles.modalCancelTxt}>Cancelar</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Preview imagen completa */}
            <Modal
                visible={!!previewImg}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewImg(null)}
            >
                <Pressable style={styles.previewOverlay} onPress={() => setPreviewImg(null)}>
                    <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImg(null)}>
                        <Text style={{ color: '#fff', fontSize: 26 }}>✕</Text>
                    </TouchableOpacity>
                    {previewImg && (
                        <Image source={{ uri: previewImg }} style={styles.previewImg} resizeMode="contain" />
                    )}
                    <Text style={styles.previewHint}>Toca fuera para cerrar</Text>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:            { flex: 1, backgroundColor: '#F1FAEE' },
    header:               { backgroundColor: '#1D3557', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, gap: 10 },
    headerTitle:          { color: '#fff', fontSize: 20, fontWeight: '700' },
    stepsRow:             { flexDirection: 'row', alignItems: 'center' },
    stepCircle:           { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff25', justifyContent: 'center', alignItems: 'center' },
    stepCircleActive:     { backgroundColor: '#E63946' },
    stepNum:              { color: '#ffffff60', fontSize: 13, fontWeight: '700' },
    stepNumActive:        { color: '#fff' },
    stepCheck:            { color: '#fff', fontSize: 14, fontWeight: '700' },
    stepLine:             { flex: 1, height: 2, backgroundColor: '#ffffff20', marginHorizontal: 6 },
    stepLineActive:       { backgroundColor: '#E63946' },
    stepLabel:            { color: '#A8DADC', fontSize: 12 },
    form:                 { padding: 16, gap: 12 },
    sectionHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    sectionTitle:         { fontSize: 15, fontWeight: '700', color: '#1D3557' },
    sectionBadge:         { backgroundColor: '#E63946', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    sectionBadgeGray:     { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 11, color: '#888' },
    sectionSub:           { fontSize: 12, color: '#888', marginTop: -8 },
    label:                { fontSize: 13, fontWeight: '600', color: '#1D3557' },
    charCount:            { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: -8 },
    imageThumb:           { width: 95, height: 95, borderRadius: 12, position: 'relative' },
    imageThumbImg:        { width: 95, height: 95, borderRadius: 12, resizeMode: 'cover' },
    mainBadge:            { position: 'absolute', bottom: 5, left: 5, backgroundColor: '#1D3557cc', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    mainBadgeTxt:         { color: '#fff', fontSize: 9, fontWeight: '700' },
    removeImg:            { position: 'absolute', top: 5, right: 5, backgroundColor: '#E63946', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    addImageBtn:          { width: 95, height: 95, borderRadius: 12, borderWidth: 2, borderColor: '#A8DADC', borderStyle: 'dashed', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', gap: 4 },
    addImageTxt:          { fontSize: 11, color: '#457B9D', textAlign: 'center' },
    input:                { backgroundColor: '#fff', borderWidth: 1, borderColor: '#A8DADC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1D3557' },
    textArea:             { height: 130, textAlignVertical: 'top', paddingTop: 12 },
    priceRow:             { flexDirection: 'row', alignItems: 'center' },
    prePriceBox:          { backgroundColor: '#1D3557', paddingHorizontal: 16, paddingVertical: 13, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center' },
    pricePre:             { color: '#fff', fontWeight: '700', fontSize: 16 },
    priceInput:           { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
    tipBox:               { backgroundColor: '#E8F4FD', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#A8DADC', gap: 4 },
    tipTitle:             { fontSize: 13, fontWeight: '700', color: '#1D3557', marginBottom: 4 },
    tipItem:              { fontSize: 12, color: '#457B9D', lineHeight: 18 },
    categoriesGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catBtn:               { width: '22%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#A8DADC', justifyContent: 'center', alignItems: 'center', gap: 4, position: 'relative' },
    catBtnActive:         { backgroundColor: '#1D3557', borderColor: '#1D3557' },
    catIcon:              { fontSize: 26 },
    catLabel:             { fontSize: 10, color: '#457B9D', textAlign: 'center' },
    catLabelActive:       { color: '#A8DADC' },
    catCheck:             { position: 'absolute', top: 4, right: 4, backgroundColor: '#E63946', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
    conditionBtn:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', gap: 12 },
    conditionBtnActive:   { borderColor: '#1D3557', backgroundColor: '#E8F4FD' },
    conditionLabel:       { fontSize: 14, fontWeight: '600', color: '#1D3557' },
    conditionDesc:        { fontSize: 12, color: '#888' },
    conditionRadio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    conditionRadioActive: { borderColor: '#1D3557' },
    conditionRadioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D3557' },
    locationsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    locBtn:               { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#A8DADC' },
    locBtnActive:         { backgroundColor: '#1D3557', borderColor: '#1D3557' },
    locTxt:               { fontSize: 13, color: '#457B9D' },
    locTxtActive:         { color: '#fff' },
    deliveryToggle:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', gap: 12 },
    deliveryToggleTitle:  { fontSize: 15, fontWeight: '600', color: '#1D3557' },
    deliveryToggleSub:    { fontSize: 12, color: '#888', marginTop: 2 },
    deliveryHint:         { fontSize: 12, color: '#457B9D', fontStyle: 'italic' },
    summary:              { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', gap: 10 },
    summaryImageRow:      { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 4 },
    summaryImage:         { width: 70, height: 70, borderRadius: 10, resizeMode: 'cover' },
    summaryProductTitle:  { fontSize: 15, fontWeight: '700', color: '#1D3557' },
    summaryPrice:         { fontSize: 18, fontWeight: '800', color: '#E63946' },
    summaryCategory:      { fontSize: 12, color: '#888' },
    summaryDivider:       { height: 1, backgroundColor: '#eee' },
    summaryRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryKey:           { fontSize: 13, color: '#888' },
    summaryVal:           { fontSize: 13, color: '#1D3557', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    navRow:               { flexDirection: 'row', gap: 12, marginTop: 4 },
    backBtn:              { flex: 1, borderWidth: 1.5, borderColor: '#A8DADC', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    backBtnTxt:           { color: '#457B9D', fontSize: 15, fontWeight: '600' },
    nextBtn:              { flex: 2, backgroundColor: '#1D3557', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    nextBtnTxt:           { color: '#fff', fontSize: 15, fontWeight: '700' },
    publishBtn:           { flex: 2, backgroundColor: '#E63946', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    publishBtnTxt:        { color: '#fff', fontSize: 15, fontWeight: '700' },
    modalOverlay:         { flex: 1, backgroundColor: '#00000065', justifyContent: 'flex-end' },
    modalCard:            { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 40 },
    modalHandle:          { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 6 },
    modalTitle:           { fontSize: 18, fontWeight: '700', color: '#1D3557' },
    modalSub:             { fontSize: 13, color: '#888', marginTop: -8 },
    modalOption:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1FAEE', borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: '#A8DADC' },
    modalOptionIcon:      { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    modalOptionTitle:     { fontSize: 15, fontWeight: '600', color: '#1D3557' },
    modalOptionSub:       { fontSize: 12, color: '#888', marginTop: 2 },
    modalCancelBtn:       { backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    modalCancelTxt:       { color: '#888', fontSize: 15, fontWeight: '600' },
    previewOverlay:       { flex: 1, backgroundColor: '#000000ee', justifyContent: 'center', alignItems: 'center' },
    previewClose:         { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
    previewImg:           { width: '100%', height: '75%' },
    previewHint:          { position: 'absolute', bottom: 60, color: '#ffffff80', fontSize: 13 },
});