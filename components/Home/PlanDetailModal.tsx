import { GlassContainer } from '@/components/Auth/GlassContainer';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface PlanDetailModalProps {
  visible: boolean;
  onClose: () => void;
  plan: any;
}

export function PlanDetailModal({ visible, onClose, plan }: PlanDetailModalProps) {
  if (!plan) return null;

  const images = plan.media?.filter((m: any) => m.type === 'image') || [];
  const links = plan.media?.filter((m: any) => m.type === 'link') || [];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open link:', err);
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <GlassContainer style={styles.glass}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {images.length > 0 && (
                <View style={styles.imageGallery}>
                  <Image 
                    source={{ uri: images[0].url }} 
                    style={styles.heroImage}
                  />
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Feather name="map-pin" size={14} color="#6C5CE7" />
                  <Text style={styles.label}>Location</Text>
                </View>
                <Text style={styles.valueText}>
                  {plan.location_name || 'No location set'}
                </Text>
              </View>

              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Feather name="info" size={14} color="#6C5CE7" />
                  <Text style={styles.label}>Description</Text>
                </View>
                <Text style={styles.descriptionText}>
                  {plan.description || 'No description provided.'}
                </Text>
              </View>

              {plan.is_completed && plan.completion_notes && (
                <View style={styles.section}>
                  <GlassContainer style={styles.memoryBox}>
                    <View style={styles.labelRow}>
                      <Ionicons name="heart" size={14} color="#FF4757" />
                      <Text style={[styles.label, { color: '#FF4757' }]}>Our Memories</Text>
                    </View>
                    <Text style={styles.memoryText}>
                      {plan.completion_notes}
                    </Text>
                  </GlassContainer>
                </View>
              )}

              {links.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Feather name="link" size={14} color="#6C5CE7" />
                    <Text style={styles.label}>External Links</Text>
                  </View>
                  <View style={styles.linksContainer}>
                    {links.map((link: any, idx: number) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.linkButton}
                        onPress={() => handleOpenLink(link.url)}
                      >
                        <View style={styles.linkIconContainer}>
                          <Feather name="external-link" size={16} color="#FFF" />
                        </View>
                        <Text style={styles.linkButtonText} numberOfLines={1}>
                          {link.url}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.createdText}>
                  Added on {new Date(plan.created_at).toLocaleDateString()}
                </Text>
              </View>
            </ScrollView>
          </GlassContainer>
        </View>
      </View>
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
    height: '85%',
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
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageGallery: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    opacity: 0.9,
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 26,
  },
  memoryBox: {
    backgroundColor: 'rgba(255, 71, 87, 0.05)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  memoryText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  linksContainer: {
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    gap: 12,
  },
  linkIconContainer: {
    backgroundColor: '#6C5CE7',
    padding: 8,
    borderRadius: 10,
  },
  linkButtonText: {
    color: '#A29BFE',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  createdText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
