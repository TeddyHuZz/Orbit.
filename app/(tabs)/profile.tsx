import { AuthButton } from '@/components/Auth/AuthButton';
import { AuthInput } from '@/components/Auth/AuthInput';
import { GlassContainer } from '@/components/Auth/GlassContainer';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Clipboard,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { session, signOut } = useAuth()!;
  const [profile, setProfile] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partnerCode, setPartnerCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data: ownProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(ownProfile);

      if (ownProfile.partner_id) {
        const { data: partnerProfile, error: partnerError } = await supabase
          .from('profiles')
          .select('email, id')
          .eq('id', ownProfile.partner_id)
          .single();
        
        if (!partnerError) {
          setPartner(partnerProfile);
        }
      } else {
        setPartner(null);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePairing = async () => {
    if (!partnerCode) {
      Alert.alert('Error', "Please enter your partner's code");
      return;
    }

    if (partnerCode.toUpperCase() === profile?.pairing_code) {
      Alert.alert('Error', "You cannot pair with yourself!");
      return;
    }

    setPairingLoading(true);
    try {
      const { data: partnerProfile, error: partnerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('pairing_code', partnerCode.toUpperCase())
        .single();

      if (partnerError || !partnerProfile) {
        throw new Error('Invalid code. Please check with your partner.');
      }

      await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', session?.user.id);

      await supabase
        .from('profiles')
        .update({ partner_id: session?.user.id })
        .eq('id', partnerProfile.id);

      Alert.alert('Success', "You're now paired!");
      fetchData();
      setPartnerCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setPairingLoading(false);
    }
  };

  const handleUncouple = () => {
    Alert.alert(
      'Uncouple?',
      'Are you sure you want to disconnect? You will no longer see shared plans.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Uncouple', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (partner?.id) {
                await supabase.from('profiles').update({ partner_id: null }).eq('id', partner.id);
              }
              await supabase.from('profiles').update({ partner_id: null }).eq('id', session?.user.id);
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const copyCode = () => {
    if (profile?.pairing_code) {
      Clipboard.setString(profile.pairing_code);
      Alert.alert('Copied', 'Pairing code copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login' as Href);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradientBackground />
            <Text style={styles.avatarText}>
              {session?.user.email?.[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.emailText}>{session?.user.email}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {partner ? 'PAIRED' : 'SOLO'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionsContainer}>
          <GlassContainer style={styles.section}>
            <Text style={styles.sectionTitle}>Identity</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="key-outline" size={20} color="#6C5CE7" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pairing Code</Text>
                <TouchableOpacity onPress={copyCode} style={styles.codeRow}>
                  <Text style={styles.infoValue}>{profile?.pairing_code || '---'}</Text>
                  <Ionicons name="copy-outline" size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassContainer>

          {partner ? (
            <GlassContainer style={styles.section}>
              <Text style={styles.sectionTitle}>Relationship</Text>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: 'rgba(255, 82, 82, 0.1)' }]}>
                  <Ionicons name="heart" size={20} color="#FF5252" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Linked Partner</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{partner.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.uncoupleButton} onPress={handleUncouple}>
                <Text style={styles.uncoupleText}>Uncouple Partner</Text>
              </TouchableOpacity>
            </GlassContainer>
          ) : (
            <GlassContainer style={styles.section}>
              <Text style={styles.sectionTitle}>Couple Up</Text>
              <AuthInput
                label="Partner's Code"
                placeholder="6-digit code"
                value={partnerCode}
                onChangeText={(text) => setPartnerCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
              <AuthButton
                title="Connect Now"
                onPress={handlePairing}
                loading={pairingLoading}
                style={styles.pairButton}
              />
            </GlassContainer>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const LinearGradientBackground = () => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#6C5CE7', borderRadius: 40, opacity: 0.2 }]} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6C5CE7',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  sectionsContainer: {
    flex: 1,
    gap: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  pairButton: {
    marginTop: 8,
    height: 52,
  },
  uncoupleButton: {
    marginTop: 16,
    paddingTop: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  uncoupleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5252',
    opacity: 0.8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    marginBottom: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF5252',
  },
});
