import { GlassContainer } from '@/components/Auth/GlassContainer';
import { PlanDetailModal } from '@/components/Home/PlanDetailModal';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScrapbookScreen() {
  const { profile, refreshProfile } = useAuth()!;
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('date_plans')
        .select('*')
        .eq('is_completed', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (error: any) {
      console.error('Error fetching memories:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemories();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:date_plans_scrapbook')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'date_plans',
        filter: 'is_completed=eq.true' 
      }, () => {
        fetchMemories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemories();
    refreshProfile();
  };

  const renderMemoryItem = ({ item }: { item: any }) => {
    // Prioritize memory image, then first regular image
    const images = item.media?.filter((m: any) => m.type === 'image') || [];
    const memoryImage = images.find((m: any) => m.isMemory) || images[0];
    
    return (
      <TouchableOpacity 
        style={styles.cardWrapper}
        activeOpacity={0.9}
        onPress={() => {
          setSelectedPlan(item);
          setDetailVisible(true);
        }}
      >
        <GlassContainer style={styles.memoryCard}>
          <View style={styles.imageContainer}>
            {memoryImage ? (
              <Image source={{ uri: memoryImage.url }} style={styles.memoryImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="heart" size={40} color="rgba(255,255,255,0.1)" />
              </View>
            )}
            <View style={styles.dateOverlay}>
              <Text style={styles.dateText}>
                {new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.memoryTitle} numberOfLines={1}>{item.title}</Text>
            {item.location_name && (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={10} color="#6C5CE7" />
                <Text style={styles.locationText} numberOfLines={1}>{item.location_name}</Text>
              </View>
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
          <Text style={styles.headerTitle}>Our Scrapbook</Text>
          <Text style={styles.headerSubtitle}>Cherishing our journey together</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statCount}>{memories.length}</Text>
          <Text style={styles.statLabel}>Memories</Text>
        </View>
      </View>

      <FlatList
        data={memories}
        renderItem={renderMemoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Feather name="book-open" size={40} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyText}>Your scrapbook is empty</Text>
            <Text style={styles.emptySubtext}>Mark your date plans as "Completed" to see them here!</Text>
          </View>
        }
      />

      <PlanDetailModal
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
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
  statBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#A29BFE',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  memoryCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  memoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 12,
  },
  memoryTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
