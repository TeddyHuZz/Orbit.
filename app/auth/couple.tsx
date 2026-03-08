import { Href, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Clipboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/Auth/AuthButton';
import { AuthInput } from '../../components/Auth/AuthInput';
import { GlassContainer } from '../../components/Auth/GlassContainer';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

export default function CoupleScreen() {
  const { session, setHasSkippedPairing, signOut } = useAuth()!;
  const [ownCode, setOwnCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('pairing_code, partner_id')
        .eq('id', session.user.id)
        .single();

      if (error && status === 406) {
        console.warn('Profile not found for user');
        return;
      }

      if (error) throw error;
      if (data) {
        setOwnCode(data.pairing_code);
        if (data.partner_id) {
          router.replace('/' as Href);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    }
  };

  const handlePairing = async () => {
    if (!partnerCode) {
      Alert.alert('Error', "Please enter your partner's code");
      return;
    }

    if (partnerCode.toUpperCase() === ownCode) {
      Alert.alert('Error', "You cannot pair with yourself!");
      return;
    }

    setLoading(true);
    try {
      // 1. Find partner by code
      const { data: partnerProfile, error: partnerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('pairing_code', partnerCode.toUpperCase())
        .single();

      if (partnerError || !partnerProfile) {
        throw new Error('Invalid code. Please check with your partner.');
      }

      // 2. Update both profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', session?.user.id);

      if (updateError) throw updateError;

      const { error: partnerUpdateError } = await supabase
        .from('profiles')
        .update({ partner_id: session?.user.id })
        .eq('id', partnerProfile.id);

      if (partnerUpdateError) throw partnerUpdateError;

      Alert.alert('Success', "You're now paired!", [
        { text: 'Great!', onPress: () => router.replace('/' as Href) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(ownCode);
    Alert.alert('Copied', 'Your code has been copied to clipboard!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Couple Up</Text>
            <Text style={styles.subtitle}>Connect with your partner to share memories</Text>
          </View>

          <GlassContainer style={styles.glassContainer}>
            <View style={styles.codeSection}>
              <Text style={styles.sectionLabel}>Your Unique Code</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.codeContainer}>
                <Text style={styles.codeText}>{ownCode || '------'}</Text>
                <Text style={styles.copyHint}>Tap to copy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Pair with Partner</Text>
              <AuthInput
                label="Partner's Code"
                placeholder="Enter 6-digit code"
                value={partnerCode}
                onChangeText={(text) => setPartnerCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />

              <AuthButton
                title="Pair Now"
                onPress={handlePairing}
                loading={loading}
                style={styles.pairButton}
              />
            </View>

            <TouchableOpacity 
              onPress={() => {
                setHasSkippedPairing(true);
                router.replace('/' as Href);
              }}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={async () => {
                await signOut();
                router.replace('/auth/login' as Href);
              }}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </GlassContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  glassContainer: {
    padding: 24,
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  codeContainer: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    alignItems: 'center',
    width: '100%',
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  copyHint: {
    fontSize: 12,
    color: '#6C5CE7',
    marginTop: 8,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 24,
  },
  inputSection: {
    width: '100%',
  },
  pairButton: {
    marginTop: 8,
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  signOutButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '500',
  },
});
