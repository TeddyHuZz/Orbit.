import { GlassContainer } from '@/components/Auth/GlassContainer';
import { AddPlanModal } from '@/components/Home/AddPlanModal';
import { CompleteDateModal } from '@/components/Home/CompleteDateModal';
import { DecisionWheelModal } from '@/components/Home/DecisionWheelModal';
import { PlanDetailModal } from '@/components/Home/PlanDetailModal';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Href, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { session, profile, refreshProfile } = useAuth()!;
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [planToComplete, setPlanToComplete] = useState<any>(null);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('date_plans')
        .select('*')
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:date_plans')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'date_plans',
        filter: 'is_completed=eq.false'
      }, () => {
        fetchPlans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      const fileName = `${session?.user.id}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('date-plans')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('date-plans')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image to cloud');
    }
  };

  const handleCreatePlan = async (newPlan: any) => {
    try {
      setLoading(true);
      let updatedMedia = [...(newPlan.media || [])];
      
      // Upload image if exists
      const imageMedia = updatedMedia.find(m => m.type === 'image');
      if (imageMedia && imageMedia.url && imageMedia.url.startsWith('file')) {
        const publicUrl = await uploadImage(imageMedia.url);
        imageMedia.url = publicUrl;
      }

      const { error } = await supabase
        .from('date_plans')
        .insert([{
          ...newPlan,
          media: updatedMedia,
          created_by: session?.user.id,
        }]);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('date_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete plan');
    }
  };

  const togglePlanCompletion = async (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      // If marking as complete, show memory modal
      const plan = plans.find(p => p.id === id);
      setPlanToComplete(plan);
      setCompleteModalVisible(true);
      return;
    }

    // If reverting from completed (only from menu)
    try {
      const { error } = await supabase
        .from('date_plans')
        .update({ is_completed: false })
        .eq('id', id);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update plan');
    }
  };

  const handleCompleteDate = async (memoryData: { imageUri?: string; notes: string }) => {
    if (!planToComplete) return;

    try {
      let updatedMedia = [...(planToComplete.media || [])];
      
      if (memoryData.imageUri) {
        const publicUrl = await uploadImage(memoryData.imageUri);
        updatedMedia.push({ type: 'image', url: publicUrl, isMemory: true });
      }

      const { error } = await supabase
        .from('date_plans')
        .update({ 
          is_completed: true,
          completion_notes: memoryData.notes,
          media: updatedMedia,
          updated_at: new Date().toISOString()
        })
        .eq('id', planToComplete.id);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      throw error;
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open link:', err);
      Alert.alert('Error', 'Could not open this link.');
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
    refreshProfile();
  };

  const renderPlanItem = ({ item }: { item: any }) => {
    const images = item.media?.filter((m: any) => m.type === 'image') || [];
    const links = item.media?.filter((m: any) => m.type === 'link') || [];

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => {
          setSelectedPlan(item);
          setDetailVisible(true);
        }}
      >
        <GlassContainer style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{item.title}</Text>
          <TouchableOpacity 
            style={styles.moreIcon}
            onPress={() => {
              const options = [
                { text: 'Delete', style: 'destructive', onPress: () => handleDeletePlan(item.id) },
                { text: 'Cancel', style: 'cancel' }
              ];
              
              if (item.is_completed) {
                options.unshift({ 
                  text: 'Revert to Planned', 
                  onPress: () => togglePlanCompletion(item.id, true) 
                } as any);
              }

              Alert.alert('Plan Options', 'What would you like to do?', options as any);
            }}
          >
            <Feather name="more-horizontal" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
        
        {images.length > 0 && (
          <View style={styles.imageGallery}>
            <Image 
              source={{ uri: images[0].url }} 
              style={styles.planImage}
            />
          </View>
        )}

        {item.location_name && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={14} color="#6C5CE7" />
            <Text style={styles.infoText}>{item.location_name}</Text>
          </View>
        )}
        
        {item.description && (
          <Text style={styles.planDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {links.length > 0 && (
          <View style={styles.linksRow}>
            {links.map((link: any, idx: number) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.linkBadge}
                onPress={() => handleOpenLink(link.url)}
              >
                <Feather name="link" size={12} color="#FFF" />
                <Text style={styles.linkText} numberOfLines={1}>External Link</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.planFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          
          {item.is_completed ? (
            <View style={styles.statusBadgeCompleted}>
              <Text style={styles.statusTextCompleted}>Completed</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.completeActionButton}
              onPress={() => togglePlanCompletion(item.id, item.is_completed)}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color="#FFF" />
              <Text style={styles.completeActionText}>Mark as Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassContainer>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F0C29' }]} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Our Orbit</Text>
          <Text style={styles.headerSubtitle}>
            {profile?.partner_id ? 'Connected' : 'Waiting for partner...'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileIcon}
          onPress={() => router.push('/profile' as Href)}
        >
          <Ionicons name="person-circle-outline" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderPlanItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Date Ideas</Text>
            <View style={styles.headerActions}>
              {plans.length > 1 && (
                <TouchableOpacity 
                  style={styles.pickForUsButton}
                  onPress={() => setWheelVisible(true)}
                >
                  <Ionicons name="dice-outline" size={20} color="#FFF" />
                  <Text style={styles.pickForUsText}>Pick for Us</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#6C5CE7' }]}
                onPress={() => setModalVisible(true)}
              >
                <View style={styles.addButtonGradient}>
                  <Feather name="plus" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={60} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No date plans yet.</Text>
            <Text style={styles.emptySubtext}>Surprise your partner with a new idea!</Text>
          </View>
        }
      />

      <AddPlanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleCreatePlan}
      />

      <PlanDetailModal
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />

      <CompleteDateModal
        visible={completeModalVisible}
        onClose={() => {
          setCompleteModalVisible(false);
          setPlanToComplete(null);
        }}
        onComplete={handleCompleteDate}
        planTitle={planToComplete?.title || ''}
      />

      <DecisionWheelModal
        visible={wheelVisible}
        onClose={() => setWheelVisible(false)}
        plans={plans}
        onResult={(plan) => {
          setSelectedPlan(plan);
          setDetailVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
    marginTop: 2,
  },
  profileIcon: {
    padding: 4,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  addButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonGradient: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickForUsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickForUsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  planCard: {
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  moreIcon: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  planDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
    marginBottom: 16,
  },
  imageGallery: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  planImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  linkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  linkText: {
    fontSize: 12,
    color: '#A29BFE',
    fontWeight: '600',
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.3)',
  },
  statusTextCompleted: {
    color: '#2ED573',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  completeActionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    textAlign: 'center',
  }
});
