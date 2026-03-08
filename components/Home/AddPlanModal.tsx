import { Feather, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Image as RNImage,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AuthButton } from '../Auth/AuthButton';
import { GlassContainer } from '../Auth/GlassContainer';

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (plan: any) => Promise<void>;
}

export function AddPlanModal({ visible, onClose, onSave }: AddPlanModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setUserCoords({
              lat: location.coords.latitude,
              lon: location.coords.longitude
            });
          }
        } catch (error) {
          console.warn('Could not get user location:', error);
        }
      })();
    }
  }, [visible]);

  const pickImage = async () => {
    Alert.alert('Build in Progress', 'Image picking requires a new native build. Please wait for your terminal build to finish, then this feature will be available!');
  };

  const searchLocation = async (query: string) => {
    setLocation(query);
    setShowNoResults(false);
    
    // Clear any pending search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length < 3) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    // Debounce the search by 800ms for better responsiveness
    searchTimeout.current = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        // Build bias params
        let biasParams = '&countrycodes=my'; // Default bias to Malaysia
        if (userCoords) {
          // Viewbox around user coords (~10km)
          const delta = 0.1; 
          biasParams += `&viewbox=${userCoords.lon - delta},${userCoords.lat + delta},${userCoords.lon + delta},${userCoords.lat - delta}&bounded=0`;
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5${biasParams}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'OrbitApp/1.0',
            },
          }
        );
        
        if (response.status === 429) {
          console.warn('Location search rate limited - slowing down');
          return;
        }

        if (!response.ok) {
          throw new Error(`Location search failed with status: ${response.status}`);
        }

        const data = await response.json();
        setLocationSuggestions(data);
        if (data.length === 0) {
          setShowNoResults(true);
        }
      } catch (error) {
        console.error('Location search error:', error);
        setLocationSuggestions([]);
        setShowNoResults(true);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 1200);
  };

  const selectLocation = (item: any) => {
    setLocation(item.display_name);
    setLocationSuggestions([]);
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title for your date!');
      return;
    }

    setLoading(true);
    try {
      const media = [];
      if (selectedImage) media.push({ type: 'image', url: selectedImage });
      if (link) media.push({ type: 'link', url: link });

      await onSave({
        title,
        description,
        location_name: location,
        media,
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setLink('');
      setSelectedImage(null);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalView}
        >
          <GlassContainer style={styles.glass}>
            <View style={styles.header}>
              <Text style={styles.title}>New Date Plan</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>What's the plan?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Romantic Dinner"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationInputContainer}>
                  <Feather name="map-pin" size={16} color="#6C5CE7" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 40, paddingRight: 80 }]}
                    placeholder="Where are we going?"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={location}
                    onChangeText={searchLocation}
                  />
                  {location.length > 0 && !isSearchingLocation && (
                    <TouchableOpacity 
                      style={styles.clearIcon} 
                      onPress={() => {
                        setLocation('');
                        setLocationSuggestions([]);
                        setShowNoResults(false);
                      }}
                    >
                      <Feather name="x-circle" size={16} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  )}
                  {isSearchingLocation && (
                    <View style={styles.searchLoader}>
                      <Text style={styles.searchingText}>Searching...</Text>
                    </View>
                  )}
                </View>

                {locationSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {locationSuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectLocation(item)}
                      >
                        <Feather name="map-pin" size={14} color="#6C5CE7" />
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {showNoResults && !isSearchingLocation && (
                  <View style={styles.suggestionsContainer}>
                    <View style={styles.noResultsItem}>
                      <Feather name="info" size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.noResultsText}>No locations found. Try being more specific.</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes / Details</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any extra details..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>External Link</Text>
                <View style={styles.locationInputContainer}>
                  <Feather name="link" size={16} color="#6C5CE7" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 40 }]}
                    placeholder="Menu or Google Maps link"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={link}
                    onChangeText={setLink}
                  />
                </View>
              </View>

              <View style={styles.mediaSection}>
                <Text style={styles.label}>Add a Picture</Text>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <RNImage source={{ uri: selectedImage }} style={styles.selectedImage} />
                    <TouchableOpacity 
                      style={styles.removeImageIcon}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF4757" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <View style={styles.imagePickerInner}>
                      <Feather name="camera" size={24} color="#6C5CE7" />
                      <Text style={styles.imagePickerText}>Select an image</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <AuthButton
                title="Create Plan"
                onPress={handleSave}
                loading={loading}
                style={styles.saveButton}
              />
            </ScrollView>
          </GlassContainer>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)', // Darker overlay for better focus
  },
  modalView: {
    width: '100%',
    maxHeight: '90%',
  },
  glass: {
    backgroundColor: '#1A1A2E', // Solid background for better visibility on Android
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 24,
    paddingTop: 8,
  },
  label: {
    fontSize: 13,
    color: '#6C5CE7', // Primary color for labels
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  mediaSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  imagePickerButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderRadius: 20,
    padding: 32,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerInner: {
    alignItems: 'center',
    gap: 12,
  },
  imagePickerText: {
    color: '#A29BFE',
    fontSize: 15,
    fontWeight: '700',
  },
  selectedImageContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
  },
  searchingText: {
    fontSize: 10,
    color: '#6C5CE7',
    fontWeight: '700',
  },
  clearIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  suggestionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    flex: 1,
  },
  noResultsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  saveButton: {
    height: 60,
    borderRadius: 18,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }
});
