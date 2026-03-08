import { GlassContainer } from '@/components/Auth/GlassContainer';
import { AddPlanModal } from '@/components/Home/AddPlanModal';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('date_plans')
        .select('*')
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'date_plans' }, () => {
        fetchPlans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreatePlan = async (newPlan: any) => {
    try {
      const { error } = await supabase
        .from('date_plans')
        .insert([{
          ...newPlan,
          created_by: session?.user.id,
        }]);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      throw error;
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
    try {
      const { error } = await supabase
        .from('date_plans')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update plan');
    }
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
      <GlassContainer style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{item.title}</Text>
          <TouchableOpacity 
            style={styles.moreIcon}
            onPress={() => {
              Alert.alert('Plan Options', 'What would you like to do?', [
                { text: 'Delete', style: 'destructive', onPress: () => handleDeletePlan(item.id) },
                { text: 'Cancel', style: 'cancel' }
              ]);
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
                onPress={() => {
                  // Link opening logic
                }}
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
          <TouchableOpacity 
            style={[styles.statusBadge, item.is_completed && styles.statusBadgeCompleted]}
            onPress={() => togglePlanCompletion(item.id, item.is_completed)}
          >
            <Text style={[styles.statusText, item.is_completed && styles.statusTextCompleted]}>
              {item.is_completed ? 'Completed' : 'Planned'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassContainer>
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
          onPress={() => router.push('/(tabs)/explore')}
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
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: '#6C5CE7' }]}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.addButtonGradient}>
                <Feather name="plus" size={24} color="#FFF" />
              </View>
            </TouchableOpacity>
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
  statusBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
  },
  statusText: {
    fontSize: 11,
    color: '#6C5CE7',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextCompleted: {
    color: '#2ED573',
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
