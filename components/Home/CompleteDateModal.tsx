import { GlassContainer } from '@/components/Auth/GlassContainer';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CompleteDateModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { imageUri?: string; notes: string }) => Promise<void>;
  planTitle: string;
}

export function CompleteDateModal({ visible, onClose, onComplete, planTitle }: CompleteDateModalProps) {
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to save this memory!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onComplete({ imageUri: imageUri || undefined, notes });
      setNotes('');
      setImageUri(null);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save memory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <GlassContainer style={styles.glass}>
            <View style={styles.header}>
              <View>
                <Text style={styles.modalTitle}>Perfect Date! ❤️</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{planTitle}</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Add a final photo (Optional)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} disabled={loading}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholder}>
                    <Feather name="camera" size={32} color="rgba(108, 92, 231, 0.5)" />
                    <Text style={styles.placeholderText}>Capture the moment</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>How was it? Write a memory (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Today was amazing because..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save to Scrapbook</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </GlassContainer>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalView: {
    width: '100%',
    height: '75%',
  },
  glass: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    flex: 1,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    marginTop: 8,
  },
  imagePicker: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    color: '#FFF',
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 5,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
